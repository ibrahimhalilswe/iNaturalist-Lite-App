import { ENDPOINTS, resolvePhotoUrl } from '../constants/api';
import { getToken } from '../utils/storage';

const normalizePlant = (item) => ({
  id:           item.id,
  name:         item.name || 'Bilinmeyen',
  description:  item.description || '',
  photoUrl:     resolvePhotoUrl(item.photoUrl || item.photourl),
  userName:     item.userName || item.username || 'Misafir',
  userBadge:    item.userBadge || item.userbadge || '🌱',
  lat:          Number(item.lat || 0),
  lng:          Number(item.lng || 0),
  createdAt:    item.createdAt || item.createdat || null,
  commentCount: item.commentCount || 0,
});

export const fetchPlants = async (page = 1, pageSize = 20, search = '') => {
  const params = new URLSearchParams({ page, pageSize });
  if (search) params.set('search', search);
  const res = await fetch(`${ENDPOINTS.plants}?${params}`);
  if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);
  const data = await res.json();
  const plantsArray = Array.isArray(data) ? data : (data.plants || []);
  const total = data.total ?? plantsArray.length;
  return { plants: plantsArray.map(normalizePlant), total, page, pageSize };
};

export const fetchStats = async () => {
  const res = await fetch(ENDPOINTS.stats);
  if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);
  return res.json();
};

export const uploadPhoto = async (imageUri) => {
  const token = await getToken();
  const formData = new FormData();
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? ('image/' + match[1].toLowerCase()) : 'image/jpeg';
  formData.append('file', { uri: imageUri, name: filename, type });
  const res = await fetch(ENDPOINTS.upload, {
    method: 'POST', body: formData,
    headers: { 
      'Content-Type': 'multipart/form-data',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
  });
  if (!res.ok) {
    let errMsg = 'Fotoğraf yükleme hatası: ' + res.status;
    try {
      const text = await res.text();
      if (text) errMsg = text.replace(/"/g, '');
    } catch (e) {}
    throw new Error(errMsg);
  }
  const data = await res.json();
  return data.url || data.photoUrl || data;
};

export const savePlant = async ({ name, description, lat, lng, photoUrl, userName, userBadge }) => {
  const token = await getToken();
  const res = await fetch(ENDPOINTS.plants, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name, description, lat, lng, photoUrl }),
  });
  if (!res.ok) throw new Error('Kaydetme hatası: ' + res.status);
  return res.json();
};

export const fetchLikes = async (plantId) => {
  try {
    const token = await getToken();
    const res = await fetch(ENDPOINTS.likes(plantId), {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (!res.ok) return { count: 0, liked: false };
    return res.json();
  } catch { return { count: 0, liked: false }; }
};

export const toggleLike = async (plantId) => {
  const token = await getToken();
  const res = await fetch(ENDPOINTS.like(plantId), { 
    method: 'POST',
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) throw new Error('Beğeni hatası');
  return res.json();
};

export const fetchComments = async (plantId) => {
  try {
    const res = await fetch(ENDPOINTS.comments(plantId));
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
};

export const postComment = async (plantId, text) => {
  const token = await getToken();
  const res = await fetch(ENDPOINTS.comments(plantId), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ text }),
  });
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) throw new Error('Yorum gönderilemedi');
  return res.json();
};

export const fetchPublicProfile = async (username) => {
  const res = await fetch(ENDPOINTS.publicProfile(username));
  if (!res.ok) throw new Error('Profil yüklenemedi: ' + res.status);
  return res.json();
};

export const fetchPublicPlants = async (username) => {
  const res = await fetch(ENDPOINTS.publicPlants(username));
  if (!res.ok) throw new Error('Bitkiler yüklenemedi: ' + res.status);
  const data = await res.json();
  const plantsArray = Array.isArray(data) ? data : (data.plants || []);
  return plantsArray.map(normalizePlant);
};
