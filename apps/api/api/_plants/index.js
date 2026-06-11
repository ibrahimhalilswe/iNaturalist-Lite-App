import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import * as _shared from '../_lib/shared.js';
const { PAGINATION_DEFAULT_PAGE_SIZE, DEFAULT_BADGE, DEFAULT_USERNAME } = _shared;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    const page = Math.max(1, parseInt(req.query?.page) || 1);
    const pageSize = Math.min(100, parseInt(req.query?.pageSize) || PAGINATION_DEFAULT_PAGE_SIZE);
    const offset = (page - 1) * pageSize;
    const search = req.query?.search?.trim() || '';

    const params = search
      ? [`%${search}%`, pageSize, offset]
      : [pageSize, offset];

    const whereClause = search ? 'WHERE p.name ILIKE $1' : '';
    const limitParam = search ? '$2' : '$1';
    const offsetParam = search ? '$3' : '$2';

    const countParams = search ? [`%${search}%`] : [];

    const [countResult, plantsResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM plants p ${whereClause}`, countParams),
      query(
        `SELECT p.id, p.name, p.description, p.photourl, p.username,
                COALESCE(u.badge, p.userbadge) AS userbadge, p.createdat,
                ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng,
                COALESCE(c.comment_count, 0) AS comment_count
         FROM plants p
         LEFT JOIN users u ON u.username = p.username
         LEFT JOIN (SELECT plant_id, COUNT(*) AS comment_count FROM plant_comments GROUP BY plant_id) c
           ON c.plant_id = p.id
         ${whereClause}
         ORDER BY p.createdat DESC LIMIT ${limitParam}::int OFFSET ${offsetParam}::int`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const plants = plantsResult.rows.map(mapPlant);
    return res.json({ plants, total, page, pageSize });
  }

  if (req.method === 'POST') {
    const authUser = requireAuth(req, res);
    if (!authUser) return;

    const { name, description, photoUrl, lat = 0, lng = 0 } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Bitki adÄ± gerekli.' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Bitki adÄ± en fazla 100 karakter olabilir.' });
    if (description && description.length > 1000) return res.status(400).json({ error: 'AÃ§Ä±klama en fazla 1000 karakter olabilir.' });
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) return res.status(400).json({ error: 'GeÃ§ersiz enlem deÄŸeri.' });
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) return res.status(400).json({ error: 'GeÃ§ersiz boylam deÄŸeri.' });

    await query(
      `INSERT INTO plants (name, description, photourl, username, userbadge, createdat, location)
       VALUES ($1, $2, $3, $4, $5, NOW(), ST_SetSRID(ST_MakePoint($6::float8, $7::float8), 4326))`,
      [
        name.trim(),
        description || null,
        photoUrl || null,
        authUser.name || DEFAULT_USERNAME,
        authUser.badge || DEFAULT_BADGE,
        parsedLng,
        parsedLat,
      ]
    );

    return res.json({ success: true, message: 'BaÅŸarÄ±yla kaydedildi.' });
  }

  res.status(405).end();
}

function mapPlant(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    photoUrl: row.photourl,
    userName: row.username,
    userBadge: row.userbadge,
    createdAt: row.createdat,
    lat: parseFloat(row.lat) || 0,
    lng: parseFloat(row.lng) || 0,
    commentCount: parseInt(row.comment_count) || 0,
  };
}
