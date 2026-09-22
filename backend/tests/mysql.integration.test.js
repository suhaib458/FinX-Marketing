import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { loadConfig } from '../src/config/env.js';
import { createDatabase } from '../src/infrastructure/database.js';
import { BrandRepository } from '../src/repositories/brand-repository.js';
import { UserRepository } from '../src/repositories/user-repository.js';
import { UserService } from '../src/services/user-service.js';

const enabled = process.env.RUN_MYSQL_INTEGRATION === 'true';
const describeMySql = enabled ? describe.sequential : describe.skip;

const USER_A = '70000000-0000-4000-8000-00000000000a';
const USER_B = '70000000-0000-4000-8000-00000000000b';
const WALLET_A = '71000000-0000-4000-8000-00000000000a';
const WALLET_B = '71000000-0000-4000-8000-00000000000b';
const JOB_A = '72000000-0000-4000-8000-00000000000a';
const JOB_VARIATION = '72000000-0000-4000-8000-00000000000b';
const CONTENT_A = '73000000-0000-4000-8000-00000000000a';
const CONTENT_VARIATION = '73000000-0000-4000-8000-00000000000b';
const ROLLBACK_BRAND = '74000000-0000-4000-8000-00000000000a';
const AUTH_ROLLBACK_USER = '75000000-0000-4000-8000-00000000000a';
const AUTH_ROLLBACK_WALLET = '76000000-0000-4000-8000-00000000000a';
const FIREBASE_UID = 'integration-firebase-uid';

let database;
let prisma;
let brands;

