import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { sendOtpEmail } from '../_lib/email.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'E-posta gerekli.' });

  const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await query('UPDATE users SET otp_code = $1, otp_expiry = $2::timestamptz, otp_attempts = 0 WHERE id = $3::int', [otp, expiry, user.id]);

  const mailError = await sendOtpEmail(user.email, user.username, otp);
  res.json({ success: true, ...(mailError ? { mailError } : {}) });
}
