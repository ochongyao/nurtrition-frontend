import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const DEFAULT_BASE_URL = 'https://wheatless-jermaine-aftmost.ngrok-free.dev';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;



const REQUEST_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 30000;

export const CARE_REACTIONS = {
  acknowledge: '❤️',
  nurture: '🍵',
};

export const PLANT_COLORS = {
  green: { label: 'Leafy green', hex: '#4F7059' },
  orange: { label: 'Orange', hex: '#C08A3E' },
  red: { label: 'Red', hex: '#B25A3E' },
  purple: { label: 'Purple', hex: '#7A6A8A' },
  yellow_white: { label: 'Yellow / white', hex: '#B8A15E' },
};

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

let accessToken = null;
let userId = null;

export const setAuth = ({ token, id } = {}) => {
  if (token !== undefined) accessToken = token;
  if (id !== undefined) userId = id;
};

export const clearAuth = () => {
  accessToken = null;
  userId = null;
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const buildHeaders = (isForm) => {
  const headers = { Accept: 'application/json' };
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  else if (userId) headers['X-User-Id'] = userId;
  return headers;
};

async function request(path, { method = 'GET', body, isForm = false, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(isForm),
      body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    const data = parseJson(text);
    if (!response.ok) {
      const detail = (data && data.detail) || response.statusText || 'Request failed';
      throw new ApiError(`API ${response.status}: ${detail}`, response.status, detail);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, 'timeout');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// --- Auth ------------------------------------------------------------------

export const register = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload });

export const login = (payload) => request('/api/v1/auth/login', { method: 'POST', body: payload });

export const getMe = () => request('/api/v1/users/me');

// --- Meals -----------------------------------------------------------------

export const uploadMeal = async ({
  uri,
  base64,
  fileName = 'meal_photo.jpg',
  preparationContext = 'home_cooked',
  familyId,
}) => {
  let uploadUri = uri;
  let uploadBase64 = base64;

  // 1. Always convert to JPEG before uploading
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
    console.warn('ImageManipulator JPEG warning:', manipErr?.message || manipErr);
  }

  // 2. Native FileSystem multipart upload for local files
  const isLocalFile =
    uploadUri &&
    (uploadUri.startsWith('file:') || uploadUri.startsWith('content:'));

  if (isLocalFile && FileSystem && typeof FileSystem.uploadAsync === 'function') {
    try {
      const headers = buildHeaders(true);
      headers['ngrok-skip-browser-warning'] = 'true';
      const parameters = {
        preparation_context: preparationContext || 'home_cooked',
      };
      if (familyId) parameters.family_id = String(familyId);

      const res = await FileSystem.uploadAsync(
        `${API_BASE_URL}/api/v1/meals/upload`,
        uploadUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType: 'image/jpeg',
          parameters,
          headers,
        }
      );

      if (res.status >= 200 && res.status < 300) {
        return JSON.parse(res.body);
      } else {
        let detail = `Upload failed (${res.status})`;
        try {
          const parsed = JSON.parse(res.body);
          if (parsed && parsed.detail) detail = parsed.detail;
        } catch {}
        throw new ApiError(detail, res.status, detail);
      }
    } catch (fsErr) {
      if (fsErr instanceof ApiError) throw fsErr;
      console.warn('FileSystem.uploadAsync fallback:', fsErr?.message || fsErr);
    }
  }

  // 3. WinterCG-compliant fetch fallback
  const form = new FormData();
  if (uploadBase64) {
    const clean = uploadBase64.includes(',') ? uploadBase64.split(',')[1] : uploadBase64;
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    form.append('image', {
      name: fileName,
      type: 'image/jpeg',
      bytes: async () => bytes,
    });
  } else {
    try {
      const fileRes = await fetch(uploadUri);
      const blob = await fileRes.blob();
      form.append('image', blob, fileName);
    } catch {
      form.append('image', { uri: uploadUri, name: fileName, type: 'image/jpeg' });
    }
  }

  form.append('preparation_context', preparationContext);
  if (familyId) form.append('family_id', familyId);
  return request('/api/v1/meals/upload', {
    method: 'POST',
    body: form,
    isForm: true,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
};


export const getMeal = (mealId) => request(`/api/v1/meals/${mealId}`);

export const reactToMeal = (mealId, emoji) =>
  request(`/api/v1/meals/${mealId}/react`, { method: 'POST', body: { emoji } });

// --- Families --------------------------------------------------------------

export const createFamily = (name) =>
  request('/api/v1/families/create', { method: 'POST', body: { name } });

export const joinFamily = (inviteCode) =>
  request('/api/v1/families/join', { method: 'POST', body: { invite_code: inviteCode } });

export const getFamilyFeed = (familyId, { limit = 20, offset = 0 } = {}) =>
  request(`/api/v1/families/${familyId}/feed?limit=${limit}&offset=${offset}`);

export const getWeeklyDigest = (familyId, { forceRefresh = false } = {}) =>
  request(`/api/v1/families/${familyId}/weekly?force_refresh=${forceRefresh}`);

// --- Adapters: API payloads -> the view model the screens render -----------

const pad = (n) => String(n).padStart(2, '0');

export const formatLocalTime = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const relativeTime = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return 'Just now';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

const countReactions = (list = []) => ({
  acknowledge: list.filter((e) => e === CARE_REACTIONS.acknowledge).length,
  nurture: list.filter((e) => e === CARE_REACTIONS.nurture).length,
});

export const adaptFeedItem = (item) => ({
  id: item.meal_id,
  apiMealId: item.meal_id,
  isApi: true,
  authorName: item.user_name,
  authorRole: item.user_role,
  authorLocation: null,
  authorEmoji: null,
  image: item.image_url || null,
  placeholderEmoji: '🍽️',
  localTime: formatLocalTime(item.created_at),
  postedLabel: relativeTime(item.created_at),
  dishName: item.meal_name,
  healthScore: item.normalized_score,
  feedback: item.reassurance_note,
  plantColors: item.plant_colors || [],
  reactions: countReactions(item.reactions || []),
});

export const adaptMealDetail = (meal, fallbackImage) => ({
  id: meal.id,
  apiMealId: meal.id,
  isApi: true,
  authorName: 'You',
  authorRole: meal.user_role || 'member',
  authorLocation: null,
  authorEmoji: null,
  image: meal.image_url || fallbackImage || null,
  placeholderEmoji: '🍽️',
  localTime: formatLocalTime(meal.created_at),
  postedLabel: 'Just now',
  dishName: meal.meal_name,
  healthScore: meal.normalized_score,
  feedback: meal.reassurance_note,
  plantColors: meal.plant_colors || [],
  reactions: countReactions(meal.reactions || []),
});

export const adaptUploadResult = (result, fallbackImage) => ({
  id: result.meal_id,
  apiMealId: result.meal_id,
  isApi: true,
  authorName: 'You',
  authorRole: 'member',
  authorLocation: null,
  authorEmoji: null,
  image: result.image_url || fallbackImage || null,
  placeholderEmoji: '🍽️',
  localTime: formatLocalTime(result.created_at),
  postedLabel: 'Just now',
  dishName: result.meal_name,
  healthScore: result.normalized_score,
  feedback: result.reassurance_note,
  plantColors: result.plant_colors || [],
  reactions: { acknowledge: 0, nurture: 0 },
});
