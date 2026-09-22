import { ApiError } from './authApi.js';
import { API_BASE_URL } from './apiConfig.js';

async function parseResponse(response) {
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error?.code || 'API_ERROR',
      body.error?.message || 'Request failed',
      body.error?.details,
    );
  }
  return body.data;
}

export function createAssetApi({ fetchImpl = fetch, timeoutMs = 60_000 } = {}) {
  async function request(path, firebaseUser, { method = 'GET', body, isMultipart = false } = {}) {
    let refreshed = false;
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const headers = { Accept: 'application/json' };
        if (firebaseUser?.getIdToken) {
          const token = await firebaseUser.getIdToken(refreshed);
          headers.Authorization = `Bearer ${token}`;
        }
        if (body && !isMultipart) {
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetchImpl(`${API_BASE_URL}${path}`, {
          method,
          headers,
          body: isMultipart ? body : (body && typeof body === 'object' ? JSON.stringify(body) : body),
          signal: controller.signal,
        });

        if (response.status === 401 && !refreshed && firebaseUser?.getIdToken) {
          refreshed = true;
          continue;
        }

        return await parseResponse(response);
      } catch (error) {
        if (error?.name === 'AbortError') throw new ApiError(408, 'REQUEST_TIMEOUT', 'Request timed out');
        if (error instanceof ApiError) throw error;
        throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the upload service');
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return {
    async uploadAsset(firebaseUser, { file, type, brandId }) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (brandId) formData.append('brandId', brandId);
      return request('/assets/upload', firebaseUser, {
        method: 'POST',
        body: formData,
        isMultipart: true,
      });
    },

    async getAsset(firebaseUser, assetId) {
      return request(`/assets/${assetId}`, firebaseUser);
    },

    async deleteAsset(firebaseUser, assetId) {
      return request(`/assets/${assetId}`, firebaseUser, { method: 'DELETE' });
    },

    async listAssets(firebaseUser, query = {}) {
      const params = new URLSearchParams();
      if (query.page) params.set('page', query.page);
      if (query.limit) params.set('limit', query.limit);
      if (query.type) params.set('type', query.type);
      if (query.brandId) params.set('brandId', query.brandId);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return request(`/assets${queryString}`, firebaseUser);
    },
  };
}

export const assetApi = createAssetApi();
export default assetApi;
