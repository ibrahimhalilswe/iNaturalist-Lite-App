import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { requireAuth, generateToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (req.method === 'GET') {
    const result = await query(
      'SELECT id, username, email, badge, avatar_url, created_at FROM users WHERE id = $1::int',
      [authUser.sub]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const [obsResult, speciesResult] = await Promise.all([
      query('SELECT COUNT(*) FROM plants WHERE username = $1', [user.username]),
      query('SELECT COUNT(DISTINCT name) FROM plants WHERE username = $1', [user.username]),
    ]);

    return res.json({
      username: user.username,
      email: user.email,
      badge: user.badge,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      totalObservations: parseInt(obsResult.rows[0].count),
      discoveredSpecies: parseInt(speciesResult.rows[0].count),
    });
  }

  if (req.method === 'POST') {
    const { username, avatarUrl } = req.body || {};

    if (username) {
      const existing = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2::int',
        [username, authUser.sub]
      );
      if (existing.rows.length > 0)
        return res.status(400).json({ error: 'Bu kullanıcı adı alınmış.' });

      const currentResult = await query('SELECT username FROM users WHERE id = $1::int', [authUser.sub]);
      const oldUsername = currentResult.rows[0]?.username;

      await query('UPDATE users SET username = $1 WHERE id = $2::int', [username, authUser.sub]);

      if (oldUsername && oldUsername !== username) {
        await Promise.all([
          query('UPDATE plants SET username = $1 WHERE username = $2', [username, oldUsername]),
          query('UPDATE plant_comments SET username = $1 WHERE username = $2', [username, oldUsername]),
          query('UPDATE plant_likes SET username = $1 WHERE username = $2', [username, oldUsername]),
        ]);
      }
    }
    if (avatarUrl) {
      await query('UPDATE users SET avatar_url = $1 WHERE id = $2::int', [avatarUrl, authUser.sub]);
    }

    const updated = await query(
      'SELECT id, username, email, badge, avatar_url FROM users WHERE id = $1::int',
      [authUser.sub]
    );
    const u = updated.rows[0];
    const newToken = generateToken(u);
    return res.json({ success: true, username: u.username, avatarUrl: u.avatar_url, token: newToken });
  }

  res.status(405).end();
}
