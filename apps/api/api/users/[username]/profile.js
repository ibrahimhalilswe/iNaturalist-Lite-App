import { handleCors } from '../../_lib/cors.js';
import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { username } = req.query;

  const result = await query(
    'SELECT username, badge, avatar_url, created_at FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  const [obsResult, speciesResult] = await Promise.all([
    query('SELECT COUNT(*) FROM plants WHERE LOWER(username) = LOWER($1)', [username]),
    query('SELECT COUNT(DISTINCT name) FROM plants WHERE LOWER(username) = LOWER($1)', [username]),
  ]);

  res.json({
    username: user.username,
    badge: user.badge,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    totalObservations: parseInt(obsResult.rows[0].count),
    discoveredSpecies: parseInt(speciesResult.rows[0].count),
  });
}
