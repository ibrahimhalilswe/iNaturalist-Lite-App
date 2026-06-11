import { handleCors } from '../../_lib/cors.js';
import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { username } = req.query;

  const result = await query(
    `SELECT id, name, description, photourl, username, userbadge, createdat,
            ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
     FROM plants WHERE LOWER(username) = LOWER($1) ORDER BY createdat DESC`,
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
