import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  // Host only: the URI carries the database password, which must never reach the logs.
  const { host, name } = mongoose.connection;
  logger.info({ host, db: name }, 'MongoDB connected');
  return mongoose.connection;
}
