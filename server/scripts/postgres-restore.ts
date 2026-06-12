import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
const sourceArg = process.argv[2];
const confirmed = process.argv.includes('--confirm-restore');
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!sourceArg) throw new Error('Provide a backup file path.');
if (!confirmed) throw new Error('Restore refused. Re-run with --confirm-restore after verifying the target database.');

const source = resolve(sourceArg);
if (!existsSync(source)) throw new Error(`Backup file not found: ${source}`);

const result = spawnSync('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-acl', '--dbname', databaseUrl, source], { stdio: 'inherit' });
if (result.error) throw new Error('pg_restore is unavailable. Install PostgreSQL client tools or run restores in the staging container.', { cause: result.error });
if (result.status !== 0) throw new Error(`pg_restore failed with exit code ${result.status}.`);
console.log(JSON.stringify({ event: 'postgres_restore_complete', source }));
