import path from 'node:path';
import dotenv from 'dotenv';

// Bare `dotenv/config` resolves `.env` relative to `process.cwd()`, which
// under `npm run dev -w apps/api` is the workspace package dir (apps/api),
// not the repo root where the shared .env actually lives — it would load
// nothing and fall through to defaults silently. Same class of bug as
// Vite's `envDir` (apps/web/vite.config.js).
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../../.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parseWebOrigin() {
  const raw = process.env.WEB_ORIGIN;
  const list = raw ? raw.split(',').map((s) => s.trim()) : [];
  if (process.env.NODE_ENV !== 'production') {
    const defaults = ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080', 'http://127.0.0.1:5173'];
    for (const d of defaults) {
      if (!list.includes(d)) list.push(d);
    }
  }
  return list.length === 1 ? list[0] : list;
}

const DEV_SECRETS = new Set(['dev_access_secret_change_me', 'dev_refresh_secret_change_me']);

// Production must not boot on the dev fallbacks (anyone could forge a session with them), on short
// secrets, or on one secret for both token types (a refresh token would then pass as an access token).
function assertProdSecrets({ accessSecret, refreshSecret }) {
  if (process.env.NODE_ENV !== 'production') return;
  for (const [name, value] of [['JWT_ACCESS_SECRET', accessSecret], ['JWT_REFRESH_SECRET', refreshSecret]]) {
    if (DEV_SECRETS.has(value) || value.length < 32) {
      throw new Error(`${name} must be set to a random value of at least 32 characters in production`);
    }
  }
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.API_PORT || 4000),
  webOrigin: parseWebOrigin(),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/yakkyofy_demo'),
  rabbitUrl: required('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    env: process.env.PAYPAL_ENV || 'sandbox',
  },
  mangopay: {
    clientId: process.env.MANGOPAY_CLIENT_ID || '',
    apiKey: process.env.MANGOPAY_API_KEY || '',
    baseUrl: process.env.MANGOPAY_BASE_URL || 'https://api.sandbox.mangopay.com',
  },
  fx: {
    apiUrl: process.env.FX_API_URL || '',
  },
};

assertProdSecrets(env.jwt);
