import { z } from 'zod';

const flexibleObject = z.record(z.string(), z.unknown());
const idempotencyKey = z.string().trim().min(8).max(191).optional();

export const generationRequestSchema = z.object({
  tool: z.enum(['social-post', 'ad-design', 'content-ideas', 'campaign']),
  params: flexibleObject.default({}),
  brandId: z.uuid().optional().nullable(),
  brand: flexibleObject.optional().default({}),
  idempotencyKey,
}).strict();

export const variationRequestSchema = z.object({
  options: flexibleObject.optional().default({}),
  idempotencyKey,
}).strict();
