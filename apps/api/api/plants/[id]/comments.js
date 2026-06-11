import { handleCors } from '../../_lib/cors.js';
import { query } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  const plantId = parseInt(id);
  if (isNaN(plantId)) return res.status(400).json({ error: 'Geçersiz ID.' });

  if (req.method === 'GET') {
    const result = await query(
      'SELECT username, text, created_at AS "createdAt" FROM plant_comments WHERE plant_id = $1 ORDER BY created_at ASC',
      [plantId]
    );
    return res.json(result.rows);
  }

  if (req.method === 'POST') {
    const authUser = requireAuth(req, res);
    if (!authUser) return;

    const { text } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ error: 'Yorum boş olamaz.' });
    if (text.trim().length > 500) return res.status(400).json({ error: 'Yorum en fazla 500 karakter olabilir.' });

    await query(
      'INSERT INTO plant_comments (plant_id, username, text, created_at) VALUES ($1, $2, $3, NOW())',
      [plantId, authUser.name, text.trim()]
    );
    return res.json({ success: true });
  }

  res.status(405).end();
}
