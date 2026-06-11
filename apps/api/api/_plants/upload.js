import { handleCors } from '../_lib/cors.js';
import { uploadImage } from '../_lib/cloudinary.js';
import { validatePlantImage } from '../_lib/plantnet.js';
import * as _shared from '../_lib/shared.js';
const { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } = _shared;
import path from 'path';

export const config = { api: { bodyParser: false } };

const FILE_MAGIC = {
  '.jpg':  [0xFF, 0xD8, 0xFF],
  '.jpeg': [0xFF, 0xD8, 0xFF],
  '.png':  [0x89, 0x50, 0x4E, 0x47],
  '.gif':  [0x47, 0x49, 0x46],
  '.webp': [0x52, 0x49, 0x46, 0x46],
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseBoundary(contentType) {
  const match = contentType?.match(/boundary=([^\s;]+)/);
  return match ? match[1] : null;
}

function parseMultipart(buffer, boundary) {
  const sep = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = 0;

  while (true) {
    const idx = buffer.indexOf(sep, start);
    if (idx === -1) break;
    const partStart = idx + sep.length + 2; // skip \r\n
    const nextIdx = buffer.indexOf(sep, partStart);
    if (nextIdx === -1) break;
    const partEnd = nextIdx - 2; // skip \r\n before boundary

    const headerEnd = buffer.indexOf('\r\n\r\n', partStart);
    if (headerEnd === -1 || headerEnd >= partEnd) { start = nextIdx; continue; }

    const headers = buffer.slice(partStart, headerEnd).toString();
    const data = buffer.slice(headerEnd + 4, partEnd);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);

    parts.push({
      name: nameMatch?.[1],
      filename: filenameMatch?.[1],
      contentType: ctMatch?.[1]?.trim(),
      data,
    });
    start = nextIdx;
  }
  return parts;
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const boundary = parseBoundary(req.headers['content-type']);
  if (!boundary) return res.status(400).json({ error: 'Form verisi bekleniyor.' });

  const rawBody = await readBody(req);
  const parts = parseMultipart(rawBody, boundary);

  const filePart = parts.find((p) => p.name === 'file' && p.filename);
  if (!filePart || !filePart.data.length) return res.status(400).json({ error: 'Dosya boÅŸ.' });

  if (filePart.data.length > MAX_IMAGE_SIZE_BYTES)
    return res.status(400).json({ error: 'Dosya 5MB sınırını aşıyor.' });

  const ext = path.extname(filePart.filename || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.some((t) => t.endsWith(ext.slice(1))))
    return res.status(400).json({ error: 'Sadece jpg, jpeg, png, webp, gif uzantılı dosyalar kabul edilir.' });

  const sig = FILE_MAGIC[ext];
  if (sig && !sig.every((b, i) => filePart.data[i] === b))
    return res.status(400).json({ error: 'Dosya içeriği uzantısıyla eşleşmiyor.' });

  const validation = await validatePlantImage(filePart.data, filePart.contentType);
  if (!validation.isValid) return res.status(400).json({ error: validation.message });

  const url = await uploadImage(filePart.data, ext);
  res.json({ url });
}
