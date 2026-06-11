import bcrypt from 'bcryptjs';
import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { sendPasswordChangedEmail } from '../_lib/email.js';
import _shared from '@inaturalist/shared';
const { validatePassword } = _shared;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { email, otpCode, newPassword } = req.body || {};
  const pwError = validatePassword(newPassword);
  if (pwError) return res.status(400).json({ error: pwError });

  const result = await query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email?.toLowerCase()]
  );
  const user = result.rows[0];

  if (!user || !user.otp_code || !user.otp_expiry || new Date(user.otp_expiry) < new Date())
    return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş kod.' });

  if ((user.otp_attempts || 0) >= 5) {
    await query('UPDATE users SET otp_code = NULL, otp_expiry = NULL, otp_attempts = 0 WHERE id = $1', [user.id]);
    return res.status(400).json({ error: 'Çok fazla yanlış deneme. Yeni kod talep et.' });
  }

  if (user.otp_code !== otpCode) {
    await query('UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1', [user.id]);
    return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş kod.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password_hash = $1, otp_code = NULL, otp_expiry = NULL, otp_attempts = 0 WHERE id = $2',
    [passwordHash, user.id]
  );

  const mailError = await sendPasswordChangedEmail(user.email, user.username);
  const response = { success: true };
  if (mailError) response.message = `Şifre başarıyla sıfırlandı ancak mail gönderimi başarısız: ${mailError}`;

  res.json(response);
}
