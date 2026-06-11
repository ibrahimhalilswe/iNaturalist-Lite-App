import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadPhoto, savePlant } from '../api/plantsApi';
import { getActiveUser } from './storage';

const QUEUE_KEY = 'offline_observation_queue';

export const enqueueObservation = async ({ imageUri, name, description, lat, lng }) => {
  try {
    const existing = await getQueue();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      imageUri,
      name,
      description,
      lat,
      lng,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, entry]));
    return entry.id;
  } catch (e) {
    console.error('enqueueObservation error:', e);
    throw e;
  }
};

export const getQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getQueueCount = async () => {
  const q = await getQueue();
  return q.length;
};

const removeFromQueue = async (id) => {
  const existing = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing.filter((e) => e.id !== id)));
};

export const flushQueue = async () => {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  const user = await getActiveUser();
  let flushed = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const photoUrl = await uploadPhoto(entry.imageUri);
      await savePlant({
        name: entry.name,
        description: entry.description,
        lat: entry.lat ?? 38.6745,
        lng: entry.lng ?? 39.1944,
        photoUrl,
        userName: user?.username || 'Anonim',
        userBadge: user?.badge || '🌱',
      });
      await removeFromQueue(entry.id);
      flushed++;
    } catch {
      failed++;
    }
  }

  return { flushed, failed };
};
