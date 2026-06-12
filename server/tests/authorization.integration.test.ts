import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.STUDYSYNC_DB_PATH = join(mkdtempSync(join(tmpdir(), 'studysync-authz-')), 'test.db');

const { app } = await import('../src/app.ts');
const { db } = await import('../src/db/connection.ts');
const { clearRateLimits } = await import('../src/security/rateLimit.ts');

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

const register = async (name: string) => {
  const emailName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const email = `${emailName}-${crypto.randomUUID()}@example.edu`;
  const result = await post('/api/auth/register', { name, email, password: 'correct-password' });
  assert.equal(result.response.status, 201);
  return { ...result, email };
};

const saveProfile = (cookie: string, course: string) => post('/api/profile', {
  university: 'Test University',
  major: `${course}, Core Topics`,
  studyGoal: 'Pass the final exam',
  learningStyles: ['visual'],
  studyPreference: 'group',
  timeOfDay: ['Evening']
}, cookie);

test.after(() => {
  server.close();
  db.close();
});
test.beforeEach(() => clearRateLimits());

test('API requires authentication and derives profile user from session', async () => {
  assert.equal((await request('/api/profile')).response.status, 401);
  assert.equal((await request('/api/groups')).response.status, 401);
  assert.equal((await request('/api/payment/status/not-real')).response.status, 401);

  const first = await register('First');
  const second = await register('Second');
  assert.equal((await saveProfile(first.cookie, 'CS500')).response.status, 201);
  assert.equal((await saveProfile(second.cookie, 'MATH500')).response.status, 201);

  const firstProfile = await request('/api/profile', {}, first.cookie);
  const secondProfile = await request('/api/profile', {}, second.cookie);
  assert.equal(firstProfile.body.profile.course, 'CS500');
  assert.equal(secondProfile.body.profile.course, 'MATH500');

  assert.equal((await request('/api/profile/not-the-current-user', {}, first.cookie)).response.status, 404);
  assert.equal((await request('/api/export/xlsx', {}, first.cookie)).response.status, 404);
  assert.equal((await request('/api/metrics', {}, first.cookie)).response.status, 404);
  assert.equal((await post('/api/payment/simulate', { plan: 'pro' }, first.cookie)).response.status, 404);
  assert.equal((await post('/api/ai/analyze', {}, first.cookie)).response.status, 404);
});

