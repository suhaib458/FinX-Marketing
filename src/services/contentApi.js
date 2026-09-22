import { authenticatedRequest } from './authenticatedApi.js';

const TOOL_SLUGS = { SOCIAL_POST: 'social-post', AD_DESIGN: 'ad-design', CONTENT_IDEAS: 'content-ideas', CAMPAIGN: 'campaign' };

export function normalizeContentRecord(record) {
  if (!record) return null;
  return {
    ...record,
    type: TOOL_SLUGS[record.tool] || record.type,
    contentLanguage: record.language || record.contentLanguage,
    parameters: record.submittedParameters || record.parameters || {},
    tone: record.submittedParameters?.tone || record.tone || 'professional',
    saved: Boolean(record.savedAt),
  };
}

export const contentApi = {
  async list(firebaseUser, query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value !== undefined && value !== null && params.set(key, String(value)));
    const payload = await authenticatedRequest(firebaseUser, `/contents${params.size ? `?${params}` : ''}`);
    return { ...payload, data: (payload.data || []).map(normalizeContentRecord) };
  },
  async get(firebaseUser, id) {
    const payload = await authenticatedRequest(firebaseUser, `/contents/${id}`);
    return normalizeContentRecord(payload.data);
  },
  async update(firebaseUser, id, data) {
    const payload = await authenticatedRequest(firebaseUser, `/contents/${id}`, { method: 'PATCH', body: data });
    return normalizeContentRecord(payload.data);
  },
  async setSaved(firebaseUser, id, saved) {
    return this.update(firebaseUser, id, { saved });
  },
  async remove(firebaseUser, id) {
    return authenticatedRequest(firebaseUser, `/contents/${id}`, { method: 'DELETE' });
  },
  async variation(firebaseUser, id, options, idempotencyKey = crypto.randomUUID()) {
    const payload = await authenticatedRequest(firebaseUser, `/contents/${id}/variations`, {
      method: 'POST',
      body: { options, idempotencyKey },
      timeoutMs: 75_000,
    });
    return payload.data;
  },
};
export default contentApi;
