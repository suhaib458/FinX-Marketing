import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { getOrCreateAdminApp } from './firebase-admin.js';

export class FirebaseStorageProvider {
  constructor({ bucketName, adminApp, logger }) {
    if (!bucketName) {
      throw new Error('Firebase storage bucket name is required');
    }
    this.bucketName = bucketName;
    this.adminApp = adminApp;
    this.logger = logger;
  }

  getBucket() {
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
      // Fallback to media URL format if download URL cannot be obtained directly
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

export class MemoryStorageProvider {
  constructor() {
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
  if (config.firebaseStorageBucket && config.firebaseProjectId) {
    const app = adminApp ?? getOrCreateAdminApp(config);
    return new FirebaseStorageProvider({
      bucketName: config.firebaseStorageBucket,
      adminApp: app,
      logger,
    });
  }

  return new MemoryStorageProvider();
}
