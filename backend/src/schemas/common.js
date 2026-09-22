import { z } from 'zod';

export const brandIdParamsSchema = z.object({ brandId: z.uuid() }).strict();
export const contentIdParamsSchema = z.object({ contentId: z.uuid() }).strict();

export const savedBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());
