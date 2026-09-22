import { API_BASE_URL } from './apiConfig.js';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.stage = 'session';
  }
}

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new ApiError(response.status, body.error?.code || 'API_ERROR', body.error?.message || 'Request failed');
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.error('[AUTH_ERROR_STAGE=session] Backend responded with error:', {
        status: response.status,
        code: error.code,
        message: error.message,
      });
    }
    throw error;
  }
  return body.data;
}

export function createAuthApi({ fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  async function request(path, firebaseUser, { method = 'GET' } = {}) {
    let refreshed = false;
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const token = await firebaseUser.getIdToken(refreshed);
        const response = await fetchImpl(`${API_BASE_URL}${path}`, {
          method,
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: controller.signal,
        });
        if (response.status === 401 && !refreshed) {
          refreshed = true;
          continue;
        }
        return await parseResponse(response);
      } catch (error) {
        if (error?.name === 'AbortError') throw new ApiError(408, 'REQUEST_TIMEOUT', 'Request timed out');
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.error('[AUTH_ERROR_STAGE=session] Session request failed:', {
            path,
            error: error?.message || error,
            code: error?.code,
            status: error?.status,
          });
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return {
    syncSession(firebaseUser) { return request('/auth/session', firebaseUser, { method: 'POST' }); },
    getMe(firebaseUser) { return request('/me', firebaseUser); },
  };
}

export const authApi = createAuthApi();
export default authApi;
