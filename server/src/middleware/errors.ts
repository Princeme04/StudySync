import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from '../observability/logger.ts';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = 'internal_error',
    public readonly expose = status < 500
  ) {
    super(message);
  }
}

export const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => void handler(req, res, next).catch(next);

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found.',
    code: 'not_found',
    requestId: res.locals.requestId
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const appError = error instanceof AppError ? error : new AppError(error instanceof Error ? error.message : 'Unknown error');
  logger.error({
    event: 'request_error',
    requestId: res.locals.requestId,
    method: req.method,
    path: req.path,
    status: appError.status,
    code: appError.code,
    err: error
  });

  if (res.headersSent) return;
  res.status(appError.status).json({
    error: appError.expose || process.env.NODE_ENV !== 'production' ? appError.message : 'Internal server error.',
    code: appError.code,
    requestId: res.locals.requestId
  });
};
