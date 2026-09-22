import { authenticatedRequest } from './authenticatedApi.js';

export const brandApi = {
  async list(firebaseUser) {
    const payload = await authenticatedRequest(firebaseUser, '/brands?page=1&limit=20');
    return payload.data || [];
  },
  async get(firebaseUser, id) {
    const payload = await authenticatedRequest(firebaseUser, `/brands/${id}`);
    return payload.data;
  },
  async create(firebaseUser, data) {
    const payload = await authenticatedRequest(firebaseUser, '/brands', { method: 'POST', body: data });
    return payload.data;
  },
  async update(firebaseUser, id, data) {
    const payload = await authenticatedRequest(firebaseUser, `/brands/${id}`, { method: 'PATCH', body: data });
    return payload.data;
  },
  async remove(firebaseUser, id) {
    return authenticatedRequest(firebaseUser, `/brands/${id}`, { method: 'DELETE' });
  },
};
export default brandApi;
