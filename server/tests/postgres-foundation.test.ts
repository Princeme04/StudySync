import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newDb } from 'pg-mem';
import { runPostgresMigrations } from '../src/db/postgresMigrations.ts';
import { checkPostgresWorkflow } from '../src/db/postgresWorkflowCheck.ts';

test('PostgreSQL migrations apply once and create the required schema', async () => {
  const memory = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  const adapter = memory.adapters.createPg();
  const client = new adapter.Client();
  await client.connect();

  const first = await runPostgresMigrations(client);
  const second = await runPostgresMigrations(client);
  assert.deepEqual(first.applied, ['001_initial_schema.sql', '002_integrity_constraints.sql', '003_workflow_integrity.sql', '004_remove_simulated_features.sql', '005_remove_demo_seed_data.sql', '006_group_discovery_conversations.sql']);
  assert.deepEqual(second.skipped, first.applied);

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `);
  const names = new Set((tables.rows as Array<{ table_name: string }>).map((row) => row.table_name));
  ['users', 'auth_sessions', 'group_members', 'match_candidates', 'conversations', 'conversation_members'].forEach((name) => assert.ok(names.has(name)));
  assert.equal(names.has('payments'), false);
  assert.equal(names.has('ai_feedback'), false);
  await checkPostgresWorkflow(client);

  await client.end();
});

test('staging and backup operations are explicitly configured', () => {
  const compose = readFileSync('docker-compose.staging.yml', 'utf8');
  const env = readFileSync('.env.staging.example', 'utf8');
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(compose, /postgres:17-alpine/);
  assert.match(compose, /db-migrate/);
  assert.match(compose, /db:pg:workflow-check/);
  assert.match(compose, /pg_dump/);
  assert.match(env, /DATABASE_URL=/);
  assert.doesNotMatch(env, /SEED_DEMO_DATA/);
  assert.match(ci, /db:pg:workflow-check/);
  assert.match(ci, /pg_dump/);
  assert.match(ci, /pg_restore/);
});
