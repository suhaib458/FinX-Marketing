import { createApp } from '../../src/app.js';

import { MemoryStorageProvider } from '../../src/infrastructure/storage.js';

export const USER_A = '00000000-0000-4000-8000-00000000000a';
export const USER_B = '00000000-0000-4000-8000-00000000000b';
export const BRAND_A = '30000000-0000-4000-8000-00000000000a';
export const BRAND_B = '30000000-0000-4000-8000-00000000000b';
export const CONTENT_A = '40000000-0000-4000-8000-00000000000a';
export const CONTENT_B = '40000000-0000-4000-8000-00000000000b';
export const VARIATION_A = '40000000-0000-4000-8000-00000000000c';
export const ASSET_A = '70000000-0000-4000-8000-00000000000a';
export const ASSET_B = '70000000-0000-4000-8000-00000000000b';

const now = '2026-08-14T10:00:00.000Z';
const publicBrand = (brand) => {
  const value = { ...brand };
  delete value.userId;
  delete value.deletedAt;
  return value;
};
const publicContent = (content) => {
  const value = { ...content };
  delete value.userId;
  delete value.deletedAt;
  return value;
};

export function createMemoryRepositories() {
  const state = {
    users: [
      { id: USER_A, firebaseUid: null, email: 'a@finx.local', emailVerified: false, name: 'User A', photoUrl: null, role: 'USER', status: 'ACTIVE', planCode: 'free', onboardingCompleted: true, locale: 'ar', timezone: 'Asia/Amman', createdAt: now, deletedAt: null, wallet: { balance: 100 } },
      { id: USER_B, firebaseUid: null, email: 'b@finx.local', emailVerified: false, name: 'User B', photoUrl: null, role: 'USER', status: 'ACTIVE', planCode: 'free', onboardingCompleted: true, locale: 'ar', timezone: 'Asia/Amman', createdAt: now, deletedAt: null, wallet: { balance: 100 } },
    ],
    brands: [
      { id: BRAND_A, userId: USER_A, businessName: 'علامة أ', currency: 'JOD', primaryColor: '#73465F', createdAt: now, updatedAt: now, deletedAt: null },
      { id: BRAND_B, userId: USER_B, businessName: 'Brand B', currency: 'JOD', createdAt: now, updatedAt: now, deletedAt: null },
    ],
    ledger: [
      { id: '50000000-0000-4000-8000-00000000000a', userId: USER_A, direction: 'CREDIT', type: 'INITIAL_GRANT', amount: 100, balanceAfter: 100, createdAt: now },
      { id: '50000000-0000-4000-8000-00000000000b', userId: USER_B, direction: 'CREDIT', type: 'INITIAL_GRANT', amount: 100, balanceAfter: 100, createdAt: now },
    ],
    contents: [
      { id: CONTENT_A, userId: USER_A, brandId: BRAND_A, generationJobId: '60000000-0000-4000-8000-00000000000a', originalContentId: null, tool: 'SOCIAL_POST', language: 'ar', platform: 'instagram', title: 'الأصل', content: { headline: 'أصلي' }, submittedParameters: { tone: 'warm' }, savedAt: now, createdAt: now, updatedAt: now, deletedAt: null },
      { id: VARIATION_A, userId: USER_A, brandId: BRAND_A, generationJobId: '60000000-0000-4000-8000-00000000000c', originalContentId: CONTENT_A, tool: 'SOCIAL_POST', language: 'ar', platform: 'instagram', title: 'تنويع', content: { headline: 'متغير' }, submittedParameters: { tone: 'bold' }, savedAt: null, createdAt: now, updatedAt: now, deletedAt: null },
      { id: CONTENT_B, userId: USER_B, brandId: BRAND_B, generationJobId: '60000000-0000-4000-8000-00000000000b', originalContentId: null, tool: 'AD_DESIGN', language: 'en', platform: 'instagram', title: 'B', content: {}, submittedParameters: {}, savedAt: null, createdAt: now, updatedAt: now, deletedAt: null },
    ],
    generationJobs: [],
    assets: [
      { id: ASSET_A, userId: USER_A, brandId: BRAND_A, type: 'LOGO', status: 'READY', storageKey: `users/${USER_A}/brands/${BRAND_A}/logo/initial.png`, publicUrl: 'https://storage.finx.local/memory-bucket/initial.png', mimeType: 'image/png', byteSize: 1024n, width: null, height: null, metadata: { originalName: 'logo.png', bucket: 'memory-bucket' }, createdAt: now, updatedAt: now, deletedAt: null },
      { id: ASSET_B, userId: USER_B, brandId: BRAND_B, type: 'PRODUCT_IMAGE', status: 'READY', storageKey: `users/${USER_B}/brands/${BRAND_B}/products/initial.jpg`, publicUrl: 'https://storage.finx.local/memory-bucket/initial.jpg', mimeType: 'image/jpeg', byteSize: 2048n, width: null, height: null, metadata: { originalName: 'prod.jpg', bucket: 'memory-bucket' }, createdAt: now, updatedAt: now, deletedAt: null },
    ],
  };

  return {
    state,
    users: {
      async findActiveById(id) {
        return state.users.find((user) => user.id === id && user.status === 'ACTIVE' && !user.deletedAt) ?? null;
      },
      async findActiveByFirebaseUid(firebaseUid) {
        return state.users.find((user) => user.firebaseUid === firebaseUid && user.status === 'ACTIVE' && !user.deletedAt) ?? null;
      },
      async findActiveByEmail(email) {
        const normalized = String(email || '').trim().toLowerCase();
        return state.users.find((user) => user.email === normalized && user.status === 'ACTIVE' && !user.deletedAt) ?? null;
      },
      async provisionFirebaseUser(identity) {
        const email = identity.email.trim().toLowerCase();
        const existing = state.users.find((user) => user.firebaseUid === identity.uid);
        if (existing) {
          Object.assign(existing, {
            email,
            emailVerified: identity.emailVerified,
            name: identity.name || existing.name,
            photoUrl: identity.picture || null,
          });
          return existing;
        }
        const emailOwner = state.users.find((user) => user.email === email);
        if (emailOwner) {
          if (!identity.trustedEmail) return { emailConflict: true };
          Object.assign(emailOwner, {
            emailVerified: true,
            name: identity.name || emailOwner.name,
            photoUrl: identity.picture || emailOwner.photoUrl || null,
          });
          return emailOwner;
        }
        const user = {
          id: `firebase-user-${state.users.length + 1}`,
          firebaseUid: identity.uid,
          email,
          emailVerified: identity.emailVerified,
          name: identity.name || email.split('@')[0],
          photoUrl: identity.picture || null,
          role: 'USER', status: 'ACTIVE', planCode: 'free', onboardingCompleted: false,
          locale: 'ar', timezone: 'Asia/Amman', createdAt: now, deletedAt: null,
          wallet: { balance: 100 },
        };
        state.users.push(user);
        state.ledger.push({
          id: `firebase-ledger-${state.ledger.length + 1}`,
          userId: user.id,
          direction: 'CREDIT', type: 'INITIAL_GRANT', amount: 100,
          balanceAfter: 100, idempotencyKey: 'firebase-initial-grant-v1', createdAt: now,
        });
        return user;
      },
    },
    brands: {
      async list(userId, { page, limit }) {
        const owned = state.brands.filter((brand) => brand.userId === userId && !brand.deletedAt);
        return { items: owned.slice((page - 1) * limit, page * limit).map(publicBrand), total: owned.length };
      },
      async findById(userId, id) {
        const brand = state.brands.find((item) => item.id === id && item.userId === userId && !item.deletedAt);
        return brand ? publicBrand(brand) : null;
      },
      async create(userId, data) {
        const brand = { id: '30000000-0000-4000-8000-00000000000c', userId, currency: 'JOD', ...data, createdAt: now, updatedAt: now, deletedAt: null };
        state.brands.push(brand);
        return publicBrand(brand);
      },
      async update(userId, id, data) {
        const brand = state.brands.find((item) => item.id === id && item.userId === userId && !item.deletedAt);
        if (!brand) return null;
        Object.assign(brand, data, { updatedAt: now });
        return publicBrand(brand);
      },
      async softDelete(userId, id) {
        const brand = state.brands.find((item) => item.id === id && item.userId === userId && !item.deletedAt);
        if (!brand) return false;
        brand.deletedAt = now;
        return true;
      },
    },
    credits: {
      async findWallet(userId) {
        const user = state.users.find((item) => item.id === userId);
        return user ? { balance: user.wallet.balance, updatedAt: now } : null;
      },
      async listLedger(userId, { page, limit, direction, type }) {
        const owned = state.ledger.filter((entry) => entry.userId === userId && (!direction || entry.direction === direction) && (!type || entry.type === type));
        return { items: owned.slice((page - 1) * limit, page * limit), total: owned.length };
      },
    },
    contents: {
      async list(userId, { page, limit, tool, platform, saved }) {
        const owned = state.contents.filter((item) => item.userId === userId && !item.deletedAt && (!tool || item.tool === tool) && (!platform || item.platform === platform) && (saved === undefined || (saved ? item.savedAt !== null : item.savedAt === null)));
        return { items: owned.slice((page - 1) * limit, page * limit).map(publicContent), total: owned.length };
      },
      async findById(userId, id) {
        const item = state.contents.find((content) => content.id === id && content.userId === userId && !content.deletedAt);
        return item ? publicContent(item) : null;
      },
      async update(userId, id, data) {
        const item = state.contents.find((content) => content.id === id && content.userId === userId && !content.deletedAt);
        if (!item) return null;
        if (Object.prototype.hasOwnProperty.call(data, 'saved')) item.savedAt = data.saved ? now : null;
        if (data.content) item.content = data.content;
        item.updatedAt = now;
        return publicContent(item);
      },
      async softDelete(userId, id) {
        const item = state.contents.find((content) => content.id === id && content.userId === userId && !content.deletedAt);
        if (!item) return false;
        item.deletedAt = now;
        return true;
      },
    },
    generations: {
      async reserve({ userId, brandId, tool, input, cost, idempotencyKey }) {
        const duplicate = state.generationJobs.find((job) => job.userId === userId && job.idempotencyKey === idempotencyKey);
        if (duplicate) {
          const content = state.contents.find((item) => item.generationJobId === duplicate.id && !item.deletedAt) || null;
          const user = state.users.find((item) => item.id === userId);
          return { duplicate: true, job: duplicate, content: content ? publicContent(content) : null, balance: user?.wallet.balance ?? 0 };
        }
        const user = state.users.find((item) => item.id === userId);
        if (!user || user.wallet.balance < cost) return { insufficient: true };
        user.wallet.balance -= cost;
        const enumTool = { 'social-post': 'SOCIAL_POST', 'ad-design': 'AD_DESIGN', 'content-ideas': 'CONTENT_IDEAS', campaign: 'CAMPAIGN' }[tool];
        const job = { id: `generation-job-${state.generationJobs.length + 1}`, userId, brandId: brandId || null, tool: enumTool, input, creditCost: cost, idempotencyKey, status: 'PROCESSING', createdAt: now };
        state.generationJobs.push(job);
        state.ledger.push({ id: `generation-ledger-${state.ledger.length + 1}`, userId, direction: 'DEBIT', type: 'RESERVATION', amount: cost, balanceAfter: user.wallet.balance, referenceId: job.id, createdAt: now });
        return { duplicate: false, job, balance: user.wallet.balance };
      },
      async complete({ jobId, userId, content, language, platform, title, submittedParameters, originalContentId }) {
        const job = state.generationJobs.find((item) => item.id === jobId && item.userId === userId);
        if (!job) return null;
        const existing = state.contents.find((item) => item.generationJobId === jobId && !item.deletedAt);
        const user = state.users.find((item) => item.id === userId);
        if (existing) return { content: publicContent(existing), balance: user?.wallet.balance ?? 0 };
        const item = { id: `generated-content-${state.contents.length + 1}`, userId, brandId: job.brandId, generationJobId: job.id, originalContentId: originalContentId || null, tool: job.tool, language, platform, title, content, submittedParameters, savedAt: null, createdAt: now, updatedAt: now, deletedAt: null };
        state.contents.push(item);
        job.status = 'COMPLETED';
        const ledger = state.ledger.find((entry) => entry.referenceId === job.id && entry.type === 'RESERVATION');
        if (ledger) ledger.type = 'SETTLEMENT';
        return { content: publicContent(item), balance: user?.wallet.balance ?? 0 };
      },
      async fail({ jobId, userId, code, message }) {
        const job = state.generationJobs.find((item) => item.id === jobId && item.userId === userId);
        if (!job || !['QUEUED', 'PROCESSING'].includes(job.status)) return false;
        const user = state.users.find((item) => item.id === userId);
        user.wallet.balance += job.creditCost;
        job.status = 'FAILED'; job.errorCode = code; job.errorMessage = message;
        state.ledger.push({ id: `refund-ledger-${state.ledger.length + 1}`, userId, direction: 'CREDIT', type: 'REFUND', amount: job.creditCost, balanceAfter: user.wallet.balance, referenceId: job.id, createdAt: now });
        return true;
      },
    },
    assets: {
      async list(userId, { page = 1, limit = 20, type, brandId } = {}) {
        const owned = state.assets.filter((item) =>
          item.userId === userId &&
          !item.deletedAt &&
          (!type || item.type === type) &&
          (!brandId || item.brandId === brandId),
        );
        return {
          items: owned.slice((page - 1) * limit, page * limit),
          total: owned.length,
        };
      },
      async findById(userId, id) {
        return state.assets.find((item) => item.id === id && item.userId === userId && !item.deletedAt) ?? null;
      },
      async findActiveBrandAsset(userId, brandId, type) {
        return state.assets.find((item) =>
          item.userId === userId &&
          item.brandId === brandId &&
          item.type === type &&
          !item.deletedAt,
        ) ?? null;
      },
      async create(userId, data) {
        const asset = {
          id: `70000000-0000-4000-8000-${String(state.assets.length + 1).padStart(12, '0')}`,
          userId,
          ...data,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        state.assets.push(asset);
        return asset;
      },
      async softDelete(userId, id) {
        const item = state.assets.find((asset) => asset.id === id && asset.userId === userId && !asset.deletedAt);
        if (!item) return false;
        item.deletedAt = now;
        return true;
      },
    },
  };
}

export function testConfig(overrides = {}) {
  return {
    nodeEnv: 'test', isProduction: false, port: 3001, version: 'test', databaseUrl: undefined,
    corsOrigins: ['http://localhost:5173'], allowDevAuth: true, logLevel: 'silent', trustProxy: false,
    rateLimitWindowMs: 60_000, rateLimitMax: 1000, jsonBodyLimit: '100kb',
    firebaseProjectId: 'test-project', maxUploadSizeMb: 25,
    maxUploadSizeBytes: 25 * 1024 * 1024, ...overrides,
  };
}

export function buildTestApp(options = {}) {
  const repositories = options.repositories ?? createMemoryRepositories();
  const database = options.database ?? { prisma: null, checkConnection: async () => true, disconnect: async () => {} };
  const storageProvider = options.storageProvider ?? new MemoryStorageProvider();
  const runtime = createApp({
    config: testConfig(options.config),
    repositories,
    database,
    storageProvider,
    tokenVerifier: options.tokenVerifier,
    aiProvider: options.aiProvider,
  });
  return { ...runtime, repositories, storageProvider };
}

export const auth = (request, userId = USER_A) => request.set('x-finx-dev-user-id', userId);
