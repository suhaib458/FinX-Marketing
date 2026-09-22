import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';
import { savedBoolean } from './common.js';

export const contentListQuerySchema = paginationSchema.extend({
  tool: z.enum(['SOCIAL_POST', 'AD_DESIGN', 'CONTENT_IDEAS', 'CAMPAIGN']).optional(),
  platform: z.string().trim().min(1).max(80).optional(),
  saved: savedBoolean.optional(),
}).strict();

export const updateContentSchema = z.object({
  saved: z.boolean().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });
