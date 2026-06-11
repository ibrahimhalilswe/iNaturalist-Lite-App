import { handleCors } from '../_lib/cors.js';
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const username = authUser.name;

  const [obsResult, likesReceivedResult, likesGivenResult, monthResult, speciesResult] = await Promise.all([
    query(`SELECT COUNT(*) AS total FROM plants WHERE username = $1`, [username]),
    query(
      `SELECT COUNT(*) AS total FROM plant_likes pl
       JOIN plants p ON p.id = pl.plant_id WHERE p.username = $1`,
      [username]
    ),
    query(`SELECT COUNT(*) AS total FROM plant_likes WHERE username = $1`, [username]),
    query(
      `SELECT COUNT(*) AS total FROM plants
       WHERE username = $1 AND createdat >= NOW() - INTERVAL '30 days'`,
      [username]
    ),
    query(
      `SELECT COUNT(DISTINCT LOWER(name)) AS total FROM plants WHERE username = $1`,
      [username]
    ),
  ]);

  res.json({
    totalObservations: parseInt(obsResult.rows[0].total),
    likesReceived: parseInt(likesReceivedResult.rows[0].total),
    likesGiven: parseInt(likesGivenResult.rows[0].total),
    observationsThisMonth: parseInt(monthResult.rows[0].total),
    uniqueSpecies: parseInt(speciesResult.rows[0].total),
  });
}
