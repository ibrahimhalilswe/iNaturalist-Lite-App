import { handleCors } from './_lib/cors.js';
import _shared from '@inaturalist/shared';
const { MAX_IMAGE_SIZE_BYTES } = _shared;
import path from 'path';

export const config = { api: { bodyParser: false } };

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
    const partStart = idx + sep.length + 2;
    const nextIdx = buffer.indexOf(sep, partStart);
    if (nextIdx === -1) break;
    const partEnd = nextIdx - 2;

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

  const filePart = parts.find((p) => p.name === 'images' && p.filename);
  if (!filePart || !filePart.data.length) return res.status(400).json({ error: 'Dosya boş.' });

  if (filePart.data.length > MAX_IMAGE_SIZE_BYTES)
    return res.status(400).json({ error: 'Dosya 5MB\'dan büyük olamaz.' });

  const organPart = parts.find((p) => p.name === 'organs');
  const organ = organPart?.data.toString().trim() || 'flower';

  const apiKey = process.env.PLANTNET_API_KEY;
  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&include-related-images=false&no-reject=false&lang=tr`;

  try {
    const blob = new Blob([filePart.data], { type: filePart.contentType || 'image/jpeg' });
    const form = new FormData();
    form.append('images', blob, filePart.filename || 'photo.jpg');
    form.append('organs', organ);

    const response = await fetch(url, { method: 'POST', body: form });
    const body = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(body);
  } catch (err) {
    res.status(500).json({ error: 'PlantNet hatası: ' + err.message });
  }
}
