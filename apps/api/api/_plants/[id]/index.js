import { handleCors } from '../../_lib/cors.js';
import { query } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';
import { deleteImage } from '../../_lib/cloudinary.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  const plantId = parseInt(id);
  if (isNaN(plantId)) return res.status(400).json({ error: 'Geçersiz ID.' });

  if (req.method === 'DELETE') {
    const authUser = requireAuth(req, res);
    if (!authUser) return;

    const result = await query('SELECT username, photourl FROM plants WHERE id = $1::int', [plantId]);
    const plant = result.rows[0];
    if (!plant) return res.status(404).json({ error: 'Bitki bulunamadı.' });
    if (plant.username !== authUser.name) return res.status(403).json({ error: 'Yetkisiz.' });

    await query('DELETE FROM plants WHERE id = $1::int', [plantId]);
    // Cloudinary'den fotoğrafı sil (hata olsa bile silmeye devam et)
    if (plant.photourl) deleteImage(plant.photourl).catch(() => {});
    return res.json({ success: true });
  }

  res.status(405).end();
}
