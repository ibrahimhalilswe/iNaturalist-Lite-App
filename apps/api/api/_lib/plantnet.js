export async function validatePlantImage(buffer, mimeType) {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) return { isValid: true };

  try {
    const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' });
    const form = new FormData();
    form.append('images', blob, 'photo.jpg');
    form.append('organs', 'auto');

    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&include-related-images=false&no-reject=false&lang=tr`;
    const res = await fetch(url, { method: 'POST', body: form });

    if (res.status === 404)
      return { isValid: false, message: 'Sistem bu fotoğrafta bir bitki algılayamadı. Lütfen doğadan geçerli bir bitki fotoğrafı yükleyin.' };

    if (res.status === 429) return { isValid: true };

    if (!res.ok)
      return { isValid: false, message: `Doğrulama servisi hatası (${res.status}).` };

    return { isValid: true };
  } catch {
    return { isValid: true };
  }
}
