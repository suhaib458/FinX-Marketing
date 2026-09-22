import path from 'node:path';
import multer from 'multer';
import { AppError } from '../common/errors.js';

export const ALLOWED_MIME_TYPES = Object.freeze({
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
});

export function verifyMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  switch (mimeType) {
    case 'image/png':
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    case 'image/jpeg':
      return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    case 'image/gif': {
      const header = buffer.subarray(0, 4).toString('ascii');
      return header === 'GIF8';
    }
    case 'image/webp': {
      if (buffer.length < 12) return false;
      const riff = buffer.subarray(0, 4).toString('ascii');
      const webp = buffer.subarray(8, 12).toString('ascii');
      return riff === 'RIFF' && webp === 'WEBP';
    }
    case 'image/svg+xml': {
      const text = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf8').trim().toLowerCase();
      return text.includes('<svg') || text.includes('<?xml');
    }
    default:
      return false;
  }
}

export function validateUploadedFile(file, maxUploadSizeBytes, maxUploadSizeMb) {
  if (!file || !file.buffer) {
    throw new AppError(400, 'MISSING_FILE', 'A file is required for upload');
  }

  if (file.size > maxUploadSizeBytes) {
    throw new AppError(413, 'FILE_TOO_LARGE', `File exceeds maximum allowed size of ${maxUploadSizeMb} MB`);
  }

  const allowedExtensions = ALLOWED_MIME_TYPES[file.mimetype];
  if (!allowedExtensions) {
    throw new AppError(
      422,
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file type '${file.mimetype}'. Supported types: JPEG, PNG, WebP, GIF, SVG`,
    );
  }

  const extension = path.extname(file.originalname || '').toLowerCase();
  if (extension && !allowedExtensions.includes(extension)) {
    throw new AppError(
      422,
      'INVALID_FILE_EXTENSION',
      `File extension '${extension}' does not match MIME type '${file.mimetype}'`,
    );
  }

  const isValidContent = verifyMagicBytes(file.buffer, file.mimetype);
  if (!isValidContent) {
    throw new AppError(
      422,
      'CORRUPTED_OR_INVALID_FILE',
      'File content does not match its declared MIME type',
    );
  }
}

export function createUploadMiddleware(config) {
  const maxBytes = config.maxUploadSizeBytes || (config.maxUploadSizeMb || 25) * 1024 * 1024;
  const maxMb = config.maxUploadSizeMb || 25;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
    },
  }).single('file');

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError(413, 'FILE_TOO_LARGE', `File exceeds maximum allowed size of ${maxMb} MB`));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError(400, 'UNEXPECTED_FIELD', `Unexpected field '${err.field}'. Expected 'file'`));
          }
          return next(new AppError(400, 'UPLOAD_ERROR', err.message));
        }
        return next(err);
      }

      next();
    });
  };
}
