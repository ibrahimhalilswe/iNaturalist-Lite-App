import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const [total, unique, active] = await Promise.all([
    query('SELECT COUNT(*) FROM plants'),
    query('SELECT COUNT(DISTINCT name) FROM plants'),
    query('SELECT COUNT(DISTINCT username) FROM plants'),
  ]);

  res.json({
    totalObservations: parseInt(total.rows[0].count),
    uniquePlants: parseInt(unique.rows[0].count),
    activeUsers: parseInt(active.rows[0].count),
  });
}
