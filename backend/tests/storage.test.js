import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalDiskStorageProvider } from '../src/infrastructure/storage.js';

const tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('LocalDiskStorageProvider', () => {
  it('writes, resolves, and deletes development assets safely', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finx-storage-'));
    tempDirs.push(rootDir);

    const provider = new LocalDiskStorageProvider({ rootDir });
    const storageKey = 'users/user-a/assets/product_image/example.png';
    const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]);

    const uploaded = await provider.upload({
      storageKey,
      buffer,
      mimeType: 'image/png',
    });

    expect(uploaded).toEqual({
      storageKey,
      publicUrl: '/api/v1/uploads/users/user-a/assets/product_image/example.png',
      bucket: 'local-development',
    });
    await expect(fs.readFile(path.join(rootDir, storageKey))).resolves.toEqual(buffer);
    await expect(provider.getAccessUrl({ storageKey })).resolves.toBe(uploaded.publicUrl);

    await expect(provider.delete({ storageKey })).resolves.toBe(true);
    await expect(provider.getAccessUrl({ storageKey })).resolves.toBeNull();
  });

  it('rejects path traversal keys', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finx-storage-'));
    tempDirs.push(rootDir);
    const provider = new LocalDiskStorageProvider({ rootDir });

    await expect(provider.upload({
      storageKey: '../escape.txt',
      buffer: Buffer.from('nope'),
      mimeType: 'text/plain',
    })).rejects.toThrow('Invalid local storage key');
  });
});
