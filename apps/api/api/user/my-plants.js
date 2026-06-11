import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const result = await query(
    `SELECT p.id, p.name, p.description, p.photourl, p.username, p.userbadge, p.createdat,
            ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng,
            COALESCE(lc.like_count, 0) AS like_count
     FROM plants p
     LEFT JOIN (SELECT plant_id, COUNT(*) AS like_count FROM plant_likes GROUP BY plant_id) lc
       ON lc.plant_id = p.id
     WHERE p.username = $1
     ORDER BY p.createdat DESC`,
    [authUser.name]
  );

  res.json(result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    photoUrl: r.photourl,
    userName: r.username,
    userBadge: r.userbadge,
    createdAt: r.createdat,
    lat: parseFloat(r.lat) || 0,
    lng: parseFloat(r.lng) || 0,
    likeCount: parseInt(r.like_count) || 0,
  })));
}
