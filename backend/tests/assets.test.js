import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ASSET_A,
  auth,
  BRAND_A,
  BRAND_B,
  buildTestApp,
  USER_A,
  USER_B,
} from './helpers/test-app.js';

// Valid image buffers for testing magic byte validation
const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
const validWebpBuffer = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('VP8 '),
]);
const validSvgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect /></svg>');

describe('Asset Management and Uploads', () => {
  it('requires authentication to upload assets', async () => {
    const { app } = buildTestApp();
    const response = await request(app)
      .post('/api/v1/assets/upload')
      .field('type', 'LOGO')
      .attach('file', validPngBuffer, 'logo.png');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('uploads a valid PNG image successfully', async () => {
    const { app, storageProvider } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .field('brandId', BRAND_A)
      .attach('file', validPngBuffer, 'logo.png');

    expect(response.status).toBe(201);
    const { data } = response.body;
    expect(data.id).toBeDefined();
    expect(data.userId).toBe(USER_A);
    expect(data.brandId).toBe(BRAND_A);
    expect(data.type).toBe('LOGO');
    expect(data.status).toBe('READY');
    expect(data.mimeType).toBe('image/png');
    expect(typeof data.size).toBe('number');
    expect(data.url).toContain('https://storage.finx.local');
    expect(data.storageKey).toMatch(/^users\/[^/]+\/brands\/[^/]+\/logo\/[^/]+\.png$/);
    expect(storageProvider.hasFile(data.storageKey)).toBe(true);
  });

  it('uploads valid JPEG, WebP, and SVG images', async () => {
    const { app } = buildTestApp();

    const jpegRes = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'PRODUCT_IMAGE')
      .field('brandId', BRAND_A)
      .attach('file', validJpegBuffer, 'product.jpg');
    expect(jpegRes.status).toBe(201);
    expect(jpegRes.body.data.mimeType).toBe('image/jpeg');

    const webpRes = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'PRODUCT_IMAGE')
      .attach('file', validWebpBuffer, 'product.webp');
    expect(webpRes.status).toBe(201);
    expect(webpRes.body.data.mimeType).toBe('image/webp');

    const svgRes = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .attach('file', validSvgBuffer, 'vector.svg');
    expect(svgRes.status).toBe(201);
    expect(svgRes.body.data.mimeType).toBe('image/svg+xml');
  });

  it('rejects request with missing file', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MISSING_FILE');
  });

  it('rejects unsupported file types', async () => {
    const { app } = buildTestApp();
    const textBuffer = Buffer.from('console.log("malicious");');
    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .attach('file', textBuffer, { filename: 'script.js', contentType: 'application/javascript' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('rejects spoofed files whose content does not match declared MIME type', async () => {
    const { app } = buildTestApp();
    const fakePng = Buffer.from('NOT A REAL PNG HEADER AT ALL');
    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .attach('file', fakePng, { filename: 'fake.png', contentType: 'image/png' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('CORRUPTED_OR_INVALID_FILE');
  });

  it('rejects mismatched file extensions', async () => {
    const { app } = buildTestApp();
    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .attach('file', validPngBuffer, { filename: 'image.jpg', contentType: 'image/png' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_FILE_EXTENSION');
  });

  it('rejects files larger than the configured maximum size', async () => {
    // Config with 1 MB limit for test
    const { app } = buildTestApp({
      config: { maxUploadSizeMb: 1, maxUploadSizeBytes: 1024 * 1024 },
    });

    // 1.5 MB fake PNG
    const oversizedBuffer = Buffer.concat([validPngBuffer, Buffer.alloc(1.5 * 1024 * 1024)]);
    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .attach('file', oversizedBuffer, 'oversized.png');

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('prevents user from uploading assets to another user’s brand', async () => {
    const { app } = buildTestApp();
    // User A trying to attach asset to User B's brand
    const response = await auth(request(app).post('/api/v1/assets/upload'), USER_A)
      .field('type', 'LOGO')
      .field('brandId', BRAND_B)
      .attach('file', validPngBuffer, 'logo.png');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('cleans up uploaded file from storage if database creation fails', async () => {
    const { app, storageProvider, repositories } = buildTestApp();
    // Intentionally make repository create throw
    repositories.assets.create = async () => {
      throw new Error('Simulated database connection failure');
    };

    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'PRODUCT_IMAGE')
      .attach('file', validPngBuffer, 'product.png');

    expect(response.status).toBe(500);
    // Ensure no orphaned files remain in storage provider
    expect(storageProvider.files.size).toBe(0);
  });

  it('cleans up old logo when replacing a brand logo', async () => {
    const { app, storageProvider } = buildTestApp();
    // ASSET_A is the initial logo for BRAND_A in USER_A's account
    const oldKey = `users/${USER_A}/brands/${BRAND_A}/logo/initial.png`;
    await storageProvider.upload({ storageKey: oldKey, buffer: validPngBuffer, mimeType: 'image/png' });
    expect(storageProvider.hasFile(oldKey)).toBe(true);

    const response = await auth(request(app).post('/api/v1/assets/upload'))
      .field('type', 'LOGO')
      .field('brandId', BRAND_A)
      .attach('file', validPngBuffer, 'new-logo.png');

    expect(response.status).toBe(201);
    expect(storageProvider.hasFile(oldKey)).toBe(false);
    expect(storageProvider.hasFile(response.body.data.storageKey)).toBe(true);
  });

  it('retrieves an asset by ID and protects cross-user access', async () => {
    const { app } = buildTestApp();

    const getRes = await auth(request(app).get(`/api/v1/assets/${ASSET_A}`), USER_A);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(ASSET_A);
    expect(getRes.body.data.type).toBe('LOGO');

    // Cross-user read attempt by User B
    const otherRes = await auth(request(app).get(`/api/v1/assets/${ASSET_A}`), USER_B);
    expect(otherRes.status).toBe(404);
  });

  it('lists assets with pagination and filters', async () => {
    const { app } = buildTestApp();

    const listRes = await auth(request(app).get('/api/v1/assets?page=1&limit=10'), USER_A);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.pagination).toBeDefined();

    const filteredRes = await auth(request(app).get('/api/v1/assets?type=LOGO'), USER_A);
    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.data.every((a) => a.type === 'LOGO')).toBe(true);
  });

  it('deletes an asset and removes it from storage', async () => {
    const { app, storageProvider } = buildTestApp();
    const key = `users/${USER_A}/brands/${BRAND_A}/logo/initial.png`;
    await storageProvider.upload({ storageKey: key, buffer: validPngBuffer, mimeType: 'image/png' });

    const deleteRes = await auth(request(app).delete(`/api/v1/assets/${ASSET_A}`), USER_A);
    expect(deleteRes.status).toBe(204);
    expect(storageProvider.hasFile(key)).toBe(false);

    // Verify it is now 404
    const getAgain = await auth(request(app).get(`/api/v1/assets/${ASSET_A}`), USER_A);
    expect(getAgain.status).toBe(404);
  });
});
