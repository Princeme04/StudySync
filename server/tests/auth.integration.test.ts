import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.STUDYSYNC_DB_PATH = join(mkdtempSync(join(tmpdir(), 'studysync-auth-')), 'test.db');

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
  const setCookie = response.headers.getSetCookie()[0]?.split(';')[0] || '';
  return { response, body, cookie: setCookie };
};

test.after(() => {
  server.close();
  db.close();
});

test('secure authentication lifecycle works', async () => {
  const email = `secure-${crypto.randomUUID()}@example.edu`;
  const password = 'correct-password';

  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Secure Student', email, password })
  });
  assert.equal(registration.response.status, 201);
  assert.match(registration.cookie, /^studysync_session=/);
  assert.equal(registration.body.user.email, email);
  assert.equal('token' in registration.body, false);
  assert.equal('authToken' in registration.body.user, false);

  const stored = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(email) as { password_hash: string };
  assert.notEqual(stored.password_hash, password);
  assert.match(stored.password_hash, /^argon2id\$/);

  const me = await request('/api/auth/me', {}, registration.cookie);
  assert.equal(me.response.status, 200);
  assert.equal(me.body.user.email, email);

  const logout = await request('/api/auth/logout', { method: 'POST', body: '{}' }, registration.cookie);
  assert.equal(logout.response.status, 200);
  const afterLogout = await request('/api/auth/me', {}, registration.cookie);
  assert.equal(afterLogout.response.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  assert.equal(login.response.status, 200);
  assert.match(login.cookie, /^studysync_session=/);

  const resetRequest = await request('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  assert.equal(resetRequest.response.status, 200);
  assert.equal(typeof resetRequest.body.resetToken, 'string');

  const newPassword = 'new-correct-password';
  const resetConfirm = await request('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: resetRequest.body.resetToken, password: newPassword })
  });
  assert.equal(resetConfirm.response.status, 200);
  const revokedByReset = await request('/api/auth/me', {}, login.cookie);
  assert.equal(revokedByReset.response.status, 401);

  const oldPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  assert.equal(oldPasswordLogin.response.status, 401);
  const newPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: newPassword })
  });
  assert.equal(newPasswordLogin.response.status, 200);

  db.prepare("UPDATE auth_sessions SET expires_at = '2000-01-01T00:00:00.000Z' WHERE user_id = (SELECT id FROM users WHERE email = ?)")
    .run(email);
  const expired = await request('/api/auth/me', {}, newPasswordLogin.cookie);
  assert.equal(expired.response.status, 401);
});

test('login endpoint rate limits repeated failures', async () => {
  const email = `limited-${crypto.randomUUID()}@example.edu`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'incorrect-password' })
    });
    assert.equal(result.response.status, 401);
  }
  const limited = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'incorrect-password' })
  });
  assert.equal(limited.response.status, 429);
  assert.ok(limited.response.headers.get('retry-after'));
});

test('logout-all revokes every active session for the user', async () => {
  const email = `logout-all-${crypto.randomUUID()}@example.edu`;
  const password = 'correct-password';
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Multi Session Student', email, password })
  });
  const secondLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  assert.equal(registration.response.status, 201);
  assert.equal(secondLogin.response.status, 200);

  const logoutAll = await request('/api/auth/logout-all', { method: 'POST', body: '{}' }, registration.cookie);
  assert.equal(logoutAll.response.status, 200);
  assert.equal((await request('/api/auth/me', {}, registration.cookie)).response.status, 401);
  assert.equal((await request('/api/auth/me', {}, secondLogin.cookie)).response.status, 401);
});
