import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClientBase } from 'pg';

const currentDir = dirname(fileURLToPath(import.meta.url));
export const postgresMigrationsDir = resolve(currentDir, '../../postgres/migrations');

export type MigrationResult = { applied: string[]; skipped: string[] };

export async function runPostgresMigrations(client: ClientBase, migrationsDir = postgresMigrationsDir): Promise<MigrationResult> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const existing = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
    if (existing.rowCount) {
      skipped.push(file);
      continue;
    }

    await client.query('BEGIN');
    try {
      await client.query(readFileSync(join(migrationsDir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied.push(file);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`PostgreSQL migration failed: ${file}`, { cause: error });
    }
  }

  return { applied, skipped };
}
