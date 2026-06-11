import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'super_secret_naturalist_key_minimum_32_chars_123456789';
const ISSUER = process.env.JWT_ISSUER || 'iNaturalistLite';
const AUDIENCE = process.env.JWT_AUDIENCE || 'iNaturalistLite';

export function generateToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      name: user.username,
      email: user.email,
      badge: user.badge || '🌱',
    },
    SECRET,
    { expiresIn: '30d', issuer: ISSUER, audience: AUDIENCE }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET, { issuer: ISSUER, audience: AUDIENCE });
}

export function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Yetkisiz erişim.' });
    return null;
  }
  return user;
}
