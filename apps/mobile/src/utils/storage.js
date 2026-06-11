import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ENDPOINTS } from '../constants/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'activeUser';

async function saveSession(session) {
  const { token, ...profile } = session;
  await SecureStore.setItemAsync(TOKEN_KEY, token || '');
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export const registerUser = async (username, email, password) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(ENDPOINTS.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Kayıt başarısız.');
    const data = JSON.parse(text);
    const session = { username: data.username, email: data.email, badge: data.badge, token: data.token, avatarUrl: data.avatarUrl };
    await saveSession(session);
    return session;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError' || e.message.includes('Network')) throw new Error('Sunucuya bağlanılamadı. Lütfen yerel ağ bağlantınızı (IP) kontrol edin.');
    throw e;
  }
};

export const loginUser = async (username, password) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Giriş başarısız. Kullanıcı adı veya parola hatalı olabilir.');
    const data = JSON.parse(text);
    const session = { username: data.username, email: data.email, badge: data.badge, token: data.token, avatarUrl: data.avatarUrl };
    await saveSession(session);
    return session;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError' || e.message.includes('Network')) throw new Error('Sunucuya bağlanılamadı. Lütfen yerel ağ bağlantınızı (IP) kontrol edin.');
    throw e;
  }
};

export const logoutUser = async () => {
  await clearSession();
};

export const getToken = async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token || null;
};

export const getActiveUser = async () => {
  const [raw, token] = await Promise.all([
    AsyncStorage.getItem(USER_KEY),
    SecureStore.getItemAsync(TOKEN_KEY),
  ]);
  if (!raw || !token) return null;
  const profile = JSON.parse(raw);
  const user = { ...profile, token };

  // Stale-while-revalidate pattern
  refreshUserInBackground(user);
  return user;
};

const refreshUserInBackground = async (user) => {
  try {
    const refreshRes = await fetch(ENDPOINTS.refresh, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (refreshRes.ok) {
      const tokenData = await refreshRes.json();
      await SecureStore.setItemAsync(TOKEN_KEY, tokenData.token);
      user.token = tokenData.token;
    } else if (refreshRes.status === 401) {
      await clearSession();
      return;
    }

    const profileRes = await fetch(ENDPOINTS.profile, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (profileRes.ok) {
      const data = await profileRes.json();
      const { token: _, ...updated } = {
        ...user,
        username: data.username,
        email: data.email,
        badge: data.badge,
        avatarUrl: data.avatarUrl,
        totalObservations: data.totalObservations,
        discoveredSpecies: data.discoveredSpecies,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  } catch (_) {
    // offline, ignore
  }
};