async function cleanup() {
  const firebaseUsers = await prisma.user.findMany({
    where: { OR: [{ firebaseUid: { startsWith: 'integration-firebase-' } }, { id: AUTH_ROLLBACK_USER }] },
    select: { id: true },
  });
  const userIds = [USER_A, USER_B, ...firebaseUsers.map((user) => user.id)];
  await prisma.generatedContent.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.generationJob.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.asset.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.creditLedger.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.creditWallet.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.brand.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

describeMySql('MySQL 8 integration', () => {
  beforeAll(async () => {
    database = createDatabase(loadConfig());
    prisma = database.prisma;
    brands = new BrandRepository(prisma);
    const [identity] = await prisma.$queryRawUnsafe('SELECT DATABASE() AS databaseName, VERSION() AS serverVersion');
    expect(identity.databaseName).toBe('finx_dev');
    expect(identity.serverVersion).toMatch(/^8\.0\./);
    await cleanup();
    await prisma.user.createMany({
      data: [
        { id: USER_A, email: 'integration-a@finx.local', name: 'مستخدم التكامل أ' },
        { id: USER_B, email: 'integration-b@finx.local', name: 'Integration User B' },
      ],
    });
    await prisma.creditWallet.createMany({
      data: [
        { id: WALLET_A, userId: USER_A, balance: 100 },
        { id: WALLET_B, userId: USER_B, balance: 100 },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) await cleanup();
    if (database) await database.disconnect();
  });

  it('keeps the twice-run seed idempotent with one wallet and one 100-credit grant per seeded user', async () => {
    const seedIds = [
      '00000000-0000-4000-8000-00000000000a',
      '00000000-0000-4000-8000-00000000000b',
    ];
    const users = await prisma.user.findMany({
      where: { id: { in: seedIds } },
      include: { wallet: { include: { ledger: true } } },
    });
    expect(users).toHaveLength(2);
    for (const user of users) {
      expect(user.wallet.balance).toBe(100);
      expect(user.wallet.ledger).toHaveLength(1);
      expect(user.wallet.ledger[0]).toMatchObject({ amount: 100, balanceAfter: 100, idempotencyKey: 'development-initial-grant-v1' });
    }
  });

  it('round-trips UUID, Arabic, emoji, exact Decimal price, and JOD default', async () => {
    const brand = await prisma.brand.create({
      data: {
        userId: USER_A,
        businessName: 'علامة فينكس ☕️',
        businessDescription: 'نص عربي محفوظ بالكامل 🚀',
        price: '12.375',
        primaryColor: '#73465F',
      },
    });
    expect(brand.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const stored = await prisma.brand.findUnique({ where: { id: brand.id } });
    expect(stored.businessName).toBe('علامة فينكس ☕️');
    expect(stored.businessDescription).toBe('نص عربي محفوظ بالكامل 🚀');
    expect(stored.price.toFixed(3)).toBe('12.375');
    expect(stored.currency).toBe('JOD');
  });

  it('enforces unique email, one wallet per user, ledger idempotency, integer credits, and foreign keys', async () => {
    await expect(prisma.user.create({ data: { email: 'integration-a@finx.local', name: 'Duplicate' } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(prisma.creditWallet.create({ data: { userId: USER_A, balance: 1 } })).rejects.toMatchObject({ code: 'P2002' });
    await prisma.creditLedger.create({
      data: {
        walletId: WALLET_A, userId: USER_A, direction: 'CREDIT', type: 'ADJUSTMENT',
        amount: 5, balanceAfter: 105, idempotencyKey: 'integration-idempotency',
      },
    });
    await expect(prisma.creditLedger.create({
      data: {
        walletId: WALLET_A, userId: USER_A, direction: 'CREDIT', type: 'ADJUSTMENT',
        amount: 5, balanceAfter: 105, idempotencyKey: 'integration-idempotency',
      },
    })).rejects.toMatchObject({ code: 'P2002' });
    const [balanceColumn] = await prisma.$queryRawUnsafe(
      "SELECT DATA_TYPE AS dataType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'CreditWallet' AND column_name = 'balance'",
    );
    expect(balanceColumn.dataType).toBe('int');
    const wallet = await prisma.creditWallet.update({ where: { id: WALLET_A }, data: { balance: 101 } });
    expect(Number.isInteger(wallet.balance)).toBe(true);
    await expect(prisma.brand.create({ data: { userId: '79999999-0000-4000-8000-000000000099', businessName: 'Orphan' } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('enforces ownership, pagination, and soft-delete reads in the real repository', async () => {
    const first = await prisma.brand.create({ data: { userId: USER_A, businessName: 'Owned A' } });
    await prisma.brand.create({ data: { userId: USER_A, businessName: 'Owned A2' } });
    expect(await brands.findById(USER_B, first.id)).toBeNull();
    const pageOne = await brands.list(USER_A, { page: 1, limit: 1 });
    const pageTwo = await brands.list(USER_A, { page: 2, limit: 1 });
    expect(pageOne.items).toHaveLength(1);
    expect(pageTwo.items).toHaveLength(1);
    expect(pageOne.total).toBeGreaterThanOrEqual(3);
    await brands.softDelete(USER_A, first.id);
    expect(await brands.findById(USER_A, first.id)).toBeNull();
  });

  it('preserves the original generated content when creating a related variation', async () => {
    await prisma.generationJob.createMany({
      data: [
        { id: JOB_A, userId: USER_A, tool: 'SOCIAL_POST', input: { topic: 'أصلي' }, creditCost: 5, idempotencyKey: 'integration-job-original' },
        { id: JOB_VARIATION, userId: USER_A, tool: 'SOCIAL_POST', input: { topic: 'تنويع' }, creditCost: 5, idempotencyKey: 'integration-job-variation' },
      ],
    });
    await prisma.generatedContent.create({
      data: {
        id: CONTENT_A, userId: USER_A, generationJobId: JOB_A, tool: 'SOCIAL_POST', language: 'ar',
        content: { headline: 'المحتوى الأصلي' }, submittedParameters: { tone: 'warm' },
      },
    });
    await prisma.generatedContent.create({
      data: {
        id: CONTENT_VARIATION, userId: USER_A, generationJobId: JOB_VARIATION,
        originalContentId: CONTENT_A, tool: 'SOCIAL_POST', language: 'ar',
        content: { headline: 'المحتوى المتغير' }, submittedParameters: { tone: 'bold' },
      },
    });
    const original = await prisma.generatedContent.findUnique({ where: { id: CONTENT_A } });
    const variation = await prisma.generatedContent.findUnique({ where: { id: CONTENT_VARIATION } });
    expect(original.content).toEqual({ headline: 'المحتوى الأصلي' });
    expect(variation.originalContentId).toBe(CONTENT_A);
  });

  it('rolls back a failed related transaction', async () => {
    await expect(prisma.$transaction(async (transaction) => {
      await transaction.brand.create({ data: { id: ROLLBACK_BRAND, userId: USER_A, businessName: 'Must roll back' } });
      throw new Error('intentional rollback');
    })).rejects.toThrow('intentional rollback');
    expect(await prisma.brand.findUnique({ where: { id: ROLLBACK_BRAND } })).toBeNull();
  });

  it('provisions one Firebase user, wallet, and initial grant transactionally and idempotently', async () => {
    const service = new UserService(new UserRepository(prisma));
    const identity = {
      uid: FIREBASE_UID,
      email: ' Integration-Firebase@Example.com ',
      emailVerified: true,
      name: 'مستخدم فايربيس 🚀',
      picture: null,
      provider: 'password',
    };
    const results = await Promise.all([
      service.provisionFirebaseUser(identity),
      service.provisionFirebaseUser(identity),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(results[0]).toMatchObject({
      email: 'integration-firebase@example.com', name: 'مستخدم فايربيس 🚀', credits: 100,
    });
    const stored = await prisma.user.findUnique({
      where: { firebaseUid: FIREBASE_UID },
      include: { wallet: { include: { ledger: true } } },
    });
    expect(stored.wallet.balance).toBe(100);
    expect(stored.wallet.ledger).toHaveLength(1);
    expect(stored.wallet.ledger[0]).toMatchObject({
      type: 'INITIAL_GRANT', amount: 100, idempotencyKey: 'firebase-initial-grant-v1',
    });
  });

  it('rolls back Firebase user and wallet when provisioning transaction fails', async () => {
    await expect(prisma.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          id: AUTH_ROLLBACK_USER, firebaseUid: 'integration-firebase-rollback',
          email: 'integration-rollback@example.com', emailVerified: true, name: 'Rollback',
        },
      });
      await transaction.creditWallet.create({
        data: { id: AUTH_ROLLBACK_WALLET, userId: AUTH_ROLLBACK_USER, balance: 100 },
      });
      throw new Error('intentional auth rollback');
    })).rejects.toThrow('intentional auth rollback');
    expect(await prisma.user.findUnique({ where: { id: AUTH_ROLLBACK_USER } })).toBeNull();
    expect(await prisma.creditWallet.findUnique({ where: { id: AUTH_ROLLBACK_WALLET } })).toBeNull();
  });

  it('manages Asset records, ownership, BigInt byteSize, and unique storageKey constraint', async () => {
    const assetId = '77000000-0000-4000-8000-00000000000a';
    const storageKey = `users/${USER_A}/assets/logo/unique-test.png`;
    const asset = await prisma.asset.create({
      data: {
        id: assetId,
        userId: USER_A,
        type: 'LOGO',
        status: 'READY',
        storageKey,
        publicUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/test?alt=media',
        mimeType: 'image/png',
        byteSize: 10485760n,
        metadata: { originalName: 'logo.png', bucket: 'test-bucket' },
      },
    });
    expect(asset.id).toBe(assetId);
    expect(asset.byteSize).toBe(10485760n);

    // Duplicate storageKey should fail unique constraint
    await expect(prisma.asset.create({
      data: {
        id: '77000000-0000-4000-8000-00000000000b',
        userId: USER_A,
        type: 'PRODUCT_IMAGE',
        storageKey,
        mimeType: 'image/png',
        byteSize: 500n,
      },
    })).rejects.toMatchObject({ code: 'P2002' });

    // Soft delete
    await prisma.asset.update({ where: { id: assetId }, data: { deletedAt: new Date() } });
    const deleted = await prisma.asset.findFirst({ where: { id: assetId, deletedAt: null } });
    expect(deleted).toBeNull();
  });
});

