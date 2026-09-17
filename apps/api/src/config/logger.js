import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  // pino-http logs request/response headers; the auth cookies and webhook signature in them are
  // credentials, so they're censored before anything is written.
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["stripe-signature"]',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
  transport: env.isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});
