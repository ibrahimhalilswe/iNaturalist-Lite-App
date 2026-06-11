import bcrypt from 'bcryptjs';
import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { generateToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

  const result = await query(
    'SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1',
    [username]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    username: user.username,
    email: user.email,
    badge: user.badge,
    avatarUrl: user.avatar_url,
  });
}
