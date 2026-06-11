import bcrypt from 'bcryptjs';
import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import * as _shared from '../_lib/shared.js';
const { validatePassword } = _shared;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const { oldPassword, newPassword } = req.body || {};
  const pwError = validatePassword(newPassword);
  if (pwError) return res.status(400).json({ error: pwError });

  const result = await query('SELECT * FROM users WHERE id = $1::int LIMIT 1', [authUser.sub]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'KullanÄ±cÄ± bulunamadÄ±.' });

  if (!(await bcrypt.compare(oldPassword, user.password_hash)))
    return res.status(400).json({ error: 'Mevcut ÅŸifreniz yanlÄ±ÅŸ.' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2::int', [passwordHash, user.id]);

  res.json({ success: true });
}
