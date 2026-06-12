import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.STUDYSYNC_DB_PATH = join(mkdtempSync(join(tmpdir(), 'studysync-validation-')), 'test.db');

const { app } = await import('../src/app.ts');
const { db } = await import('../src/db/connection.ts');

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
  return { response, body, cookie: response.headers.getSetCookie()[0]?.split(';')[0] || '' };
};
const post = (path: string, body: unknown, cookie = '') => request(path, { method: 'POST', body: JSON.stringify(body) }, cookie);
const dateInDays = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

test.after(() => {
  server.close();
  db.close();
});

test('request validation rejects malformed input before state changes', async () => {
  const invalidRegistration = await post('/api/auth/register', { name: '', email: 'not-an-email', password: 'short' });
  assert.equal(invalidRegistration.response.status, 400);
  assert.equal(invalidRegistration.body.code, 'validation_error');
  assert.equal(Number((db.prepare("SELECT COUNT(*) AS count FROM users WHERE email = 'not-an-email'").get() as { count: number }).count), 0);

  const registration = await post('/api/auth/register', {
    name: 'Validation Owner',
    email: `validation-${crypto.randomUUID()}@example.edu`,
    password: 'correct-password'
  });
  assert.equal(registration.response.status, 201);

  const invalidProfile = await post('/api/profile', {
    university: '',
    studyGoal: 'Pass',
    studyPreference: 'invalid',
    learningStyles: [],
    timeOfDay: []
  }, registration.cookie);
  assert.equal(invalidProfile.response.status, 400);
  assert.equal(invalidProfile.body.code, 'validation_error');

  const invalidPath = await post('/api/matches/not!valid/accept', {}, registration.cookie);
  assert.equal(invalidPath.response.status, 400);
  assert.equal(invalidPath.body.code, 'validation_error');
});

test('workflow integrity rejects duplicate and invalid state transitions', async () => {
  const candidate = await post('/api/auth/register', {
    name: 'Integrity Candidate',
    email: `integrity-candidate-${crypto.randomUUID()}@example.edu`,
    password: 'correct-password'
  });
  assert.equal(candidate.response.status, 201);
  assert.equal((await post('/api/profile', {
    university: 'Integrity University',
    major: 'CS301, Advanced Algorithms',
    studyGoal: 'Complete the final',
    learningStyles: ['visual'],
    studyPreference: 'group',
    timeOfDay: ['Evening']
  }, candidate.cookie)).response.status, 201);

  const registration = await post('/api/auth/register', {
    name: 'Integrity Owner',
    email: `integrity-${crypto.randomUUID()}@example.edu`,
    password: 'correct-password'
  });
  const cookie = registration.cookie;

  assert.equal((await post('/api/profile', {
    university: 'Integrity University',
    major: 'CS301, Advanced Algorithms',
    studyGoal: 'Complete the final',
    learningStyles: ['practice'],
    studyPreference: 'group',
    timeOfDay: ['Evening']
  }, cookie)).response.status, 201);

  const analysis = await post('/api/matching/analyze', { requirements: { course: 'CS301' } }, cookie);
  const match = analysis.body.matches[0];
  assert.equal((await post(`/api/matches/${match.id}/accept`, {}, cookie)).response.status, 200);
  assert.equal((await post(`/api/matches/${match.id}/accept`, {}, cookie)).response.status, 409);

  const groupResult = await post('/api/groups', {
    groupName: 'Integrity Group',
    purpose: 'Workflow verification',
    meetingStyle: 'Online',
    studyTarget: 'Complete the final',
    candidateUserId: match.candidateUserId,
    conversationId: match.conversationId
  }, cookie);
  const groupId = groupResult.body.group.id;
  assert.equal(groupResult.response.status, 201);

  const pastSession = await post('/api/sessions/confirm', {
    groupId,
    date: '2000-01-01',
    time: '18:00 - 20:00',
    topic: 'Past session'
  }, cookie);
  assert.equal(pastSession.response.status, 400);
  assert.equal(pastSession.body.code, 'validation_error');

  const sessionInput = { groupId, date: dateInDays(14), time: '18:00 - 20:00', topic: 'Integrity Session' };
  const sessionResult = await post('/api/sessions/confirm', sessionInput, cookie);
  assert.equal(sessionResult.response.status, 201);
  assert.equal((await post('/api/sessions/confirm', sessionInput, cookie)).response.status, 409);

  const attendanceInput = { sessionId: sessionResult.body.session.id, status: 'joined' };
  assert.equal((await post('/api/attendance', { ...attendanceInput, status: 'missed' }, cookie)).response.status, 400);
  assert.equal((await post('/api/attendance', attendanceInput, cookie)).response.status, 201);
  assert.equal((await post('/api/attendance', attendanceInput, cookie)).response.status, 409);

  assert.equal((await post(`/api/groups/${groupId}/deactivate`, {}, cookie)).response.status, 200);
  assert.equal((await post('/api/schedule/generate', { groupId }, cookie)).response.status, 409);
  assert.equal((await post('/api/sessions/confirm', { ...sessionInput, date: dateInDays(15) }, cookie)).response.status, 409);

  const indexes = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as Array<{ name: string }>).map((row) => row.name));
  assert.ok(indexes.has('idx_attendance_session_user'));
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM attendance_records WHERE session_id = ?').get(sessionResult.body.session.id) as { count: number }).count, 1);
});
