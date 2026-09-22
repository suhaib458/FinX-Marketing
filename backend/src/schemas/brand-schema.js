import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';

const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const color = z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a six-digit hex color').transform((value) => value.toUpperCase());
const websiteUrl = z.url().max(2048).refine(
  (value) => ['http:', 'https:'].includes(new URL(value).protocol),
  'Website must use HTTP or HTTPS',
);
const website = z.union([websiteUrl, z.literal('')]).transform((value) => value || null);
const price = z.preprocess(
  (value) => typeof value === 'number' ? value.toString() : value,
  z.string().trim().regex(/^\d{1,9}(\.\d{1,3})?$/, 'Price must be a positive decimal with at most three fractional digits'),
);
const currency = z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase());
const username = z.string().trim().regex(/^@?[A-Za-z0-9._-]{2,190}$/).nullable();

export const brandListQuerySchema = paginationSchema;

export const createBrandSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  businessDescription: optionalText(5000),
  category: optionalText(120),
  targetAudience: optionalText(5000),
  productService: optionalText(300),
  productDescription: optionalText(5000),
  price: price.nullable().optional(),
  currency: currency.optional(),
  website: website.nullable().optional(),
  username: username.optional(),
  primaryColor: color.nullable().optional(),
  secondaryColor: color.nullable().optional(),
}).strict();

export const updateBrandSchema = createBrandSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);
