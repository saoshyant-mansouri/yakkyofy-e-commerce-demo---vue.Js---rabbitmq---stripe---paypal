import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logger.info({ uri: env.mongoUri }, 'MongoDB connected');
  return mongoose.connection;
}
