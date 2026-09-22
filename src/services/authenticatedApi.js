import { API_BASE_URL } from './apiConfig.js';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function authenticatedRequest(firebaseUser, path, {
  method = 'GET',
  body,
  headers = {},
  timeoutMs = 30_000,
  fetchImpl = fetch,
} = {}) {
  if (!firebaseUser) throw new ApiError(401, 'AUTH_REQUIRED', 'Authentication is required');
  let refreshed = false;
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const token = await firebaseUser.getIdToken(refreshed);
      const response = await fetchImpl(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (response.status === 401 && !refreshed) {
        refreshed = true;
        continue;
      }
      if (response.status === 204) return null;
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new ApiError(
          response.status,
          payload.error?.code || 'API_REQUEST_FAILED',
          payload.error?.message || `Request failed with status ${response.status}`,
          payload.error?.details,
        );
      }
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') throw new ApiError(408, 'REQUEST_TIMEOUT', 'The request timed out');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
