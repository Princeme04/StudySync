import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const backupDir = resolve(process.env.BACKUP_DIR || 'backups');
mkdirSync(backupDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = resolve(backupDir, `studysync-${timestamp}.dump`);
if (!target.startsWith(`${backupDir}\\`) && !target.startsWith(`${backupDir}/`)) throw new Error('Unsafe backup path.');

const result = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', target, databaseUrl], { stdio: 'inherit' });
if (result.error) throw new Error('pg_dump is unavailable. Install PostgreSQL client tools or run backups in the staging container.', { cause: result.error });
if (result.status !== 0) throw new Error(`pg_dump failed with exit code ${result.status}.`);
console.log(JSON.stringify({ event: 'postgres_backup_complete', target }));
