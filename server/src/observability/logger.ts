import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info',
  base: {
    service: 'studysync-api',
    environment: process.env.NODE_ENV || 'development'
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'request.headers.authorization',
      'request.headers.cookie',
      '*.password',
      '*.token',
      '*.resetToken'
    ],
    censor: '[REDACTED]'
  }
});
