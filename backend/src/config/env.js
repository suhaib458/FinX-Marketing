import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDir, '../../.env') });
dotenv.config();

const booleanValue = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  },
  z.boolean(),
);

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_VERSION: z.string().min(1).default('0.1.0'),
  DATABASE_URL: z.string().url().optional(),
  FIREBASE_PROJECT_ID: z.string().trim().min(1).optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  ALLOW_DEV_AUTH: booleanValue.default(false),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: booleanValue.default(false),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  JSON_BODY_LIMIT: z.string().regex(/^\d+(b|kb|mb)$/i).default('100kb'),
  FIREBASE_STORAGE_BUCKET: z.string().trim().min(1).optional(),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(25),
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-3.8-flash'),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
}).superRefine((env, context) => {
  if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
    context.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'DATABASE_URL is required in production' });
  }
  if (env.NODE_ENV === 'production' && !env.FIREBASE_PROJECT_ID) {
    context.addIssue({ code: 'custom', path: ['FIREBASE_PROJECT_ID'], message: 'FIREBASE_PROJECT_ID is required in production' });
  }
  if (env.NODE_ENV === 'production' && !env.FIREBASE_STORAGE_BUCKET) {
    context.addIssue({ code: 'custom', path: ['FIREBASE_STORAGE_BUCKET'], message: 'FIREBASE_STORAGE_BUCKET is required in production' });
  }
  if (env.NODE_ENV === 'production' && env.ALLOW_DEV_AUTH) {
    context.addIssue({ code: 'custom', path: ['ALLOW_DEV_AUTH'], message: 'Development authentication cannot be enabled in production' });
  }
  if (env.NODE_ENV === 'production' && !env.CORS_ORIGINS.trim()) {
    context.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'At least one production CORS origin is required' });
  }
  if (env.NODE_ENV === 'production' && env.CORS_ORIGINS.split(',').some((origin) => origin.trim() === '*')) {
    context.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'Wildcard CORS is not allowed in production' });
  }
});

export function loadConfig(source = process.env) {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    isProduction: parsed.data.NODE_ENV === 'production',
    port: parsed.data.PORT,
    version: parsed.data.APP_VERSION,
    databaseUrl: parsed.data.DATABASE_URL,
    firebaseProjectId: parsed.data.FIREBASE_PROJECT_ID,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
    allowDevAuth: parsed.data.ALLOW_DEV_AUTH,
    logLevel: parsed.data.LOG_LEVEL,
    trustProxy: parsed.data.TRUST_PROXY,
    rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    jsonBodyLimit: parsed.data.JSON_BODY_LIMIT,
    firebaseStorageBucket: parsed.data.FIREBASE_STORAGE_BUCKET,
    maxUploadSizeMb: parsed.data.MAX_UPLOAD_SIZE_MB,
    maxUploadSizeBytes: Math.round(parsed.data.MAX_UPLOAD_SIZE_MB * 1024 * 1024),
    geminiApiKey: parsed.data.GEMINI_API_KEY,
    geminiModel: parsed.data.GEMINI_MODEL,
    aiRequestTimeoutMs: parsed.data.AI_REQUEST_TIMEOUT_MS,
  };
}
