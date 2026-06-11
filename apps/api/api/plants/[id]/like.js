import { handleCors } from '../../_lib/cors.js';
import { query } from '../../_lib/db.js';
import { requireAuth, getAuthUser } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  const plantId = parseInt(id);
  if (isNaN(plantId)) return res.status(400).json({ error: 'Geçersiz ID.' });

  if (req.method === 'GET') {
    const authUser = getAuthUser(req);
    const countResult = await query('SELECT COUNT(*) FROM plant_likes WHERE plant_id = $1', [plantId]);
    const count = parseInt(countResult.rows[0].count);
    let liked = false;
    if (authUser) {
      const r = await query(
        'SELECT 1 FROM plant_likes WHERE plant_id = $1 AND username = $2',
        [plantId, authUser.name]
      );
      liked = r.rows.length > 0;
    }
    return res.json({ count, liked });
  }

  if (req.method === 'POST') {
    const authUser = requireAuth(req, res);
    if (!authUser) return;

    const existing = await query(
      'SELECT id FROM plant_likes WHERE plant_id = $1 AND username = $2',
      [plantId, authUser.name]
    );

    let liked;
    if (existing.rows.length > 0) {
      await query('DELETE FROM plant_likes WHERE plant_id = $1 AND username = $2', [plantId, authUser.name]);
      liked = false;
    } else {
      await query('INSERT INTO plant_likes (plant_id, username) VALUES ($1, $2)', [plantId, authUser.name]);
      liked = true;
    }

    const countResult = await query('SELECT COUNT(*) FROM plant_likes WHERE plant_id = $1', [plantId]);
    return res.json({ liked, count: parseInt(countResult.rows[0].count) });
  }

  res.status(405).end();
}
