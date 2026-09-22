import { describe, expect, it, vi } from 'vitest';
import { createAuthApi } from '../services/authApi';

describe('authenticated API client', () => {
  it('retries one 401 with a forced token refresh and never loops', async () => {
    const getIdToken = vi.fn()
      .mockResolvedValueOnce('first-token')
      .mockResolvedValueOnce('refreshed-token');
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'INVALID_AUTH_TOKEN' } }), {
        status: 401, headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { user: { id: 'mysql-user' } } }), {
        status: 200, headers: { 'content-type': 'application/json' },
      }));
    const api = createAuthApi({ fetchImpl });

    await expect(api.syncSession({ getIdToken })).resolves.toEqual({ user: { id: 'mysql-user' } });
    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(localStorage.length).toBe(0);
  });

  it('stops after the single forced-refresh retry', async () => {
    const firebaseUser = { getIdToken: vi.fn().mockResolvedValue('token') };
    const unauthorized = () => Promise.resolve(new Response(JSON.stringify({ error: { code: 'NO' } }), { status: 401 }));
    const fetchImpl = vi.fn(unauthorized);
    const api = createAuthApi({ fetchImpl });
    await expect(api.getMe(firebaseUser)).rejects.toMatchObject({ status: 401 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
