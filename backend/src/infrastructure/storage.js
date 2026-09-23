import fs from 'node:fs/promises';
import path from 'node:path';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { del as deleteBlob, head as headBlob, put as putBlob } from '@vercel/blob';
import { getOrCreateAdminApp } from './firebase-admin.js';

function safeLocalPath(rootDir, storageKey) {
  const normalizedKey = String(storageKey || '').replace(/\\/g, '/');
  if (!normalizedKey || normalizedKey.startsWith('/') || normalizedKey.split('/').includes('..')) {
    throw new Error('Invalid local storage key');
  }

  const absolute = path.resolve(rootDir, normalizedKey);
  const root = path.resolve(rootDir);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error('Invalid local storage path');
  }
  return absolute;
}

function publicLocalUrl(storageKey) {
  const encoded = String(storageKey)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/api/v1/uploads/${encoded}`;
}

export class VercelBlobStorageProvider {
  constructor({ token, logger }) {
    if (!token) throw new Error('Vercel Blob read-write token is required');
    this.mode = 'vercel';
    this.bucketName = 'vercel-blob';
    this.token = token;
    this.logger = logger;
  }

  async upload({ storageKey, buffer, mimeType }) {
    const blob = await putBlob(storageKey, buffer, {
      access: 'public',
      contentType: mimeType,
      token: this.token,
      addRandomSuffix: false,
      allowOverwrite: false,
    });

    return {
      storageKey: blob.pathname,
      publicUrl: blob.url,
      bucket: this.bucketName,
    };
  }

  async delete({ storageKey }) {
    try {
      await deleteBlob(storageKey, { token: this.token });
      return true;
    } catch (error) {
      this.logger?.warn?.({ err: error, storageKey }, 'Failed to delete file from Vercel Blob');
      return false;
    }
  }

  async getAccessUrl({ storageKey }) {
    try {
      const blob = await headBlob(storageKey, { token: this.token });
      return blob?.url || null;
    } catch {
      return null;
    }
  }
}

export class FirebaseStorageProvider {
  constructor({ bucketName, adminApp, config, logger }) {
    if (!bucketName) {
      throw new Error('Firebase storage bucket name is required');
    }
    this.mode = 'firebase';
    this.bucketName = bucketName;
    this.adminApp = adminApp;
    this.config = config;
    this.logger = logger;
  }

  getBucket() {
    if (!this.adminApp) this.adminApp = getOrCreateAdminApp(this.config);
    return getStorage(this.adminApp).bucket(this.bucketName);
  }

  async upload({ storageKey, buffer, mimeType, metadata = {} }) {
    const bucket = this.getBucket();
    const file = bucket.file(storageKey);

    await file.save(buffer, {
      contentType: mimeType,
      metadata: {
        contentType: mimeType,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        },
      },
      resumable: false,
    });

    let publicUrl;
    try {
      publicUrl = await getDownloadURL(file);
    } catch {
      const encodedPath = encodeURIComponent(storageKey);
      publicUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedPath}?alt=media`;
    }

    return {
      storageKey,
      publicUrl,
      bucket: this.bucketName,
    };
  }

  async delete({ storageKey }) {
    try {
      const bucket = this.getBucket();
      const file = bucket.file(storageKey);
      await file.delete({ ignoreNotFound: true });
      return true;
    } catch (error) {
      this.logger?.warn?.({ err: error, storageKey }, 'Failed to delete file from Firebase Storage');
      return false;
    }
  }

  async getAccessUrl({ storageKey }) {
    const bucket = this.getBucket();
    const file = bucket.file(storageKey);
    try {
      return await getDownloadURL(file);
    } catch {
      const encodedPath = encodeURIComponent(storageKey);
      return `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedPath}?alt=media`;
    }
  }
}

export class LocalDiskStorageProvider {
  constructor({ rootDir, logger }) {
    if (!rootDir) throw new Error('Local upload directory is required');
    this.mode = 'local';
    this.bucketName = 'local-development';
    this.rootDir = path.resolve(rootDir);
    this.logger = logger;
  }

  async upload({ storageKey, buffer }) {
    const destination = safeLocalPath(this.rootDir, storageKey);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, buffer);

    return {
      storageKey,
      publicUrl: publicLocalUrl(storageKey),
      bucket: this.bucketName,
    };
  }

  async delete({ storageKey }) {
    try {
      const destination = safeLocalPath(this.rootDir, storageKey);
      await fs.rm(destination, { force: true });
      return true;
    } catch (error) {
      this.logger?.warn?.({ err: error, storageKey }, 'Failed to delete local development asset');
      return false;
    }
  }

  async getAccessUrl({ storageKey }) {
    try {
      const destination = safeLocalPath(this.rootDir, storageKey);
      await fs.access(destination);
      return publicLocalUrl(storageKey);
    } catch {
      return null;
    }
  }
}

export class MemoryStorageProvider {
  constructor() {
    this.mode = 'memory';
    this.bucketName = 'memory-bucket';
    this.files = new Map();
  }

  async upload({ storageKey, buffer, mimeType, metadata = {} }) {
    this.files.set(storageKey, {
      buffer,
      mimeType,
      metadata,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
    });

    return {
      storageKey,
      publicUrl: `https://storage.finx.local/${this.bucketName}/${storageKey}`,
      bucket: this.bucketName,
    };
  }

  async delete({ storageKey }) {
    const existed = this.files.has(storageKey);
    this.files.delete(storageKey);
    return existed;
  }

  async getAccessUrl({ storageKey }) {
    if (!this.files.has(storageKey)) return null;
    return `https://storage.finx.local/${this.bucketName}/${storageKey}`;
  }

  hasFile(storageKey) {
    return this.files.has(storageKey);
  }

  getFile(storageKey) {
    return this.files.get(storageKey) ?? null;
  }

  clear() {
    this.files.clear();
  }
}

export function createStorageProvider({ config, adminApp, logger }) {
  const storageMode = config.storageMode || 'auto';

  if (storageMode === 'local' || (storageMode === 'auto' && !config.isProduction)) {
    return new LocalDiskStorageProvider({
      rootDir: config.localUploadDir,
      logger,
    });
  }

  // When a Vercel Blob store is connected to the production project, prefer it
  // automatically. This keeps uploads on the same platform as the app and avoids
  // Firebase Storage billing/bucket requirements.
  if (
    storageMode === 'vercel'
    || (config.isProduction && config.blobReadWriteToken)
  ) {
    return new VercelBlobStorageProvider({
      token: config.blobReadWriteToken,
      logger,
    });
  }

  if (storageMode === 'firebase' || config.isProduction) {
    if (!config.firebaseStorageBucket || !config.firebaseProjectId) {
      throw new Error('Firebase storage is not configured');
    }
    return new FirebaseStorageProvider({
      bucketName: config.firebaseStorageBucket,
      adminApp,
      config,
      logger,
    });
  }

  return new MemoryStorageProvider();
}