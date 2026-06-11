const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body, isForm = false) {
  const headers = { ...authHeaders() };
  let bodyPayload;

  if (isForm) {
    bodyPayload = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    bodyPayload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: bodyPayload });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(data?.error || data || `HTTP ${res.status}`);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  delete: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, formData, true),
};

// Auth
export const register = (d) => api.post('/api/auth/register', d);
export const login = (d) => api.post('/api/auth/login', d);
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (d) => api.post('/api/auth/reset-password', d);
export const changePassword = (d) => api.post('/api/auth/change-password', d);
export const refreshToken = () => api.post('/api/auth/refresh');

// Plants
export const getPlants = (page = 1) => api.get(`/api/plants?page=${page}`);
export const createPlant = (d) => api.post('/api/plants', d);
export const deletePlant = (id) => api.delete(`/api/plants/${id}`);
export const getStats = () => api.get('/api/plants/stats');
export const uploadPlantPhoto = (formData) => api.upload('/api/plants/upload', formData);
export const identifyPlant = (formData) => api.upload('/api/identify', formData);

// Likes
export const getLikes = (id) => api.get(`/api/plants/${id}/like`);
export const toggleLikeApi = (id) => api.post(`/api/plants/${id}/like`);

// Comments
export const getComments = (id) => api.get(`/api/plants/${id}/comments`);
export const addCommentApi = (id, text) => api.post(`/api/plants/${id}/comments`, { text });
export const deleteCommentApi = (id, commentId) => api.delete(`/api/plants/${id}/comments/${commentId}`);

// User
export const getMyProfile = () => api.get('/api/user/profile');
export const updateProfile = (d) => api.post('/api/user/profile', d);
export const getMyPlants = () => api.get('/api/user/my-plants');
export const getLikedPlants = () => api.get('/api/user/liked-plants');
export const getPublicProfile = (username) => api.get(`/api/users/${username}/profile`);
export const getPublicPlants = (username) => api.get(`/api/users/${username}/plants`);
