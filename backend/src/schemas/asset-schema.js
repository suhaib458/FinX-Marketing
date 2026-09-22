import { z } from 'zod';

export const assetTypeEnum = z.enum(['LOGO', 'PRODUCT_IMAGE', 'GENERATED_IMAGE', 'ANALYTICS_SCREENSHOT']);

export const uploadAssetBodySchema = z.object({
  type: assetTypeEnum,
  brandId: z.string().uuid('Invalid brand ID format').optional().nullable(),
});

export const assetIdParamsSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID format'),
});

export const assetListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: assetTypeEnum.optional(),
  brandId: z.string().uuid('Invalid brand ID format').optional(),
});
