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
            ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng
     FROM plant_likes l
     JOIN plants p ON l.plant_id = p.id
     WHERE l.username = $1
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
  })));
}
