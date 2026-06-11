import { handleCors } from './_lib/cors.js';
import { query } from './_lib/db.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const health = {};

  try {
    await query('SELECT 1');
    health.database = 'Connected (Supabase)';
  } catch (err) {
    health.database = `Error: ${err.message}`;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  health.cloudinary = cloudName && apiKey ? `Configured (${cloudName})` : 'Missing Credentials';

  res.json({ status: 'System Check Completed', details: health, time: new Date().toISOString() });
}
