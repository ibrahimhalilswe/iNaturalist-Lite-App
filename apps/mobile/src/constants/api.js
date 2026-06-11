export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-api.vercel.app';

export const ENDPOINTS = {
  plants:         `${API_BASE}/api/plants`,
  upload:         `${API_BASE}/api/plants/upload`,
  stats:          `${API_BASE}/api/plants/stats`,
  identify:       `${API_BASE}/api/identify`,
  publicProfile:  (username) => `${API_BASE}/api/users/${username}/profile`,
  publicPlants:   (username) => `${API_BASE}/api/users/${username}/plants`,
  likes:          (id) => `${API_BASE}/api/plants/${id}/like`,
  like:           (id) => `${API_BASE}/api/plants/${id}/like`,
  comments:       (id) => `${API_BASE}/api/plants/${id}/comments`,
  register:       `${API_BASE}/api/auth/register`,
  login:          `${API_BASE}/api/auth/login`,
  refresh:        `${API_BASE}/api/auth/refresh`,
  forgotPassword: `${API_BASE}/api/auth/forgot-password`,
  resetPassword:  `${API_BASE}/api/auth/reset-password`,
  changePassword: `${API_BASE}/api/auth/change-password`,
  profile:        `${API_BASE}/api/user/profile`,
  updateProfile:  `${API_BASE}/api/user/profile`,
  myPlants:       `${API_BASE}/api/user/my-plants`,
  likedPlants:    `${API_BASE}/api/user/liked-plants`,
  userStats:      `${API_BASE}/api/user/stats`,
};

export const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE + (url.startsWith('/') ? '' : '/') + url;
};

export const DEFAULT_REGION = {
  latitude: 38.6745, longitude: 39.1944,
  latitudeDelta: 0.1, longitudeDelta: 0.1,
};
