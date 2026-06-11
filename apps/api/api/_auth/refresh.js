import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { requireAuth, generateToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [authUser.sub]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });

  const token = generateToken(user);
  res.json({ success: true, token });
}
