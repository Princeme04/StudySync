import pg from 'pg';
import { checkPostgresWorkflow } from '../src/db/postgresWorkflowCheck.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await checkPostgresWorkflow(client);
} finally {
  await client.end();
}
