import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
