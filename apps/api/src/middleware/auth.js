import { verifyAccessToken } from '../services/authService.js';
import { User } from '../models/index.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
}
