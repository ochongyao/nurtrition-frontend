import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TOKEN: '@fambite_token_v1',
  USER: '@fambite_user_v1',
  FAMILY: '@fambite_family_v1',
  PROFILE: '@fambite_profile_v1',
};

// In-memory fallback in case AsyncStorage encounters an error on certain platforms
const memoryStore = new Map();

async function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    memoryStore.set(key, serialized);
  } catch {
    memoryStore.set(key, JSON.stringify(value));
  }
}

async function getItem(key) {
  try {
    const val = await AsyncStorage.getItem(key);
    if (val !== null && val !== undefined) return JSON.parse(val);
    const memVal = memoryStore.get(key);
    return memVal ? JSON.parse(memVal) : null;
  } catch {
    const memVal = memoryStore.get(key);
    return memVal ? JSON.parse(memVal) : null;
  }
}

async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore error
  }
  memoryStore.delete(key);
}

export const getStoredToken = () => getItem(STORAGE_KEYS.TOKEN);
export const setStoredToken = (token) => setItem(STORAGE_KEYS.TOKEN, token);
export const removeStoredToken = () => removeItem(STORAGE_KEYS.TOKEN);

export const getStoredUser = () => getItem(STORAGE_KEYS.USER);
export const setStoredUser = (user) => setItem(STORAGE_KEYS.USER, user);
export const removeStoredUser = () => removeItem(STORAGE_KEYS.USER);

export const getStoredFamily = () => getItem(STORAGE_KEYS.FAMILY);
export const setStoredFamily = (family) => setItem(STORAGE_KEYS.FAMILY, family);
export const removeStoredFamily = () => removeItem(STORAGE_KEYS.FAMILY);

export const getStoredProfile = () => getItem(STORAGE_KEYS.PROFILE);
export const setStoredProfile = (profile) => setItem(STORAGE_KEYS.PROFILE, profile);

export async function clearStoredSession() {
  await Promise.all([
    removeStoredToken(),
    removeStoredUser(),
    removeStoredFamily(),
  ]);
}
