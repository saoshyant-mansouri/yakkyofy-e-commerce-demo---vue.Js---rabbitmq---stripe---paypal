import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/index.js';
import {
  hashPassword,
  verifyPasswordOrDummy,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  cookieOptions,
  findUserByEmailWithHash,
} from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../config/logger.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-account cap on failed logins. The per-IP limiter above can be sidestepped by anyone calling
// the API host directly with a forged X-Forwarded-For, so password guessing against one account is
// also capped by the email being tried. Successful logins don't count.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `login:${String(req.body?.email || '').trim().toLowerCase()}`,
});

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setAuthCookies(res, user) {
  res.cookie('access_token', signAccessToken(user), cookieOptions(ACCESS_MAX_AGE));
  res.cookie('refresh_token', signRefreshToken(user), cookieOptions(REFRESH_MAX_AGE));
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80),
});

authRouter.post('/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password, name } = parsed.data;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, name });

  setAuthCookies(res, user);
  res.status(201).json({ user });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

authRouter.post('/login', authLimiter, loginAccountLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password } = parsed.data;
  const user = await findUserByEmailWithHash(email);
  const valid = await verifyPasswordOrDummy(password, user?.passwordHash);
  if (!valid) {
    logger.warn({ ip: req.ip }, 'Failed login');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  setAuthCookies(res, user);
  res.json({ user });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('access_token', cookieOptions(0));
  res.clearCookie('refresh_token', cookieOptions(0));
  res.status(204).end();
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    setAuthCookies(res, user);
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
