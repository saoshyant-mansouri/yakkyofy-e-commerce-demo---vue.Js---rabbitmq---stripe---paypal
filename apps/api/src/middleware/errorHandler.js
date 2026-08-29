import { logger } from '../config/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Invalid input', issues: err.issues });
  }
  logger.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || 'Internal server error' });
}
