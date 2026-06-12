import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const requiredTables = ['users', 'auth_sessions', 'group_members', 'match_candidates', 'conversations', 'conversation_members', 'study_sessions'];
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const result = await client.query<{ table_name: string }>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  const tables = new Set(result.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !tables.has(table));
  if (missing.length) throw new Error(`Missing PostgreSQL tables: ${missing.join(', ')}`);
  console.log(JSON.stringify({ event: 'postgres_schema_valid', tables: requiredTables }));
} finally {
  await client.end();
}
