import { handleCors } from '../../_lib/cors.js';
import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { username } = req.query;

  const result = await query(
    `SELECT p.id, p.name, p.description, p.photourl, p.username,
            COALESCE(u.badge, p.userbadge) AS userbadge, p.createdat,
            ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng
     FROM plants p
     LEFT JOIN users u ON u.username = p.username
     WHERE LOWER(p.username) = LOWER($1) ORDER BY p.createdat DESC`,
    [username]
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
