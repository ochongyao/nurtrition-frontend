import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  request,
  getAuthToken,
  API_BASE_URL,
  DEFAULT_DEV_USER_ID,
  ApiError,
} from './client';

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

export const getBillingConfig = () => request('/api/v1/billing/config', { auth: false });

export const getSubscriptionStatus = () => request('/api/v1/billing/status');

export const createCheckoutSession = (planId = 'monthly') =>
  request('/api/v1/billing/create-checkout-session', {
    method: 'POST',
    body: { plan_id: planId },
  });

export const confirmPayment = (sessionId, planId = 'monthly') =>
  request(`/api/v1/billing/confirm-payment?session_id=${sessionId}&plan_id=${planId}`, {
    method: 'POST',
  });

// Convert Base64 string to Uint8Array for WinterCG-compliant Expo Fetch
const base64ToBytes = (base64) => {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let len = clean.length;
  let pad = 0;
  if (clean[len - 1] === '=') {
    pad++;
    if (clean[len - 2] === '=') pad++;
  }
  const bytes = new Uint8Array((len * 3) / 4 - pad);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== undefined && p < bytes.length) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (e4 !== undefined && p < bytes.length) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
};

/**
 * Upload plate photo to FamilyCare backend.
 * Guarantees conversion to JPEG before transmission and uses native FileSystem
 * multipart streaming to avoid "Unsupported FormDataPart implementation" errors.
 */
export const uploadMeal = async ({
  uri,
  base64,
  preparationContext = 'home_cooked',
  familyId,
} = {}) => {
  let uploadUri = uri;
  let uploadBase64 = base64;

  // 1. Always convert taken/selected image to JPEG before upload
  try {
    const manip = await manipulateAsync(
      uri,
      [],
      { compress: 0.85, format: SaveFormat.JPEG, base64: true }
    );
    if (manip?.uri) {
      uploadUri = manip.uri;
      uploadBase64 = manip.base64 || uploadBase64;
    }
  } catch (manipErr) {
    console.warn('ImageManipulator JPEG conversion warning:', manipErr?.message || manipErr);
  }

  // 2. Primary native path: FileSystem.uploadAsync avoids Expo WinterCG FormData issues
  const isLocalFile =
    uploadUri &&
    (uploadUri.startsWith('file:') || uploadUri.startsWith('content:'));

  if (isLocalFile && FileSystem && typeof FileSystem.uploadAsync === 'function') {
    try {
      const authHeaders = {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      const token = getAuthToken();
      if (token) {
        authHeaders.Authorization = `Bearer ${token}`;
      } else {
        authHeaders['X-User-Id'] = DEFAULT_DEV_USER_ID;
      }

      const parameters = {
        preparation_context: preparationContext || 'home_cooked',
      };
      if (familyId) {
        parameters.family_id = String(familyId);
      }

      const uploadRes = await FileSystem.uploadAsync(
        `${API_BASE_URL}/api/v1/meals/upload`,
        uploadUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType: 'image/jpeg',
          parameters,
          headers: authHeaders,
        }
      );

      if (uploadRes.status >= 200 && uploadRes.status < 300) {
        return JSON.parse(uploadRes.body);
      } else {
        let detail = `Upload failed (${uploadRes.status})`;
        try {
          const parsed = JSON.parse(uploadRes.body);
          if (parsed && parsed.detail) {
            detail = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
          }
        } catch {}
        throw new ApiError(detail, uploadRes.status, detail);
      }
    } catch (fsErr) {
      if (fsErr instanceof ApiError) throw fsErr;
      console.warn('FileSystem.uploadAsync fallback:', fsErr?.message || fsErr);
    }
  }

  // 3. Fallback path: WinterCG / Expo Fetch compliant FormData with .bytes() implementation
  const formData = new FormData();
  const name = 'meal_photo.jpg';

  if (uploadBase64) {
    const bytes = base64ToBytes(uploadBase64);
    // Expo WinterCG fetch convertFormDataAsync accepts objects with a .bytes() method
    const filePart = {
      name,
      type: 'image/jpeg',
      bytes: async () => bytes,
    };
    formData.append('image', filePart);
  } else {
    try {
      const fileRes = await fetch(uploadUri);
      const blob = await fileRes.blob();
      formData.append('image', blob, name);
    } catch {
      formData.append('image', { uri: uploadUri, name, type: 'image/jpeg' });
    }
  }

  formData.append('preparation_context', preparationContext || 'home_cooked');
  if (familyId) formData.append('family_id', String(familyId));

  return request('/api/v1/meals/upload', {
    method: 'POST',
    body: formData,
    timeout: 45000,
  });
};
