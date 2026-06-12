import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { db, id, now } from '../db/connection.ts';

const SESSION_COOKIE = 'studysync_session';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const expiresAt = (ttlMs: number) => new Date(Date.now() + ttlMs).toISOString();

const cookieToken = (req: Request) => {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : '';
};

export const requestSessionToken = (req: Request) => {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  return cookieToken(req) || bearer;
};

export const createSession = (userId: string, req: Request, res: Response) => {
  const token = randomBytes(32).toString('base64url');
  const createdAt = now();
  const expiry = expiresAt(SESSION_TTL_MS);
  db.prepare(`
    INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_used_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id('session'), userId, hashToken(token), expiry, createdAt, createdAt, req.get('user-agent') || '', req.ip || '');
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: SESSION_TTL_MS
  });
  return { token, expiresAt: expiry };
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api'
  });
};

export const sessionUser = (req: Request) => {
  const token = requestSessionToken(req);
  if (!token) return undefined;
  const row = db.prepare(`
    SELECT u.*, s.id AS session_id
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(hashToken(token), now()) as Record<string, any> | undefined;
  if (row) db.prepare('UPDATE auth_sessions SET last_used_at = ? WHERE id = ?').run(now(), row.session_id);
  return row;
};

export const revokeCurrentSession = (req: Request) => {
  const token = requestSessionToken(req);
  if (token) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
};

export const revokeAllSessions = (userId: string) => {
  db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
};

export const cleanupExpiredSessions = () => {
  db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(now());
  db.prepare('DELETE FROM password_reset_tokens WHERE expires_at <= ? OR used_at IS NOT NULL').run(now());
};

export const tokenHash = hashToken;
export const resetTokenExpiry = () => expiresAt(15 * 60 * 1000);