test('match, conversation, group, session, and attendance access enforce membership', async () => {
  const owner = await register('Owner');
  const candidate = await register('Candidate');
  const outsider = await register('Outsider');
  await saveProfile(owner.cookie, 'CS301');
  await saveProfile(outsider.cookie, 'OUT100');
  await saveProfile(candidate.cookie, 'CS301');

  const analysis = await post('/api/matching/analyze', { requirements: { course: 'CS301' } }, owner.cookie);
  assert.equal(analysis.response.status, 200);
  const match = analysis.body.matches[0];
  assert.ok(match.id);
  assert.ok(match.candidateUserId);
  assert.ok(match.conversationId);

  assert.equal(match.candidateUserId, candidate.body.user.id);

  assert.equal((await post(`/api/matches/${match.id}/accept`, {}, outsider.cookie)).response.status, 404);
  assert.equal((await post(`/api/matches/${match.id}/accept`, {}, owner.cookie)).response.status, 200);

  assert.equal((await request(`/api/chat/${match.conversationId}`, {}, candidate.cookie)).response.status, 200);
  assert.equal((await request(`/api/chat/${match.conversationId}`, {}, outsider.cookie)).response.status, 403);
  assert.equal((await post('/api/chat/messages', { conversationId: match.conversationId, message: 'Authorized message' }, candidate.cookie)).response.status, 201);
  assert.equal((await post('/api/chat/messages', { conversationId: match.conversationId, message: 'Unauthorized message' }, outsider.cookie)).response.status, 403);

  const groupResult = await post('/api/groups', {
    groupName: 'Authorized Group',
    purpose: 'Authorization test',
    meetingStyle: 'Online',
    studyTarget: 'Verify access',
    candidateUserId: match.candidateUserId
  }, owner.cookie);
  assert.equal(groupResult.response.status, 201);
  const groupId = groupResult.body.group.id;

  assert.equal((await request('/api/groups', {}, candidate.cookie)).body.groups[0].id, groupId);
  assert.equal((await post('/api/schedule/generate', { groupId }, outsider.cookie)).response.status, 403);
  assert.equal((await post('/api/schedule/generate', { groupId }, candidate.cookie)).response.status, 200);

  const sessionResult = await post('/api/sessions/confirm', {
    groupId,
    date: futureDate(),
    time: '18:00 - 20:00',
    topic: 'Authorization Session'
  }, owner.cookie);
  assert.equal(sessionResult.response.status, 201);
  const sessionId = sessionResult.body.session.id;

  assert.equal((await request(`/api/sessions/${groupId}`, {}, candidate.cookie)).response.status, 200);
  assert.equal((await request(`/api/sessions/${groupId}`, {}, outsider.cookie)).response.status, 403);
  assert.equal((await post('/api/attendance', { sessionId, status: 'joined' }, outsider.cookie)).response.status, 403);
  assert.equal((await post('/api/attendance', { sessionId, status: 'joined' }, candidate.cookie)).response.status, 201);

  const ownerLeave = await post(`/api/groups/${groupId}/leave`, {}, owner.cookie);
  assert.equal(ownerLeave.response.status, 200);
  assert.equal(ownerLeave.body.newOwnerUserId, candidate.body.user.id);
  assert.equal((await request('/api/groups', {}, owner.cookie)).body.groups.length, 0);
  assert.equal((await request(`/api/chat/${match.conversationId}`, {}, owner.cookie)).response.status, 403);
  const transferredGroup = (await request('/api/groups', {}, candidate.cookie)).body.groups[0];
  assert.equal(transferredGroup.userId, candidate.body.user.id);

  const finalLeave = await post(`/api/groups/${groupId}/leave`, {}, candidate.cookie);
  assert.equal(finalLeave.response.status, 200);
  assert.equal(finalLeave.body.groupActive, false);
  assert.equal((await request('/api/groups', {}, candidate.cookie)).body.groups.length, 0);
  assert.equal((db.prepare('SELECT is_active FROM study_groups WHERE id = ?').get(groupId) as { is_active: number }).is_active, 0);
});

test('registered users can discover and join active groups created by another account', async () => {
  const owner = await register('Discovery Owner');
  const joiner = await register('Discovery Joiner');
  const incomplete = await register('Incomplete Joiner');
  await saveProfile(owner.cookie, 'CS450');
  await saveProfile(joiner.cookie, 'CS450');

  const created = await post('/api/groups', {
    groupName: 'Discoverable Systems Group',
    purpose: 'Distributed systems review',
    meetingStyle: 'Online',
    studyTarget: 'Pass the systems final'
  }, owner.cookie);
  assert.equal(created.response.status, 201);
  const groupId = created.body.group.id;
  const conversationId = created.body.group.conversationId;
  assert.ok(conversationId);

  const ownerDiscoveries = await request('/api/groups/discover', {}, owner.cookie);
  assert.equal(ownerDiscoveries.body.groups.some((group: { id: string }) => group.id === groupId), false);

  const joinerDiscoveries = await request('/api/groups/discover', {}, joiner.cookie);
  const discovered = joinerDiscoveries.body.groups.find((group: { id: string }) => group.id === groupId);
  assert.equal(discovered.groupName, 'Discoverable Systems Group');
  assert.equal(discovered.ownerName, 'Discovery Owner');
  assert.equal(discovered.course, 'CS450');
  assert.equal(discovered.memberCount, 1);

  assert.equal((await post(`/api/groups/${groupId}/join`, {}, incomplete.cookie)).response.status, 409);
  const joined = await post(`/api/groups/${groupId}/join`, {}, joiner.cookie);
  assert.equal(joined.response.status, 201);
  assert.equal(joined.body.group.members.includes('Discovery Joiner'), true);
  assert.equal((await post(`/api/groups/${groupId}/join`, {}, joiner.cookie)).response.status, 409);
  assert.equal((await request(`/api/chat/${conversationId}`, {}, joiner.cookie)).response.status, 200);
  assert.equal((await request('/api/groups/discover', {}, joiner.cookie)).body.groups.some((group: { id: string }) => group.id === groupId), false);
});
