// Production storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is available.
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
