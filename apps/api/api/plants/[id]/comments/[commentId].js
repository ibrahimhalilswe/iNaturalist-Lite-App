import { handleCors } from '../../../_lib/cors.js';
import { query } from '../../../_lib/db.js';
import { requireAuth } from '../../../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).end();

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const plantId = parseInt(req.query.id);
  const commentId = parseInt(req.query.commentId);
  if (isNaN(plantId) || isNaN(commentId)) return res.status(400).json({ error: 'Geçersiz ID.' });

  const result = await query(
    'SELECT username FROM plant_comments WHERE id = $1 AND plant_id = $2',
    [commentId, plantId]
  );
  const comment = result.rows[0];
  if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
  if (comment.username !== authUser.name) return res.status(403).json({ error: 'Yetkisiz.' });

  await query('DELETE FROM plant_comments WHERE id = $1', [commentId]);
  res.json({ success: true });
}
