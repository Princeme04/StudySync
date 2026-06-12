import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../observability/logger.ts';
import { recordResponse } from '../observability/monitoring.ts';

const validRequestId = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9._-]{8,128}$/.test(value);

export function requestTelemetry(req: Request, res: Response, next: NextFunction) {
  const requestId = validRequestId(req.get('x-request-id')) ? String(req.get('x-request-id')) : randomUUID();
  const startedAt = performance.now();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Number((performance.now() - startedAt).toFixed(2));
    recordResponse(res.statusCode);
    logger.info({
      event: 'request_complete',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      ip: req.ip
    });
  });

  next();
}
