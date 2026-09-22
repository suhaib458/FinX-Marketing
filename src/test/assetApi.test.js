import { describe, expect, it, vi } from 'vitest';
import { createAssetApi } from '../services/assetApi';

describe('Asset API client', () => {
  it('uploads an asset with bearer token and multipart form data', async () => {
    const getIdToken = vi.fn().mockResolvedValue('test-token');
    const fakeFile = new File(['content'], 'logo.png', { type: 'image/png' });
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { id: 'asset-1', url: 'https://storage.finx.local/logo.png', type: 'LOGO' },
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      ),
    );

    const api = createAssetApi({ fetchImpl });
    const result = await api.uploadAsset({ getIdToken }, { file: fakeFile, type: 'LOGO' });

    expect(result).toEqual({ id: 'asset-1', url: 'https://storage.finx.local/logo.png', type: 'LOGO' });
    expect(getIdToken).toHaveBeenCalledWith(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toContain('/assets/upload');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(options.body).toBeInstanceOf(FormData);
  });

  it('retries upload once on 401 with forced token refresh', async () => {
    const getIdToken = vi.fn()
      .mockResolvedValueOnce('old-token')
      .mockResolvedValueOnce('refreshed-token');
    const fakeFile = new File(['content'], 'logo.png', { type: 'image/png' });
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'INVALID_AUTH_TOKEN' } }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { id: 'asset-1', url: 'https://storage.finx.local/logo.png' },
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      );

    const api = createAssetApi({ fetchImpl });
    const result = await api.uploadAsset({ getIdToken }, { file: fakeFile, type: 'LOGO' });

    expect(result.id).toBe('asset-1');
    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('deletes an asset and handles 204 No Content', async () => {
    const getIdToken = vi.fn().mockResolvedValue('token');
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const api = createAssetApi({ fetchImpl });
    const result = await api.deleteAsset({ getIdToken }, 'asset-123');

    expect(result).toBeNull();
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toContain('/assets/asset-123');
    expect(options.method).toBe('DELETE');
  });

  it('throws ApiError on failed API request', async () => {
    const getIdToken = vi.fn().mockResolvedValue('token');
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'FILE_TOO_LARGE', message: 'File is too large' },
        }),
        { status: 413, headers: { 'content-type': 'application/json' } },
      ),
    );

    const api = createAssetApi({ fetchImpl });
    await expect(
      api.uploadAsset({ getIdToken }, { file: new File([''], 'big.png'), type: 'LOGO' }),
    ).rejects.toMatchObject({
      status: 413,
      code: 'FILE_TOO_LARGE',
      message: 'File is too large',
    });
  });
});
