import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';

const BCRYPT_COST = 12; // modern recommended cost (real Yakkyofy used 8 — see security notes)

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  });
}

const VERIFY_OPTIONS = { algorithms: ['HS256'] };

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwt.accessSecret, VERIFY_OPTIONS);
  if (payload.type === 'refresh') throw new Error('Refresh token used as access token');
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwt.refreshSecret, VERIFY_OPTIONS);
  if (payload.type !== 'refresh') throw new Error('Not a refresh token');
  return payload;
}

// A real bcrypt hash (cost 12) of a random string, compared against when the email doesn't exist,
// so a login for an unknown account takes as long as one with a wrong password and response time
// doesn't reveal which emails are registered.
const DUMMY_HASH = '$2b$12$pjyrjRjw8kOE6L2oaXeHO.XcdzomaTGfBnoYlUsbP.953fFPZImbq';

export async function verifyPasswordOrDummy(plain, hash) {
  const ok = await bcrypt.compare(plain, hash || DUMMY_HASH);
  return Boolean(hash) && ok;
}

// Cookies are HttpOnly (+ Secure in prod) so no client-side JS can ever read
// the token — this is the direct fix for the real Yakkyofy weakness
// (js-cookie-readable tokens) found during the earlier security review.
//
// Lax works in both dev and prod because the browser only ever talks to one
// origin either way: in dev the API and SPA share a host, and in prod the
// Vercel frontend proxies /api/* to the Azure API server-side (see
// vercel.json), so from the browser's perspective every request is
// same-origin. An earlier version set SameSite=None in prod to survive a
// direct cross-origin XHR to the Azure host — that broke in any browser
// blocking third-party cookies (Chrome's default third-party cookie
// blocking), since a None cookie set during login was silently dropped on
// every subsequent request. Routing through the same-origin proxy instead
// of loosening SameSite avoids that class of bug entirely.
export function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    domain: env.cookieDomain,
    maxAge: maxAgeMs,
    path: '/',
  };
}

export async function findUserByEmailWithHash(email) {
  return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
}
