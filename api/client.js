export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://wheatless-jermaine-aftmost.ngrok-free.dev';


// Fallback user ID for development/offline testing if no JWT access token is active
export const DEFAULT_DEV_USER_ID = 'dfece1b2-0200-4d68-8485-36f28c52d3f6';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const getAuthToken = () => authToken;

export class ApiError extends Error {
  constructor(message, status = 0, detail = message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const BASE_HEADERS = {
  Accept: 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

const readError = async (response) => {
  let detail = `Request failed (${response.status})`;
  try {
    const data = await response.json();
    if (data && data.detail) {
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // Non-JSON error body: keep status-based message
  }
  return new ApiError(detail, response.status, detail);
};

export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = 20000,
    auth = true,
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const payload = isFormData ? body : body ? JSON.stringify(body) : undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Authenticate using Bearer token or development fallback X-User-Id
  const authHeaders = {};
  if (auth) {
    if (authToken) {
      authHeaders.Authorization = `Bearer ${authToken}`;
    } else {
      authHeaders['X-User-Id'] = DEFAULT_DEV_USER_ID;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...BASE_HEADERS,
        ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...headers,
      },
      body: payload,
    });

    if (!response.ok) throw await readError(response);
    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('The kitchen is taking too long to respond.', 0, 'timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
