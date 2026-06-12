import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(currentDir, '../../data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(process.env.STUDYSYNC_DB_PATH || resolve(dataDir, 'studysync.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(readFileSync(resolve(currentDir, 'schema.sql'), 'utf8'));

export const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export const now = () => new Date().toISOString();
export const parseJson = <T>(value: unknown, fallback: T): T => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const updateMetric = (key: string, amount = 1) => {
  db.prepare(`
    INSERT INTO metrics (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = value + excluded.value
  `).run(key, amount);
};
