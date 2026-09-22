import { authenticatedRequest } from './authenticatedApi.js';

export const creditsApi = {
  async getBalance(firebaseUser) {
    const payload = await authenticatedRequest(firebaseUser, '/credits');
    return payload.data;
  },
  async getLedger(firebaseUser, query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value !== undefined && value !== null && params.set(key, String(value)));
    const payload = await authenticatedRequest(firebaseUser, `/credits/ledger${params.size ? `?${params}` : ''}`);
    return payload;
  },
};
export default creditsApi;
