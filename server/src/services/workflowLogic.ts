import { db, id, now, parseJson } from '../db/connection.ts';

type ProfileRow = {
  user_id: string; course: string; subject: string; university: string; class_name: string;
  study_goal: string; preferred_study_time: string; learning_style: string;
  availability: string; study_preference: string;
};

const compatibleStyles: Record<string, string[]> = {
  visual: ['visual', 'practice', 'mixed'],
  reading: ['reading', 'discussion', 'mixed'],
  discussion: ['discussion', 'reading', 'mixed'],
  practice: ['practice', 'visual', 'mixed'],
  mixed: ['visual', 'reading', 'discussion', 'practice', 'mixed']
};

type SearchRequirements = {
  course?: string; studyGoal?: string; preferredTime?: string; learningStyle?: string; studyPreference?: string;
};

export function generateMatches(userId: string, requirements?: SearchRequirements) {
  const savedProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId) as ProfileRow | undefined;
  const profile = savedProfile ? {
    ...savedProfile,
    course: requirements?.course || savedProfile.course,
    subject: requirements?.course || savedProfile.subject,
    study_goal: requirements?.studyGoal || savedProfile.study_goal,
    preferred_study_time: requirements?.preferredTime || savedProfile.preferred_study_time,
    learning_style: requirements?.learningStyle || savedProfile.learning_style,
    study_preference: requirements?.studyPreference || savedProfile.study_preference
  } : undefined;
  if (!profile) throw new Error('Complete your profile before generating matches.');

  db.prepare("DELETE FROM matches WHERE user_id = ? AND status = 'pending'").run(userId);
  const candidates = db.prepare(`
    SELECT p.*, u.name AS candidate_name
    FROM student_profiles p JOIN users u ON u.id = p.user_id
    WHERE p.user_id != ? LIMIT 12
  `).all(userId) as Array<ProfileRow & { candidate_name: string }>;

  const insert = db.prepare(`
    INSERT INTO matches (
      id, user_id, candidate_user_id, conversation_id, candidate_name, candidate_university, course, study_goal, available_time,
      learning_style, study_preference, match_percentage, match_reason, status, avatar_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);
  const insertCandidate = db.prepare(`
    INSERT INTO match_candidates (match_id, user_id, role, status, created_at) VALUES (?, ?, ?, 'pending', ?)
  `);
  const insertConversation = db.prepare('INSERT INTO conversations (id, match_id, created_at) VALUES (?, ?, ?)');
  const insertConversationMember = db.prepare('INSERT INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)');

  return candidates.map((candidate) => {
    let score = 0;
    const reasons: string[] = [];
    if (candidate.course.toLowerCase() === profile.course.toLowerCase()) {
      score += 30;
      reasons.push(`study ${candidate.course}`);
    } else if (candidate.subject.toLowerCase().includes(profile.subject.toLowerCase().split(' ')[0])) {
      score += 20;
    }
    if (candidate.preferred_study_time === profile.preferred_study_time) {
      score += 25;
      reasons.push(`prefer ${candidate.preferred_study_time.toLowerCase()} sessions`);
    }
    if (candidate.study_goal === profile.study_goal) {
      score += 20;
      reasons.push('share the same study goal');
    }
    if (compatibleStyles[profile.learning_style]?.includes(candidate.learning_style)) score += 15;
    if (candidate.study_preference === profile.study_preference) score += 10;
    score = Math.min(score, 100);

    const matchId = id('match'), conversationId = id('conversation'), createdAt = now();
    const matchReason = `You both ${reasons.slice(0, 3).join(', ') || 'have compatible study profiles'}.`;
    const avatarUrl = null;
    db.exec('BEGIN IMMEDIATE');
    try {
      insert.run(matchId, userId, candidate.user_id, conversationId, candidate.candidate_name, candidate.university, candidate.course, candidate.study_goal,
        candidate.preferred_study_time, candidate.learning_style, candidate.study_preference, score, matchReason, avatarUrl, createdAt);
      insertCandidate.run(matchId, userId, 'requester', createdAt);
      insertCandidate.run(matchId, candidate.user_id, 'candidate', createdAt);
      insertConversation.run(conversationId, matchId, createdAt);
      insertConversationMember.run(conversationId, userId, createdAt);
      insertConversationMember.run(conversationId, candidate.user_id, createdAt);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    return { id: matchId, candidateUserId: candidate.user_id, conversationId, candidateName: candidate.candidate_name, candidateUniversity: candidate.university,
      course: candidate.course, studyGoal: candidate.study_goal, availableTime: candidate.preferred_study_time,
      learningStyle: candidate.learning_style, studyPreference: candidate.study_preference,
      matchPercentage: score, matchReason, status: 'pending', avatarUrl: undefined };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);
}

export function scheduleSuggestions(groupId: string) {
  const memberCount = Number((db.prepare('SELECT COUNT(*) AS count FROM group_members WHERE group_id = ?').get(groupId) as { count: number }).count);
  const profiles = db.prepare(`
    SELECT p.availability
    FROM group_members gm JOIN student_profiles p ON p.user_id = gm.user_id
    WHERE gm.group_id = ?
  `).all(groupId) as Array<{ availability: string }>;
  const availabilityCounts = new Map<string, number>();
  for (const profile of profiles) {
    for (const slot of parseJson<Array<{ day: string; startTime: string; endTime: string }>>(profile.availability, [])) {
      const key = `${slot.day}|${slot.startTime}|${slot.endTime}`;
      availabilityCounts.set(key, (availabilityCounts.get(key) || 0) + 1);
    }
  }
  const weekdays: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
  };
  const nextWeekday = (weekday: number) => {
    const date = new Date();
    const delta = (weekday - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + delta);
    return date.toISOString().slice(0, 10);
  };
  return [...availabilityCounts.entries()]
    .filter(([key]) => weekdays[key.split('|')[0]] !== undefined)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([key, availableMembers], index) => {
      const [day, startTime, endTime] = key.split('|');
      return {
        id: index === 0 ? 'optimal' : `alternative-${index}`,
        day,
        date: nextWeekday(weekdays[day]),
        time: `${startTime} - ${endTime}`,
        availability: memberCount ? Math.round((availableMembers / memberCount) * 100) : 0,
        memberCount,
        isOptimal: index === 0
      };
    });
}

export function createAccountability(groupId: string, userId: string) {
  const attendance = db.prepare(`
    SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN a.status != 'missed' THEN 1 ELSE 0 END), 0) AS present
    FROM attendance_records a JOIN study_sessions s ON s.id = a.session_id
    WHERE a.user_id = ? AND s.group_id = ?
  `).get(userId, groupId) as { total: number; present: number };
  const rate = attendance.total ? Math.round((attendance.present / attendance.total) * 100) : 0;
  const missed = attendance.total - attendance.present;
  const participation = rate;
  const inactive = attendance.total > 0 && (rate < 50 || missed >= 2);
  return {
    id: id('accountability'), groupId, userId, attendanceRate: rate, sessionsMissed: missed,
    participationScore: participation, isInactive: inactive,
    suggestedAction: !attendance.total ? 'Record attendance to begin accountability tracking.' : inactive ? 'Review attendance and adjust the schedule.' : 'Keep the current study rhythm.'
  };
}

export function buildProgress(userId: string) {
  const completedSessions = db.prepare(`
    SELECT s.time
    FROM study_sessions s JOIN group_members gm ON gm.group_id = s.group_id
    WHERE gm.user_id = ? AND s.status = 'completed'
  `).all(userId) as Array<{ time: string }>;
  const completed = completedSessions.length;
  const scheduled = Number((db.prepare(`
    SELECT COUNT(*) AS count
    FROM study_sessions s JOIN group_members gm ON gm.group_id = s.group_id
    WHERE gm.user_id = ?
  `).get(userId) as { count: number }).count);
  const attendance = db.prepare(`
    SELECT COUNT(*) AS total, SUM(CASE WHEN status != 'missed' THEN 1 ELSE 0 END) AS present
    FROM attendance_records WHERE user_id = ?
  `).get(userId) as { total: number; present: number | null };
  const attendanceRate = attendance.total ? Math.round(((attendance.present || 0) / attendance.total) * 100) : 0;
  const profile = db.prepare('SELECT preferred_study_time FROM student_profiles WHERE user_id = ?').get(userId) as { preferred_study_time: string } | undefined;
  const totalStudyHours = completedSessions.reduce((total, session) => {
    const [start, end] = session.time.split(/\s*-\s*/);
    const minutes = (value: string) => {
      const [hours, mins] = value.split(':').map(Number);
      return hours * 60 + mins;
    };
    return start && end ? total + Math.max(0, minutes(end) - minutes(start)) / 60 : total;
  }, 0);
  return {
    id: id('progress'), userId, sessionsCompleted: completed,
    attendanceHistory: attendance.total ? [attendanceRate] : [], groupActivityLevel: completed ? 'Active' : 'No completed sessions',
    studyConsistency: completed > 2 ? 'Established' : 'Building',
    mostActiveStudyTime: profile?.preferred_study_time || 'Not set', totalStudyHours,
    completedSessions: completed, progressTrackingRate: scheduled ? Math.round((attendance.total / scheduled) * 100) : 0
  };
}

export function buildGuidance(userId: string) {
  const profile = db.prepare('SELECT preferred_study_time FROM student_profiles WHERE user_id = ?').get(userId) as { preferred_study_time: string } | undefined;
  const attendance = db.prepare(`
    SELECT COUNT(*) AS total, SUM(CASE WHEN status != 'missed' THEN 1 ELSE 0 END) AS present
    FROM attendance_records WHERE user_id = ?
  `).get(userId) as { total: number; present: number | null };
  const activeGroups = Number((db.prepare(`
    SELECT COUNT(*) AS count FROM group_members gm
    JOIN study_groups g ON g.id = gm.group_id
    WHERE gm.user_id = ? AND g.is_active = 1
  `).get(userId) as { count: number }).count);
  const attendanceRate = attendance.total ? Math.round(((attendance.present || 0) / attendance.total) * 100) : 0;
  const guidance = [
    ['activity', `Your saved preferred study time is ${profile?.preferred_study_time || 'not set yet'}.`, 'Adjust schedule', '/schedule'],
    ['attendance', attendance.total ? `Your recorded attendance rate is ${attendanceRate}%.` : 'No attendance has been recorded yet.', 'Continue', '/decision'],
    ['group-size', `You currently belong to ${activeGroups} active study ${activeGroups === 1 ? 'group' : 'groups'}.`, 'Review matches', '/matches']
  ];
  return guidance.map(([type, message, actionLabel, actionTarget]) => ({
    id: id('feedback'), userId, type, message, actionLabel, actionTarget, createdAt: now()
  }));
}
