import express, { type NextFunction, type Request, type Response } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { randomBytes } from 'node:crypto';
import { db, id, now, parseJson, updateMetric } from './db/connection.ts';
import { migrateDatabase } from './db/migrations.ts';
import { buildGuidance, buildProgress, createAccountability, generateMatches, scheduleSuggestions } from './services/workflowLogic.ts';
import { deliverPasswordReset } from './services/passwordResetDelivery.ts';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errors.ts';
import { requestTelemetry } from './middleware/requestTelemetry.ts';
import { schemas, validateBody, validateParams } from './middleware/validation.ts';
import { monitoringSnapshot } from './observability/monitoring.ts';
import { hashPassword, isPasswordHash, verifyPassword } from './security/password.ts';
import { rateLimit } from './security/rateLimit.ts';
import {
  cleanupExpiredSessions,
  clearSessionCookie,
  createSession,
  resetTokenExpiry,
  revokeAllSessions,
  revokeCurrentSession,
  sessionUser,
  tokenHash
} from './security/session.ts';

migrateDatabase();
cleanupExpiredSessions();
export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(requestTelemetry);
app.use(express.json({ limit: '256kb' }));

const fail = (res: Response, status: number, message: string) => res.status(status).json({ error: message });
const authUser = (req: Request) => sessionUser(req);
const userDto = (r: Record<string, any>) => ({ id: r.id, name: r.name, email: r.email, university: r.university, className: r.class_name, isPro: Boolean(r.is_pro), createdAt: r.created_at });
const profileDto = (r: Record<string, any>) => ({ id: r.id, userId: r.user_id, fullName: '', email: '', course: r.course, subject: r.subject, university: r.university, className: r.class_name, major: `${r.course}, ${r.subject}`, studyGoal: r.study_goal, preferredStudyTime: r.preferred_study_time, learningStyle: r.learning_style, learningStyles: [r.learning_style], availability: parseJson(r.availability, []), studyPreference: r.study_preference, timeOfDay: [r.preferred_study_time], profileCompleted: Boolean(r.profile_completed), createdAt: r.created_at, updatedAt: r.updated_at });
const matchDto = (r: Record<string, any>) => ({ id: r.id, userId: r.user_id, candidateUserId: r.candidate_user_id, conversationId: r.conversation_id, candidateName: r.candidate_name, candidateUniversity: r.candidate_university, course: r.course, studyGoal: r.study_goal, availableTime: r.available_time, learningStyle: r.learning_style, studyPreference: r.study_preference, matchPercentage: r.match_percentage, matchReason: r.match_reason, status: r.status, avatarUrl: r.avatar_url, createdAt: r.created_at });
const groupDto = (r: Record<string, any>) => ({
  id: r.id, userId: r.user_id, groupName: r.group_name, purpose: r.purpose,
  conversationId: (db.prepare('SELECT id FROM conversations WHERE group_id = ? ORDER BY created_at LIMIT 1').get(r.id) as { id: string } | undefined)?.id,
  members: (db.prepare('SELECT u.name FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? ORDER BY gm.joined_at').all(r.id) as Array<{ name: string }>).map((member) => member.name),
  rules: parseJson(r.rules, []), studyTarget: r.study_target, meetingStyle: r.meeting_style, createdAt: r.created_at, isActive: Boolean(r.is_active)
});
const sessionDto = (r: Record<string, any>) => ({
  id: r.id, groupId: r.group_id, date: r.date, time: r.time, topic: r.topic,
  members: (db.prepare('SELECT u.name FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? ORDER BY gm.joined_at').all(r.group_id) as Array<{ name: string }>).map((member) => member.name),
  studyGoal: r.study_goal, status: r.status, reminderActive: Boolean(r.reminder_active), createdAt: r.created_at
});
const accountabilityDto = (r: Record<string, any>) => ({ id: r.id, groupId: r.group_id, userId: r.user_id, attendanceRate: r.attendance_rate, sessionsMissed: r.sessions_missed, participationScore: r.participation_score, isInactive: Boolean(r.is_inactive), suggestedAction: r.suggested_action });

