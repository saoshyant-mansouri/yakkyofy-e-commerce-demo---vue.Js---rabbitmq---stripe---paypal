import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { cartRouter } from './routes/cart.js';
import { currenciesRouter } from './routes/currencies.js';
import { checkoutRouter } from './routes/checkout.js';
import { ordersRouter } from './routes/orders.js';
import { webhooksRouter } from './routes/webhooks.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Browser -> Vercel (rewrite proxy) -> Azure Container Apps ingress -> this process. Trusting
  // those two hops makes req.ip the real client, so per-IP rate limits apply per visitor. Before,
  // every request appeared to come from the ingress, so all visitors shared one login bucket and
  // anyone could lock everyone out.
  app.set('trust proxy', 2);

  app.use(helmet());
  // Explicit origin allowlist (not '*') so cookies can be sent with
  // credentials — the direct fix for the wildcard-CORS finding on the real app.
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(pinoHttp({ logger }));
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
  );

  // Stripe webhook needs the raw body for signature verification, so it's
  // mounted with express.raw() before the global json() parser applies to
  // everything else.
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  // Under /api (unlike /health) so the frontend can reach it through the
  // same-origin Vercel proxy — see apps/web/src/main.js. Does no DB/service
  // work, just confirms the process is up, so it's the cheapest possible
  // way to trigger a cold container awake while the user is still reading
  // the landing page, before they've clicked anything that actually needs data.
  app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/currencies', currenciesRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/orders', ordersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
