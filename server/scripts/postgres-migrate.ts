import pg from 'pg';
import { runPostgresMigrations } from '../src/db/postgresMigrations.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const result = await runPostgresMigrations(client);
  console.log(JSON.stringify({ event: 'postgres_migrations_complete', ...result }));
} finally {
  await client.end();
}
