import crypto from 'node:crypto';
import path from 'node:path';
import { notFound } from '../common/errors.js';
import { paginationMeta } from '../common/pagination.js';
import { ALLOWED_MIME_TYPES, validateUploadedFile } from '../middleware/upload.js';

function publicAsset(asset) {
  return {
    id: asset.id,
    userId: asset.userId,
    brandId: asset.brandId || null,
    type: asset.type,
    status: asset.status,
    storageKey: asset.storageKey,
    url: asset.publicUrl || null,
    mimeType: asset.mimeType,
    size: Number(asset.byteSize),
    width: asset.width || null,
    height: asset.height || null,
    originalName: asset.metadata?.originalName || null,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

function generateStorageKey({ userId, brandId, type, originalName, mimeType }) {
  const uniqueId = crypto.randomUUID();
  const rawExt = path.extname(originalName || '').toLowerCase();
  const allowedExts = ALLOWED_MIME_TYPES[mimeType] || ['.bin'];
  const ext = allowedExts.includes(rawExt) ? rawExt : allowedExts[0];
  const safeFileName = `${uniqueId}${ext}`;

  if (brandId) {
    if (type === 'LOGO') {
      return `users/${userId}/brands/${brandId}/logo/${safeFileName}`;
    }
    if (type === 'PRODUCT_IMAGE') {
      return `users/${userId}/brands/${brandId}/products/${safeFileName}`;
    }
    return `users/${userId}/brands/${brandId}/${type.toLowerCase()}/${safeFileName}`;
  }

  return `users/${userId}/assets/${type.toLowerCase()}/${safeFileName}`;
}

export class AssetService {
  constructor({ assetRepository, brandRepository, storageProvider, config, logger }) {
    this.assetRepository = assetRepository;
    this.brandRepository = brandRepository;
    this.storageProvider = storageProvider;
    this.config = config || {};
    this.logger = logger;
  }

  async uploadAsset(user, { file, type, brandId = null }) {
    if (brandId) {
      const brand = await this.brandRepository.findById(user.id, brandId);
      if (!brand) throw notFound('Brand');
    }

    const maxBytes = this.config.maxUploadSizeBytes || (this.config.maxUploadSizeMb || 25) * 1024 * 1024;
    const maxMb = this.config.maxUploadSizeMb || 25;
    validateUploadedFile(file, maxBytes, maxMb);

    const storageKey = generateStorageKey({
      userId: user.id,
      brandId,
      type,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    let previousAsset = null;
    if (brandId && type === 'LOGO') {
      previousAsset = await this.assetRepository.findActiveBrandAsset(user.id, brandId, 'LOGO');
    }

    let uploadedKey = null;
    try {
      const uploadResult = await this.storageProvider.upload({
        storageKey,
        buffer: file.buffer,
        mimeType: file.mimetype,
        metadata: {
          userId: user.id,
          brandId: brandId || undefined,
          type,
          originalName: file.originalname,
        },
      });
      uploadedKey = uploadResult.storageKey;

      const asset = await this.assetRepository.create(user.id, {
        brandId,
        type,
        status: 'READY',
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        mimeType: file.mimetype,
        byteSize: BigInt(file.size),
        metadata: {
          originalName: file.originalname,
          bucket: uploadResult.bucket,
        },
      });

      // If replacing an existing brand logo, clean up the old one after successful replacement
      if (previousAsset && previousAsset.id !== asset.id) {
        try {
          await this.assetRepository.softDelete(user.id, previousAsset.id);
          await this.storageProvider.delete({ storageKey: previousAsset.storageKey });
        } catch (cleanupOldError) {
          this.logger?.warn?.({ err: cleanupOldError, oldAssetId: previousAsset.id }, 'Failed to cleanup replaced logo');
        }
      }

      return publicAsset(asset);
    } catch (error) {
      if (uploadedKey) {
        try {
          await this.storageProvider.delete({ storageKey: uploadedKey });
          this.logger?.warn?.({ storageKey: uploadedKey }, 'Cleaned up orphaned storage file after database error');
        } catch (cleanupError) {
          this.logger?.error?.({ err: cleanupError, storageKey: uploadedKey }, 'Failed to cleanup orphaned storage file');
        }
      }
      throw error;
    }
  }

  async getAsset(userId, assetId) {
    const asset = await this.assetRepository.findById(userId, assetId);
    if (!asset) throw notFound('Asset');
    return publicAsset(asset);
  }

  async listAssets(userId, query) {
    const { items, total } = await this.assetRepository.list(userId, query);
    return {
      items: items.map(publicAsset),
      pagination: paginationMeta(query.page, query.limit, total),
    };
  }

  async deleteAsset(userId, assetId) {
    const asset = await this.assetRepository.findById(userId, assetId);
    if (!asset) throw notFound('Asset');

    await this.assetRepository.softDelete(userId, assetId);
    try {
      await this.storageProvider.delete({ storageKey: asset.storageKey });
    } catch (error) {
      this.logger?.warn?.({ err: error, storageKey: asset.storageKey }, 'Failed to delete file from storage during asset deletion');
    }

    return true;
  }
}
