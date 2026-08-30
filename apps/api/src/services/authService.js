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

// Cookies are HttpOnly + SameSite=Lax (+ Secure in prod) so no client-side JS
// can ever read the token — this is the direct fix for the real Yakkyofy
// weakness (js-cookie-readable tokens) found during the earlier security review.
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
