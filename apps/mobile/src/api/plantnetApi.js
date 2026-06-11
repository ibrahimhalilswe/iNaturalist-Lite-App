import { ENDPOINTS } from '../constants/api';

// PlantNet artık backend proxy üzerinden gidiyor — API key mobil uygulamada görünmez
export const identifyPlant = async (imageUri) => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? ('image/' + match[1].toLowerCase()) : 'image/jpeg';
  formData.append('images', { uri: imageUri, name: filename, type });
  formData.append('organs', 'flower');

  const res = await fetch(ENDPOINTS.identify, { method: 'POST', body: formData });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('PlantNet hatası (' + res.status + '): ' + err);
  }

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('Bitki tanımlanamadı. Lütfen başka bir fotoğraf deneyin.');
  }

  const best = data.results[0];
  return {
    scientificName: best.species?.scientificNameWithoutAuthor || 'Bilinmiyor',
    commonName:     best.species?.commonNames?.[0] || best.species?.scientificNameWithoutAuthor || 'Bilinmiyor',
    confidence:     Math.round((best.score || 0) * 100),
    family:         best.species?.family?.scientificNameWithoutAuthor || '',
    allResults:     data.results.slice(0, 3).map((r) => ({
      name:       r.species?.commonNames?.[0] || r.species?.scientificNameWithoutAuthor || 'Bilinmiyor',
      scientific: r.species?.scientificNameWithoutAuthor || '',
      confidence: Math.round((r.score || 0) * 100),
    })),
  };
};