app.get('/', (_req, res) => res.redirect(process.env.APP_URL || 'http://localhost:3000'));
app.get('/api/health', (_req, res) => res.json({ ok: true, status: 'live', database: 'sqlite', ...monitoringSnapshot() }));
app.get('/api/ready', (_req, res) => {
  db.prepare('SELECT 1').get();
  res.json({ ok: true, status: 'ready', database: 'sqlite' });
});
if (process.env.NODE_ENV === 'test') app.get('/api/_test/error', () => { throw new Error('Sensitive internal test failure'); });
app.post('/api/auth/register', rateLimit('register', 5, 15 * 60 * 1000), validateBody(schemas.register), asyncHandler(async (req, res) => {
  const { name, fullName, email, password } = req.body;
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())) return fail(res, 409, 'An account with this email already exists.');
  const userId = id('user');
  const passwordHash = await hashPassword(password);
  db.prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(userId, name || fullName, email.toLowerCase(), passwordHash, now());
  const session = createSession(userId, req, res);
  updateMetric('newUsers'); updateMetric('accountCreationRate');
  res.status(201).json({ user: userDto(db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, any>), expiresAt: session.expiresAt });
}));
app.post('/api/auth/login', rateLimit('login', 5, 15 * 60 * 1000, (req) => String(req.body.email || '').toLowerCase()), validateBody(schemas.login), asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(req.body.email || '').toLowerCase()) as Record<string, any> | undefined;
  const password = String(req.body.password || '');
  const passwordMatches = row
    ? isPasswordHash(row.password_hash) ? await verifyPassword(password, row.password_hash) : row.password_hash === password
    : false;
  if (!row || !passwordMatches) return fail(res, 401, 'Incorrect email or password.');
  if (!isPasswordHash(row.password_hash)) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), row.id);
  }
  const session = createSession(row.id, req, res);
  res.json({ user: userDto(db.prepare('SELECT * FROM users WHERE id = ?').get(row.id) as Record<string, any>), expiresAt: session.expiresAt });
}));
app.post('/api/auth/logout', (req, res) => { revokeCurrentSession(req); clearSessionCookie(res); res.json({ success: true }); });
app.post('/api/auth/logout-all', (req, res) => {
  const user = authUser(req); if (!user) return fail(res, 401, 'Authentication required.');
  revokeAllSessions(user.id); clearSessionCookie(res); res.json({ success: true });
});
app.get('/api/auth/me', (req, res) => { const user = authUser(req); return user ? res.json({ user: userDto(user) }) : fail(res, 401, 'Session expired.'); });
app.post('/api/auth/password-reset/request', rateLimit('password-reset', 3, 60 * 60 * 1000, (req) => String(req.body.email || '').toLowerCase()), validateBody(schemas.passwordResetRequest), asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  let resetToken: string | undefined;
  if (user) {
    resetToken = randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id('reset'), user.id, tokenHash(resetToken), resetTokenExpiry(), now());
    try {
      await deliverPasswordReset(email, resetToken);
    } catch (error) {
      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
      return fail(res, 503, error instanceof Error ? error.message : 'Password reset delivery failed.');
    }
  }
  res.json({
    success: true,
    message: 'If the account exists, password reset instructions have been created.',
    ...(process.env.NODE_ENV !== 'production' && resetToken ? { resetToken } : {})
  });
}));
app.post('/api/auth/password-reset/confirm', rateLimit('password-reset-confirm', 5, 15 * 60 * 1000), validateBody(schemas.passwordResetConfirm), asyncHandler(async (req, res) => {
  const resetToken = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 8) return fail(res, 400, 'Password must be at least 8 characters.');
  const reset = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL
  `).get(tokenHash(resetToken), now()) as Record<string, any> | undefined;
  if (!reset) return fail(res, 400, 'Password reset token is invalid or expired.');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), reset.user_id);
    db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(now(), reset.id);
    revokeAllSessions(reset.user_id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  clearSessionCookie(res);
  res.json({ success: true });
}));

type AuthenticatedRequest = Request & { authenticatedUser: Record<string, any> };
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Authentication required.');
  (req as AuthenticatedRequest).authenticatedUser = user;
  next();
};
const currentUser = (req: Request) => (req as AuthenticatedRequest).authenticatedUser;
const isGroupMember = (groupId: string, userId: string) => Boolean(db.prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId));
const isGroupOwner = (groupId: string, userId: string) => Boolean(db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'owner'").get(groupId, userId));
const isSessionMember = (sessionId: string, userId: string) => Boolean(db.prepare(`
  SELECT 1 FROM study_sessions s JOIN group_members gm ON gm.group_id = s.group_id
  WHERE s.id = ? AND gm.user_id = ?
`).get(sessionId, userId));
const isConversationMember = (conversationId: string, userId: string) => Boolean(db.prepare('SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?').get(conversationId, userId));

app.use('/api', requireAuth);

app.get('/api/workflow', (req, res) => {
  const user = currentUser(req);
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id) as Record<string, any> | undefined;
  const matches = db.prepare("SELECT * FROM matches WHERE user_id = ? AND status = 'pending' ORDER BY match_percentage DESC").all(user.id) as Record<string, any>[];
  const acceptedMatch = db.prepare(`
    SELECT m.* FROM matches m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE m.user_id = ? AND m.status = 'accepted' AND cm.user_id = ?
    ORDER BY m.created_at DESC LIMIT 1
  `).get(user.id, user.id) as Record<string, any> | undefined;
  const groups = db.prepare('SELECT g.* FROM study_groups g JOIN group_members gm ON gm.group_id=g.id WHERE gm.user_id=? AND g.is_active=1 ORDER BY g.created_at DESC').all(user.id) as Record<string, any>[];
  const group = groups[0];
  const sessions = group ? db.prepare('SELECT * FROM study_sessions WHERE group_id = ? ORDER BY created_at DESC').all(group.id) as Record<string, any>[] : [];
  const session = sessions.find((item) => item.status !== 'completed' && item.status !== 'missed') || sessions[0];
  const accountability = group ? db.prepare('SELECT * FROM accountability_records WHERE group_id = ? AND user_id = ? ORDER BY rowid DESC LIMIT 1').get(group.id, user.id) as Record<string, any> | undefined : undefined;
  res.json({
    profile: profile ? profileDto(profile) : null,
    matches: matches.map(matchDto),
    acceptedMatch: acceptedMatch ? matchDto(acceptedMatch) : null,
    groups: groups.map(groupDto),
    group: group ? groupDto(group) : null,
    sessions: sessions.map(sessionDto),
    session: session ? sessionDto(session) : null,
    sessionHistory: sessions.filter((item) => item.status === 'completed').map(sessionDto),
    accountability: accountability ? accountabilityDto(accountability) : null
  });
});

app.post('/api/profile/validate', validateBody(schemas.profile), (_req, res) => res.json({ valid: true, errors: [] }));
const saveProfile = (req: Request, res: Response) => {
  const user = currentUser(req);
  const p = req.body, parts = String(p.major || `${p.course || ''}, ${p.subject || ''}`).split(','), timestamp = now();
  db.prepare(`INSERT INTO student_profiles (id,user_id,course,subject,university,class_name,study_goal,preferred_study_time,learning_style,availability,study_preference,profile_completed,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)
    ON CONFLICT(user_id) DO UPDATE SET course=excluded.course,subject=excluded.subject,university=excluded.university,class_name=excluded.class_name,study_goal=excluded.study_goal,preferred_study_time=excluded.preferred_study_time,learning_style=excluded.learning_style,availability=excluded.availability,study_preference=excluded.study_preference,updated_at=excluded.updated_at`)
    .run(p.id || id('profile'), user.id, (p.course || parts[0] || 'General Studies').trim(), (p.subject || parts[1] || parts[0] || 'General Studies').trim(), p.university, p.className || '', p.studyGoal, p.preferredStudyTime || p.timeOfDay?.[0] || 'Evening', String(p.learningStyle || p.learningStyles?.[0] || 'mixed').toLowerCase(), JSON.stringify(p.availability || [{ day: 'Wednesday', startTime: '18:00', endTime: '20:00' }]), p.studyPreference, timestamp, timestamp);
  updateMetric('profileCompletionRate');
  res.status(201).json({ profile: profileDto(db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id) as Record<string, any>) });
};
app.post('/api/profile', validateBody(schemas.profile), saveProfile);
app.put('/api/profile', validateBody(schemas.profile), saveProfile);
app.get('/api/profile', (req, res) => { const row = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(currentUser(req).id) as Record<string, any> | undefined; return row ? res.json({ profile: profileDto(row) }) : fail(res, 404, 'Profile not found.'); });

app.post('/api/matching/analyze', validateBody(schemas.requirementsEnvelope), (req, res) => {
  const user = authUser(req); if (!user) return fail(res, 401, 'Authentication required.');
  try { const matches = generateMatches(user.id, req.body.requirements); updateMetric('possibleMatchesFound', matches.length); res.json({ analysis: { compatibilityChecks: ['course', 'schedule', 'goal', 'learningStyle', 'studyPreference'], matchesFound: matches.length }, matches }); }
  catch (e) { fail(res, 400, e instanceof Error ? e.message : 'Analysis failed.'); }
});
app.post('/api/matches/generate', (req, res) => { const user = authUser(req); return user ? res.json({ matches: generateMatches(user.id) }) : fail(res, 401, 'Authentication required.'); });
app.get('/api/matches', (req, res) => res.json({ matches: (db.prepare("SELECT * FROM matches WHERE user_id = ? AND status = 'pending' ORDER BY match_percentage DESC").all(currentUser(req).id) as Record<string, any>[]).map(matchDto) }));
app.post('/api/matches/:matchId/accept', validateParams(schemas.matchId), (req, res) => {
  const user = currentUser(req);
  const row = db.prepare("SELECT * FROM matches WHERE id = ? AND user_id = ? AND status = 'pending'").get(req.params.matchId, user.id) as Record<string, any> | undefined;
  if (!row) {
    const existing = db.prepare('SELECT status FROM matches WHERE id = ? AND user_id = ?').get(req.params.matchId, user.id);
    return existing ? fail(res, 409, 'Only pending matches can be accepted.') : fail(res, 404, 'Match not found.');
  }
  const group = db.prepare('SELECT * FROM study_groups WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(row.user_id) as Record<string, any> | undefined;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare("UPDATE matches SET status='accepted' WHERE id=? AND user_id=?").run(req.params.matchId, user.id);
    db.prepare("UPDATE match_candidates SET status='accepted' WHERE match_id=?").run(req.params.matchId);
    if (group && row.candidate_user_id) {
      db.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)").run(group.id, row.candidate_user_id, now());
      db.prepare('UPDATE conversations SET group_id = ? WHERE id = ?').run(group.id, row.conversation_id);
      const groupMembers = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(group.id) as Array<{ user_id: string }>;
      for (const member of groupMembers) {
        db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)').run(row.conversation_id, member.user_id, now());
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  updateMetric('successfulMatches');
  updateMetric('matchAcceptanceRate');
  const updatedGroup = group ? db.prepare('SELECT * FROM study_groups WHERE id = ?').get(group.id) as Record<string, any> : undefined;
  res.json({ match: matchDto({ ...row, status: 'accepted' }), group: updatedGroup ? groupDto(updatedGroup) : undefined });
});
app.post('/api/matches/:matchId/reject', validateParams(schemas.matchId), (req, res) => {
  const result = db.prepare("UPDATE matches SET status='rejected' WHERE id=? AND user_id=? AND status='pending'").run(req.params.matchId, currentUser(req).id);
  if (!result.changes) {
    const existing = db.prepare('SELECT status FROM matches WHERE id = ? AND user_id = ?').get(req.params.matchId, currentUser(req).id);
    return existing ? fail(res, 409, 'Only pending matches can be rejected.') : fail(res, 404, 'Match not found.');
  }
  db.prepare("UPDATE match_candidates SET status='rejected' WHERE match_id=?").run(req.params.matchId);
  updateMetric('matchRejectionRate'); res.json({ success: true });
});
app.post('/api/rematch', validateBody(schemas.requirementsEnvelope), (req, res) => { const user = authUser(req); return user ? res.json({ matches: generateMatches(user.id, req.body.requirements) }) : fail(res, 401, 'Authentication required.'); });

app.get('/api/chat/:conversationId', validateParams(schemas.conversationId), (req, res) => {
  if (!isConversationMember(req.params.conversationId, currentUser(req).id)) return fail(res, 403, 'Conversation access denied.');
  const messages = db.prepare('SELECT id, conversation_id AS conversationId, user_id AS userId, sender_name AS senderName, message, created_at AS createdAt FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.conversationId);
  res.json({ messages });
});
app.post('/api/chat/messages', validateBody(schemas.chatMessage), (req, res) => {
  const user = currentUser(req);
  const message = String(req.body.message || '').trim();
  if (!message) return fail(res, 400, 'Message cannot be empty.');
  if (!isConversationMember(String(req.body.conversationId || ''), user.id)) return fail(res, 403, 'Conversation access denied.');
  const chatId = id('message'), createdAt = now();
  db.prepare('INSERT INTO chat_messages (id, conversation_id, user_id, sender_name, message, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(chatId, req.body.conversationId, user.id, user.name, message, createdAt);
  res.status(201).json({ message: { id: chatId, conversationId: req.body.conversationId, userId: user.id, senderName: user.name, message, createdAt } });
});

app.post('/api/groups', validateBody(schemas.group), (req, res) => {
  const user = currentUser(req);
  const g = req.body, groupId = id('group');
  const acceptedMatch = g.candidateUserId || g.conversationId
    ? db.prepare(`
        SELECT * FROM matches
        WHERE user_id = ? AND status = 'accepted'
          AND (? IS NULL OR candidate_user_id = ?)
          AND (? IS NULL OR conversation_id = ?)
        ORDER BY created_at DESC LIMIT 1
      `).get(user.id, g.candidateUserId || null, g.candidateUserId || null, g.conversationId || null, g.conversationId || null) as Record<string, any> | undefined
    : undefined;
  if ((g.candidateUserId || g.conversationId) && !acceptedMatch) return fail(res, 400, 'Accepted match details are invalid.');
  const createdAt = now();
  const groupConversationId = acceptedMatch?.conversation_id || id('conversation');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO study_groups (id,user_id,group_name,purpose,members,rules,study_target,meeting_style,created_at,is_active) VALUES (?,?,?,?,?,?,?,?,?,1)').run(groupId,user.id,g.groupName||g.name,g.purpose,'[]',JSON.stringify(g.rules||[]),g.studyTarget||g.targetGoal||'',g.meetingStyle,createdAt);
    db.prepare("INSERT INTO group_members (group_id,user_id,role,joined_at) VALUES (?,?,'owner',?)").run(groupId, user.id, createdAt);
    db.prepare('INSERT OR IGNORE INTO conversations (id, match_id, group_id, created_at) VALUES (?, ?, ?, ?)')
      .run(groupConversationId, acceptedMatch?.id || null, groupId, createdAt);
    db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)')
      .run(groupConversationId, user.id, createdAt);
    if (acceptedMatch) {
      db.prepare("INSERT OR IGNORE INTO group_members (group_id,user_id,role,joined_at) VALUES (?,?,'member',?)").run(groupId, acceptedMatch.candidate_user_id, createdAt);
      db.prepare('UPDATE conversations SET group_id = ? WHERE id = ?').run(groupId, acceptedMatch.conversation_id);
      db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)')
        .run(groupConversationId, acceptedMatch.candidate_user_id, createdAt);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  updateMetric('studyGroupsCreated'); res.status(201).json({ group: groupDto(db.prepare('SELECT * FROM study_groups WHERE id=?').get(groupId) as Record<string, any>) });
});
app.get('/api/groups', (req, res) => res.json({ groups: (db.prepare('SELECT g.* FROM study_groups g JOIN group_members gm ON gm.group_id=g.id WHERE gm.user_id=? AND g.is_active=1 ORDER BY g.created_at DESC').all(currentUser(req).id) as Record<string, any>[]).map(groupDto) }));
app.get('/api/groups/discover', (req, res) => {
  const user = currentUser(req);
  const groups = db.prepare(`
    SELECT g.*, u.name AS owner_name, p.course, p.preferred_study_time, p.learning_style, p.study_preference,
      (SELECT COUNT(*) FROM group_members count_members WHERE count_members.group_id = g.id) AS member_count
    FROM study_groups g
    JOIN users u ON u.id = g.user_id
    JOIN student_profiles p ON p.user_id = g.user_id AND p.profile_completed = 1
    WHERE g.is_active = 1
      AND g.user_id != ?
      AND NOT EXISTS (
        SELECT 1 FROM group_members own_membership
        WHERE own_membership.group_id = g.id AND own_membership.user_id = ?
      )
    ORDER BY g.created_at DESC
  `).all(user.id, user.id) as Array<Record<string, any>>;
  res.json({
    groups: groups.map((group) => ({
      ...groupDto(group),
      ownerName: group.owner_name,
      course: group.course,
      preferredStudyTime: group.preferred_study_time,
      learningStyle: group.learning_style,
      studyPreference: group.study_preference,
      memberCount: group.member_count
    }))
  });
});
app.post('/api/groups/:groupId/join', validateParams(schemas.groupId), (req, res) => {
  const user = currentUser(req);
  const group = db.prepare('SELECT * FROM study_groups WHERE id = ? AND is_active = 1').get(req.params.groupId) as Record<string, any> | undefined;
  if (!group) return fail(res, 404, 'Active group not found.');
  if (!db.prepare('SELECT 1 FROM student_profiles WHERE user_id = ? AND profile_completed = 1').get(user.id)) {
    return fail(res, 409, 'Complete your profile before joining a group.');
  }
  if (isGroupMember(req.params.groupId, user.id)) return fail(res, 409, 'You already joined this group.');

  const createdAt = now();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare("INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)")
      .run(req.params.groupId, user.id, createdAt);
    const conversations = db.prepare('SELECT id FROM conversations WHERE group_id = ?').all(req.params.groupId) as Array<{ id: string }>;
    for (const conversation of conversations) {
      db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)')
        .run(conversation.id, user.id, createdAt);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  res.status(201).json({ group: groupDto(group) });
});
app.put('/api/groups/:groupId', validateParams(schemas.groupId), validateBody(schemas.groupUpdate), (req, res) => {
  if (!isGroupOwner(req.params.groupId, currentUser(req).id)) return fail(res, 403, 'Group owner access required.');
  db.prepare('UPDATE study_groups SET group_name=COALESCE(?,group_name),purpose=COALESCE(?,purpose),meeting_style=COALESCE(?,meeting_style) WHERE id=?')
    .run(req.body.groupName || req.body.name || null, req.body.purpose || null, req.body.meetingStyle || null, req.params.groupId);
  res.json({ success:true });
});
app.post('/api/groups/:groupId/deactivate', validateParams(schemas.groupId), (req, res) => {
  if (!isGroupOwner(req.params.groupId, currentUser(req).id)) return fail(res, 403, 'Group owner access required.');
  const result = db.prepare('UPDATE study_groups SET is_active=0 WHERE id=? AND is_active=1').run(req.params.groupId);
  return result.changes ? res.json({ success:true }) : fail(res, 409, 'Group is already inactive.');
});
app.post('/api/groups/:groupId/leave', validateParams(schemas.groupId), (req, res) => {
  const user = currentUser(req);
  const membership = db.prepare(`
    SELECT gm.role, g.is_active
    FROM group_members gm JOIN study_groups g ON g.id = gm.group_id
    WHERE gm.group_id = ? AND gm.user_id = ?
  `).get(req.params.groupId, user.id) as { role: 'owner' | 'member'; is_active: number } | undefined;
  if (!membership) return fail(res, 404, 'Group membership not found.');
  if (!membership.is_active) return fail(res, 409, 'Cannot leave an inactive group.');

  let newOwnerUserId: string | null = null;
  let groupActive = true;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').run(req.params.groupId, user.id);
    db.prepare(`
      DELETE FROM conversation_members
      WHERE user_id = ? AND conversation_id IN (
        SELECT id FROM conversations WHERE group_id = ?
      )
    `).run(user.id, req.params.groupId);

    const remaining = db.prepare(`
      SELECT user_id FROM group_members
      WHERE group_id = ?
      ORDER BY joined_at ASC, user_id ASC
      LIMIT 1
    `).get(req.params.groupId) as { user_id: string } | undefined;

    if (!remaining) {
      db.prepare('UPDATE study_groups SET is_active = 0 WHERE id = ?').run(req.params.groupId);
      groupActive = false;
    } else if (membership.role === 'owner') {
      newOwnerUserId = remaining.user_id;
      db.prepare("UPDATE group_members SET role = 'owner' WHERE group_id = ? AND user_id = ?").run(req.params.groupId, remaining.user_id);
      db.prepare('UPDATE study_groups SET user_id = ? WHERE id = ?').run(remaining.user_id, req.params.groupId);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  res.json({ success: true, groupActive, newOwnerUserId });
});

app.post('/api/schedule/generate', validateBody(schemas.groupReference), (req, res) => {
  if (!isGroupMember(req.body.groupId, currentUser(req).id)) return fail(res, 403, 'Group access denied.');
  if (!db.prepare('SELECT 1 FROM study_groups WHERE id = ? AND is_active = 1').get(req.body.groupId)) return fail(res, 409, 'Cannot schedule an inactive group.');
  updateMetric('sessionsScheduled'); res.json({ suggestions: scheduleSuggestions(req.body.groupId) });
});
app.post('/api/sessions/confirm', validateBody(schemas.session), (req, res) => {
  if (!isGroupMember(req.body.groupId, currentUser(req).id)) return fail(res, 403, 'Group access denied.');
  const s=req.body, sessionId=id('session');
  const group = db.prepare('SELECT * FROM study_groups WHERE id = ? AND is_active = 1').get(s.groupId) as Record<string, any> | undefined;
  if (!group) return fail(res, 409, 'Cannot create a session for an inactive group.');
  if (db.prepare('SELECT 1 FROM study_sessions WHERE group_id = ? AND date = ? AND time = ?').get(s.groupId, s.date, s.time)) {
    return fail(res, 409, 'A session already exists for this group and time.');
  }
  const members = (db.prepare('SELECT u.name FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? ORDER BY gm.joined_at').all(s.groupId) as Array<{ name: string }>).map((member) => member.name);
  db.prepare("INSERT INTO study_sessions (id,group_id,date,time,topic,members,study_goal,status,reminder_active,created_at) VALUES (?,?,?,?,?,?,?,'confirmed',0,?)").run(sessionId,s.groupId,s.date,s.time,s.topic||'Study Session',JSON.stringify(members),group.study_target,now());
  updateMetric('confirmedStudySessions'); res.status(201).json({ session: sessionDto(db.prepare('SELECT * FROM study_sessions WHERE id=?').get(sessionId) as Record<string, any>) });
});
app.get('/api/sessions/:groupId', validateParams(schemas.groupId), (req,res)=>{
  if (!isGroupMember(req.params.groupId, currentUser(req).id)) return fail(res, 403, 'Group access denied.');
  res.json({sessions:(db.prepare('SELECT * FROM study_sessions WHERE group_id=? ORDER BY created_at DESC').all(req.params.groupId) as Record<string,any>[]).map(sessionDto)});
});
app.put('/api/sessions/:sessionId/reminder', validateParams(schemas.sessionId), validateBody(schemas.reminder), (req,res)=>{
  if (!isSessionMember(req.params.sessionId, currentUser(req).id)) return fail(res, 403, 'Session access denied.');
  db.prepare('UPDATE study_sessions SET reminder_active=? WHERE id=?').run(req.body.active===false?0:1,req.params.sessionId);updateMetric('reminderEngagementRate');res.json({success:true});
});

app.post('/api/attendance', validateBody(schemas.attendance), (req,res) => {
  const user = currentUser(req);
  if (!isSessionMember(req.body.sessionId, user.id)) return fail(res, 403, 'Session access denied.');
  const session = db.prepare('SELECT status FROM study_sessions WHERE id = ?').get(req.body.sessionId) as { status: string } | undefined;
  if (!session || session.status === 'missed') return fail(res, 409, 'Attendance cannot be recorded for this session.');
  if (db.prepare('SELECT 1 FROM attendance_records WHERE session_id = ? AND user_id = ?').get(req.body.sessionId, user.id)) {
    return fail(res, 409, 'Attendance has already been recorded for this session.');
  }
  const attendanceId = id('attendance'), joinedAt = now();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO attendance_records (id,session_id,user_id,name,status,joined_at) VALUES (?,?,?,?,?,?)')
      .run(attendanceId, req.body.sessionId, user.id, user.name, req.body.status, joinedAt);
    db.prepare("UPDATE study_sessions SET status='completed' WHERE id=? AND status='confirmed'").run(req.body.sessionId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  updateMetric('attendanceRate');
  updateMetric('completedSessions');
  res.status(201).json({attendance:{id:attendanceId,sessionId:req.body.sessionId,userId:user.id,name:user.name,status:req.body.status,joinedAt}});
});
app.get('/api/attendance/:sessionId', validateParams(schemas.sessionId), (req,res)=>{if(!isSessionMember(req.params.sessionId,currentUser(req).id))return fail(res,403,'Session access denied.');res.json({attendance:db.prepare('SELECT * FROM attendance_records WHERE session_id=?').all(req.params.sessionId)});});
app.post('/api/accountability/track', validateBody(schemas.groupReference), (req,res)=>{const user=currentUser(req);if(!isGroupMember(req.body.groupId,user.id))return fail(res,403,'Group access denied.');const a=createAccountability(req.body.groupId,user.id);db.prepare('INSERT INTO accountability_records (id,group_id,user_id,attendance_rate,sessions_missed,participation_score,is_inactive,suggested_action) VALUES (?,?,?,?,?,?,?,?)').run(a.id,a.groupId,a.userId,a.attendanceRate,a.sessionsMissed,a.participationScore,a.isInactive?1:0,a.suggestedAction);updateMetric('memberParticipationRate');if(a.isInactive)updateMetric('inactiveMemberRate');res.status(201).json({accountability:a});});
app.get('/api/accountability/:groupId', validateParams(schemas.groupId), (req,res)=>{if(!isGroupMember(req.params.groupId,currentUser(req).id))return fail(res,403,'Group access denied.');res.json({accountability:db.prepare('SELECT * FROM accountability_records WHERE group_id=?').all(req.params.groupId)});});
app.get('/api/progress',(req,res)=>res.json({progress:buildProgress(currentUser(req).id)}));
app.post('/api/progress/record',(req,res)=>{const p=buildProgress(currentUser(req).id);db.prepare(`INSERT INTO progress_analytics (id,user_id,sessions_completed,attendance_history,group_activity_level,study_consistency,most_active_study_time,total_study_hours,completed_sessions,progress_tracking_rate) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET sessions_completed=excluded.sessions_completed,attendance_history=excluded.attendance_history,group_activity_level=excluded.group_activity_level,study_consistency=excluded.study_consistency,most_active_study_time=excluded.most_active_study_time,total_study_hours=excluded.total_study_hours,completed_sessions=excluded.completed_sessions,progress_tracking_rate=excluded.progress_tracking_rate`).run(p.id,p.userId,p.sessionsCompleted,JSON.stringify(p.attendanceHistory),p.groupActivityLevel,p.studyConsistency,p.mostActiveStudyTime,p.totalStudyHours,p.completedSessions,p.progressTrackingRate);res.status(201).json({progress:p});});
app.get('/api/guidance',(req,res)=>{const user=currentUser(req);res.json({guidance:buildGuidance(user.id)});});
app.post('/api/user/pause',(req,res)=>{const user=authUser(req);if(!user)return fail(res,401,'Authentication required.');db.prepare('UPDATE users SET paused=1 WHERE id=?').run(user.id);updateMetric('churnRate');res.json({success:true});});

app.use(notFoundHandler);
app.use(errorHandler);
