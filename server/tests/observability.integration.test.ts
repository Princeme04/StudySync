import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.STUDYSYNC_DB_PATH = join(mkdtempSync(join(tmpdir(), 'studysync-observability-')), 'test.db');

const { app } = await import('../src/app.ts');
const { db } = await import('../src/db/connection.ts');
const { resetMonitoring } = await import('../src/observability/monitoring.ts');
resetMonitoring();

const server = app.listen(0);
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Test server did not bind.');
const baseUrl = `http://127.0.0.1:${address.port}`;

test.after(() => {
  server.close();
  db.close();
});

test('liveness, readiness, request IDs, and centralized errors work', async () => {
  const ready = await fetch(`${baseUrl}/api/ready`, { headers: { 'X-Request-Id': 'test-request-id' } });
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get('x-request-id'), 'test-request-id');
  assert.equal((await ready.json()).status, 'ready');

  const failure = await fetch(`${baseUrl}/api/_test/error`);
  assert.equal(failure.status, 500);
  const failureBody = await failure.json();
  assert.equal(failureBody.code, 'internal_error');
  assert.equal(typeof failureBody.requestId, 'string');

  const missing = await fetch(`${baseUrl}/not-a-route`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, 'not_found');

  await new Promise((resolve) => setTimeout(resolve, 10));
  const health = await fetch(`${baseUrl}/api/health`);
  const healthBody = await health.json();
  assert.equal(healthBody.status, 'live');
  assert.ok(healthBody.requests >= 3);
  assert.ok(healthBody.errors >= 1);
});
