import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const deliveries: Array<{ email: string; resetUrl: string; authorization: string }> = [];
const deliveryServer = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    deliveries.push({
      ...JSON.parse(body),
      authorization: String(req.headers.authorization || '')
    });
    res.writeHead(204).end();
  });
});
deliveryServer.listen(0);
const deliveryAddress = deliveryServer.address();
if (!deliveryAddress || typeof deliveryAddress === 'string') throw new Error('Delivery server did not bind.');

process.env.NODE_ENV = 'production';
process.env.STUDYSYNC_DB_PATH = join(mkdtempSync(join(tmpdir(), 'studysync-production-')), 'test.db');
process.env.APP_URL = 'https://studysync.example';
process.env.PASSWORD_RESET_DELIVERY_URL = `http://127.0.0.1:${deliveryAddress.port}/deliver`;
process.env.PASSWORD_RESET_DELIVERY_TOKEN = 'delivery-secret';

const { app } = await import('../src/app.ts');
const { db } = await import('../src/db/connection.ts');
const server = app.listen(0);
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Test server did not bind.');
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
  return {
    response,
    body,
    cookie: response.headers.getSetCookie()[0]?.split(';')[0] || ''
  };
};

test.after(() => {
  server.close();
  deliveryServer.close();
  db.close();
});

test('production starts with registered users only, removes simulated payments, and delivers reset links', async () => {
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count, 0);

  const email = `production-${crypto.randomUUID()}@example.edu`;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Production Student', email, password: 'correct-password' })
  });
  assert.equal(registration.response.status, 201);
  assert.match(registration.response.headers.get('set-cookie') || '', /Secure/);

  const payment = await request('/api/payment/simulate', {
    method: 'POST',
    body: JSON.stringify({ plan: 'pro' })
  }, registration.cookie);
  assert.equal(payment.response.status, 404);

  const reset = await request('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  assert.equal(reset.response.status, 200);
  assert.equal('resetToken' in reset.body, false);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].email, email);
  assert.equal(deliveries[0].authorization, 'Bearer delivery-secret');
  const resetUrl = new URL(deliveries[0].resetUrl);
  assert.equal(resetUrl.origin, 'https://studysync.example');
  assert.equal(resetUrl.pathname, '/auth');
  assert.equal(resetUrl.searchParams.get('mode'), 'reset');
  assert.ok(resetUrl.searchParams.get('token'));
});
