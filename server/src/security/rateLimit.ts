import type { Request, Response, NextFunction } from 'express';

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();

const rateLimitMultiplier = () => {
  const multiplier = Number(process.env.STUDYSYNC_RATE_LIMIT_MULTIPLIER || 1);
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
};

export const rateLimit = (name: string, limit: number, windowMs: number, keyPart?: (req: Request) => string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const effectiveLimit = Math.ceil(limit * rateLimitMultiplier());
    const key = `${name}:${req.ip}:${keyPart?.(req) || ''}`;
    const currentTime = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt <= currentTime) {
      attempts.set(key, { count: 1, resetAt: currentTime + windowMs });
      return next();
    }
    if (current.count >= effectiveLimit) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - currentTime) / 1000));
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    current.count += 1;
    next();
  };

export const clearRateLimits = () => attempts.clear();
