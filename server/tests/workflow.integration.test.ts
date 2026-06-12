import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.STUDYSYNC_DB_PATH = join(mkdtempSync(join(tmpdir(), 'studysync-workflow-')), 'test.db');

const { app } = await import('../src/app.ts');
const { db } = await import('../src/db/connection.ts');
const { migrateDatabase } = await import('../src/db/migrations.ts');

const server = app.listen(0);
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.');
const baseUrl = `http://127.0.0.1:${address.port}`;

const request = async (path: string, options: RequestInit = {}, cookie = '') => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  const setCookie = response.headers.getSetCookie()[0]?.split(';')[0] || '';
  return { response, body, cookie: setCookie };
};
const post = (path: string, body: unknown, cookie = '') => request(path, { method: 'POST', body: JSON.stringify(body) }, cookie);
const futureDate = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 14);
  return date.toISOString().slice(0, 10);
};

test.after(() => {
  server.close();
  db.close();
});

test('complete workflow restores from backend after a new login', async () => {
  const candidateRegistration = await post('/api/auth/register', {
    name: 'Workflow Candidate',
    email: `workflow-candidate-${crypto.randomUUID()}@example.edu`,
    password: 'correct-password'
  });
  assert.equal(candidateRegistration.response.status, 201);
  assert.equal((await post('/api/profile', {
    university: 'Workflow University',
    major: 'CS301, Advanced Algorithms',
    studyGoal: 'Complete the final',
    learningStyles: ['visual'],
    studyPreference: 'group',
    timeOfDay: ['Evening']
  }, candidateRegistration.cookie)).response.status, 201);

  const email = `workflow-${crypto.randomUUID()}@example.edu`;
  const password = 'correct-password';
  const registration = await post('/api/auth/register', { name: 'Workflow Owner', email, password });
  const ownerCookie = registration.cookie;
  assert.equal(registration.response.status, 201);

  assert.equal((await post('/api/profile', {
    university: 'Workflow University',
    major: 'CS301, Advanced Algorithms',
    studyGoal: 'Complete the final',
    learningStyles: ['practice'],
    studyPreference: 'group',
    timeOfDay: ['Evening']
  }, ownerCookie)).response.status, 201);

  const analysis = await post('/api/matching/analyze', { requirements: { course: 'CS301', preferredTime: 'Evening' } }, ownerCookie);
  const match = analysis.body.matches[0];
  assert.ok(match.candidateUserId);
  assert.ok(match.conversationId);
  assert.equal((await post(`/api/matches/${match.id}/accept`, {}, ownerCookie)).response.status, 200);

  const groupResult = await post('/api/groups', {
    groupName: 'Persisted Study Group',
    purpose: 'Exam preparation',
    meetingStyle: 'Online',
    studyTarget: 'Complete the final',
    candidateUserId: match.candidateUserId,
    conversationId: match.conversationId
  }, ownerCookie);
  assert.equal(groupResult.response.status, 201);
  assert.deepEqual(groupResult.body.group.members.sort(), [match.candidateName, 'Workflow Owner'].sort());

  const sessionResult = await post('/api/sessions/confirm', {
    groupId: groupResult.body.group.id,
    date: futureDate(),
    time: '18:00 - 20:00',
    topic: 'Persisted Session',
    members: ['Fake Client Member'],
    studyGoal: 'Fake Client Goal'
  }, ownerCookie);
  assert.equal(sessionResult.response.status, 201);
  assert.equal(sessionResult.body.session.studyGoal, 'Complete the final');
  assert.equal(sessionResult.body.session.members.includes('Fake Client Member'), false);

  assert.equal((await post('/api/attendance', { sessionId: sessionResult.body.session.id, status: 'joined' }, ownerCookie)).response.status, 201);
  assert.equal((await post('/api/accountability/track', { groupId: groupResult.body.group.id }, ownerCookie)).response.status, 201);
  assert.equal((await post('/api/auth/logout', {}, ownerCookie)).response.status, 200);

  const login = await post('/api/auth/login', { email, password });
  assert.equal(login.response.status, 200);
  const workflow = await request('/api/workflow', {}, login.cookie);
  assert.equal(workflow.response.status, 200);
  assert.equal(workflow.body.profile.course, 'CS301');
  assert.equal(workflow.body.acceptedMatch.id, match.id);
  assert.equal(workflow.body.group.id, groupResult.body.group.id);
  assert.equal(workflow.body.groups.length, 1);
  assert.equal(workflow.body.sessionHistory[0].id, sessionResult.body.session.id);
  assert.equal(workflow.body.accountability.groupId, groupResult.body.group.id);
});

test('collaborative schema has required membership tables, foreign keys, and indexes', () => {
  const requiredTables = ['match_candidates', 'group_members', 'conversation_members', 'auth_sessions'];
  const tables = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map((item) => item.name));
  requiredTables.forEach((table) => assert.ok(tables.has(table), `Missing table ${table}`));

  const foreignKeys = db.prepare('PRAGMA foreign_key_list(group_members)').all();
  assert.ok(foreignKeys.length >= 2);

  const indexes = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as Array<{ name: string }>).map((item) => item.name));
  assert.ok(indexes.has('idx_group_members_user_id'));
  assert.ok(indexes.has('idx_conversation_members_user_id'));
  assert.ok(indexes.has('idx_match_candidates_user_id'));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('legacy demo and test users and their groups are removed without deleting registered users', () => {
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .run('seed-user-test', 'Legacy Demo', 'student999@studysync.edu', 'legacy-password', createdAt);
  db.prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .run('browser-test-user', 'Browser Test', 'browser-test@example.edu', 'legacy-password', createdAt);
  db.prepare('INSERT INTO study_groups (id, user_id, group_name, purpose, members, rules, study_target, meeting_style, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)')
    .run('legacy-demo-group', 'seed-user-test', 'Legacy Demo Group', 'Demo', '[]', '[]', 'Demo', 'Online', createdAt);
  db.prepare('INSERT INTO study_groups (id, user_id, group_name, purpose, members, rules, study_target, meeting_style, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)')
    .run('browser-test-group', 'browser-test-user', 'Browser Test Group', 'Test', '[]', '[]', 'Test', 'Online', createdAt);
  const registeredBefore = Number((db.prepare(`
    SELECT COUNT(*) AS count FROM users
    WHERE id NOT LIKE 'seed-user-%'
      AND email NOT GLOB 'qa-*@studysync.edu'
      AND email NOT GLOB 'browser-*@example.edu'
      AND email NOT GLOB 'a11y-*@example.edu'
  `).get() as { count: number }).count);

  migrateDatabase();

  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM users WHERE id = 'seed-user-test'").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM users WHERE id = 'browser-test-user'").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM study_groups WHERE id = 'legacy-demo-group'").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM study_groups WHERE id = 'browser-test-group'").get() as { count: number }).count, 0);
  assert.equal((db.prepare(`
    SELECT COUNT(*) AS count FROM users
    WHERE id NOT LIKE 'seed-user-%'
      AND email NOT GLOB 'qa-*@studysync.edu'
      AND email NOT GLOB 'browser-*@example.edu'
      AND email NOT GLOB 'a11y-*@example.edu'
  `).get() as { count: number }).count, registeredBefore);
});
