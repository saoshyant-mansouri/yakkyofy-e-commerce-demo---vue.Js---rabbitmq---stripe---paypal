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

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
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
