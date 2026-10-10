import { Platform } from 'react-native';
import { request } from './client';

export const register = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload, auth: false });

export const login = (email, password) =>
  request('/api/v1/auth/login', { method: 'POST', body: { email, password }, auth: false });

export const getMe = () => request('/api/v1/users/me');

export const createFamily = (name) =>
  request('/api/v1/families/create', { method: 'POST', body: { name } });

export const joinFamily = (inviteCode) =>
  request('/api/v1/families/join', { method: 'POST', body: { invite_code: inviteCode } });

export const getFamilyFeed = (familyId, { limit = 20, offset = 0 } = {}) =>
  request(`/api/v1/families/${familyId}/feed?limit=${limit}&offset=${offset}`);

export const getWeeklyDigest = (familyId, forceRefresh = false) =>
  request(`/api/v1/families/${familyId}/weekly?force_refresh=${forceRefresh}`);

export const getMeal = (mealId) => request(`/api/v1/meals/${mealId}`);

export const editMeal = (mealId, payload) =>
  request(`/api/v1/meals/${mealId}`, { method: 'PATCH', body: payload });

export const reactToMeal = (mealId, emoji) =>
  request(`/api/v1/meals/${mealId}/react`, { method: 'POST', body: { emoji } });

export const uploadMeal = async ({ uri, preparationContext = 'home_cooked', familyId } = {}) => {
  const formData = new FormData();
  const name = (uri && uri.split('/').pop()) || 'meal_photo.jpg';

  try {
    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();
    formData.append('image', blob, name);
  } catch {
    // Legacy fallback
    formData.append('image', { uri, name, type: 'image/jpeg' });
  }

  formData.append('preparation_context', preparationContext);
  if (familyId) formData.append('family_id', familyId);
  return request('/api/v1/meals/upload', { method: 'POST', body: formData, timeout: 45000 });
};

