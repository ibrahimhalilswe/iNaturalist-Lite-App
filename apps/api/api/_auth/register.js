import bcrypt from 'bcryptjs';
import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { generateToken } from '../_lib/auth.js';
import { sendWelcomeEmail } from '../_lib/email.js';
import * as _shared from '../_lib/shared.js';
const { validateRegisterInput, DEFAULT_BADGE } = _shared;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { username, email, password } = req.body || {};
  const validationError = validateRegisterInput({ username, email, password });
  if (validationError) return res.status(400).json({ error: validationError });

  const existing = await query(
    'SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1',
    [username.trim(), email.trim().toLowerCase()]
  );
  if (existing.rows.length > 0)
    return res.status(400).json({ error: 'Bu kullanıcı adı veya e-posta alınmış.' });

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (username, email, password_hash, badge, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, badge`,
    [username.trim(), email.trim().toLowerCase(), passwordHash, DEFAULT_BADGE]
  );

  const user = result.rows[0];
  const token = generateToken(user);

  const mailError = await sendWelcomeEmail(user.email, user.username);

  const response = { success: true, token, username: user.username, email: user.email, badge: user.badge, avatarUrl: null };
  if (mailError) response.message = `Kayıt başarılı ancak mail gönderimi başarısız: ${mailError}`;

  res.json(response);
}
