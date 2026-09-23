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

function normalizeOrigin(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, '');
}

function resolvedCorsOrigins(env) {
  const origins = new Set(
    env.CORS_ORIGINS
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean),
  );

  for (const host of [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL]) {
    const normalizedHost = String(host || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (normalizedHost) origins.add(`https://${normalizedHost}`);
  }

  return [...origins];
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_VERSION: z.string().min(1).default('0.1.0'),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_CA_CERT: z.string().trim().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().trim().min(1).optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().trim().min(2).optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().trim().min(1).optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  VERCEL_URL: z.string().trim().min(1).optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().trim().min(1).optional(),
  ALLOW_DEV_AUTH: booleanValue.default(false),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: booleanValue.default(false),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  JSON_BODY_LIMIT: z.string().regex(/^\d+(b|kb|mb)$/i).default('100kb'),
  FIREBASE_STORAGE_BUCKET: z.string().trim().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().trim().min(1).optional(),
  STORAGE_MODE: z.enum(['auto', 'local', 'firebase', 'vercel']).default('auto'),
  LOCAL_UPLOAD_DIR: z.string().trim().min(1).default('.data/uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(25),
  XKIRO_API_KEY: z.string().trim().min(1).optional(),
  XKIRO_BASE_URL: z.string().url().default('https://api.xkiro.com/v1'),
  XKIRO_MODEL: z.string().trim().min(1).default('google/gemini-3.7-flash'),
  XKIRO_FALLBACK_MODEL: z.string().trim().min(1).default('qwen/qwen3.8-max:free'),
  AI_REASONING_EFFORT: z.enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']).default('none'),
  // Temporary compatibility alias for local environments that previously
  // stored an xKiro key under GEMINI_API_KEY.
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(180000).default(75000),
}).superRefine((env, context) => {
  if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
    context.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'DATABASE_URL is required in production' });
  }
  if (env.NODE_ENV === 'production' && !env.FIREBASE_PROJECT_ID) {
    context.addIssue({ code: 'custom', path: ['FIREBASE_PROJECT_ID'], message: 'FIREBASE_PROJECT_ID is required in production' });
  }
  if (env.NODE_ENV === 'production' && !(env.FIREBASE_SERVICE_ACCOUNT_JSON || env.GOOGLE_APPLICATION_CREDENTIALS)) {
    context.addIssue({
      code: 'custom',
      path: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
      message: 'Firebase Admin credentials are required in production',
    });
  }
  if (env.NODE_ENV === 'production' && env.STORAGE_MODE === 'local') {
    context.addIssue({ code: 'custom', path: ['STORAGE_MODE'], message: 'Local storage cannot be used in production' });
  }
  if (env.NODE_ENV === 'production' && env.STORAGE_MODE === 'firebase' && !env.FIREBASE_STORAGE_BUCKET) {
    context.addIssue({ code: 'custom', path: ['FIREBASE_STORAGE_BUCKET'], message: 'FIREBASE_STORAGE_BUCKET is required when Firebase storage is selected' });
  }
  if (env.NODE_ENV === 'production' && env.STORAGE_MODE === 'vercel' && !env.BLOB_READ_WRITE_TOKEN) {
    context.addIssue({ code: 'custom', path: ['BLOB_READ_WRITE_TOKEN'], message: 'BLOB_READ_WRITE_TOKEN is required when Vercel Blob is selected' });
  }
  if (env.NODE_ENV === 'production' && env.ALLOW_DEV_AUTH) {
    context.addIssue({ code: 'custom', path: ['ALLOW_DEV_AUTH'], message: 'Development authentication cannot be enabled in production' });
  }
  if (env.NODE_ENV === 'production' && !resolvedCorsOrigins(env).length) {
    context.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'At least one production CORS origin is required' });
  }
  if (env.NODE_ENV === 'production' && resolvedCorsOrigins(env).some((origin) => origin === '*')) {
    context.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'Wildcard CORS is not allowed in production' });
  }
});

export function loadConfig(source = process.env) {
  const normalizedSource = {
    ...source,
    FIREBASE_PROJECT_ID: source.FIREBASE_PROJECT_ID || source.VITE_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: source.FIREBASE_STORAGE_BUCKET || source.VITE_FIREBASE_STORAGE_BUCKET,
    TRUST_PROXY: source.TRUST_PROXY ?? (source.VERCEL ? 'true' : undefined),
  };

  const parsed = environmentSchema.safeParse(normalizedSource);
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
    databaseCaCert: parsed.data.DATABASE_CA_CERT,
    firebaseProjectId: parsed.data.FIREBASE_PROJECT_ID,
    firebaseServiceAccountJson: parsed.data.FIREBASE_SERVICE_ACCOUNT_JSON,
    corsOrigins: resolvedCorsOrigins(parsed.data),
    allowDevAuth: parsed.data.ALLOW_DEV_AUTH,
    logLevel: parsed.data.LOG_LEVEL,
    trustProxy: parsed.data.TRUST_PROXY,
    rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    jsonBodyLimit: parsed.data.JSON_BODY_LIMIT,
    firebaseStorageBucket: parsed.data.FIREBASE_STORAGE_BUCKET,
    blobReadWriteToken: parsed.data.BLOB_READ_WRITE_TOKEN,
    storageMode: parsed.data.STORAGE_MODE,
    localUploadDir: path.resolve(configDir, '../../', parsed.data.LOCAL_UPLOAD_DIR),
    maxUploadSizeMb: parsed.data.MAX_UPLOAD_SIZE_MB,
    maxUploadSizeBytes: Math.round(parsed.data.MAX_UPLOAD_SIZE_MB * 1024 * 1024),
    xkiroApiKey: parsed.data.XKIRO_API_KEY || parsed.data.GEMINI_API_KEY,
    xkiroBaseUrl: parsed.data.XKIRO_BASE_URL,
    xkiroModel: parsed.data.XKIRO_MODEL,
    xkiroFallbackModel: parsed.data.XKIRO_FALLBACK_MODEL,
    aiReasoningEffort: parsed.data.AI_REASONING_EFFORT,
    aiRequestTimeoutMs: parsed.data.AI_REQUEST_TIMEOUT_MS,
  };
}