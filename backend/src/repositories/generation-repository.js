const TOOL_ENUM = {
  'social-post': 'SOCIAL_POST',
  'ad-design': 'AD_DESIGN',
  'content-ideas': 'CONTENT_IDEAS',
  campaign: 'CAMPAIGN',
};

const contentSelect = {
  id: true, brandId: true, generationJobId: true, originalContentId: true,
  tool: true, language: true, platform: true, title: true, content: true,
  submittedParameters: true, savedAt: true, createdAt: true, updatedAt: true,
};

export class GenerationRepository {
  constructor(prisma) { this.prisma = prisma; }

  async reserve({ userId, brandId, tool, input, cost, idempotencyKey }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.generationJob.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { generatedContents: { where: { deletedAt: null }, select: contentSelect, take: 1 } },
      });
      if (existing) {
        const wallet = await tx.creditWallet.findUnique({ where: { userId }, select: { balance: true } });
        return { duplicate: true, job: existing, content: existing.generatedContents[0] || null, balance: wallet?.balance ?? 0 };
      }

      const debited = await tx.creditWallet.updateMany({
        where: { userId, balance: { gte: cost } },
        data: { balance: { decrement: cost }, version: { increment: 1 } },
      });
      if (!debited.count) return { insufficient: true };

      const wallet = await tx.creditWallet.findUnique({ where: { userId }, select: { id: true, balance: true } });
      const job = await tx.generationJob.create({
        data: {
          userId,
          brandId: brandId || null,
          tool: TOOL_ENUM[tool],
          status: 'PROCESSING',
          input,
          creditCost: cost,
          idempotencyKey,
          startedAt: new Date(),
        },
      });
      await tx.creditLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          direction: 'DEBIT',
          type: 'RESERVATION',
          amount: cost,
          balanceAfter: wallet.balance,
          idempotencyKey: `generation:${job.id}`,
          description: `Reserved ${cost} credits for ${tool}`,
          referenceType: 'GenerationJob',
          referenceId: job.id,
        },
      });
      return { duplicate: false, job, balance: wallet.balance };
    });
  }

  async complete({ jobId, userId, content, language, platform, title, submittedParameters, originalContentId, modelIdentifier }) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.generationJob.findFirst({ where: { id: jobId, userId } });
      if (!job) return null;
      const existing = await tx.generatedContent.findFirst({ where: { generationJobId: jobId, userId, deletedAt: null }, select: contentSelect });
      if (existing) {
        const wallet = await tx.creditWallet.findUnique({ where: { userId }, select: { balance: true } });
        return { content: existing, balance: wallet?.balance ?? 0 };
      }

      const created = await tx.generatedContent.create({
        data: {
          userId,
          brandId: job.brandId,
          generationJobId: job.id,
          originalContentId: originalContentId || null,
          tool: job.tool,
          language,
          platform: platform || null,
          title: title || null,
          content,
          submittedParameters,
        },
        select: contentSelect,
      });
      await tx.generationJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', completedAt: new Date(), modelIdentifier: modelIdentifier || null, errorCode: null, errorMessage: null },
      });
      await tx.creditLedger.updateMany({
        where: { userId, referenceType: 'GenerationJob', referenceId: job.id, type: 'RESERVATION' },
        data: { type: 'SETTLEMENT', description: `Settled ${job.creditCost} credits for generation` },
      });
      const wallet = await tx.creditWallet.findUnique({ where: { userId }, select: { balance: true } });
      return { content: created, balance: wallet?.balance ?? 0 };
    });
  }

  async fail({ jobId, userId, code = 'GENERATION_FAILED', message = 'Generation failed' }) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.generationJob.findFirst({ where: { id: jobId, userId } });
      if (!job || !['QUEUED', 'PROCESSING'].includes(job.status)) return false;

      await tx.creditWallet.update({ where: { userId }, data: { balance: { increment: job.creditCost }, version: { increment: 1 } } });
      const wallet = await tx.creditWallet.findUnique({ where: { userId }, select: { id: true, balance: true } });
      await tx.creditLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          direction: 'CREDIT',
          type: 'REFUND',
          amount: job.creditCost,
          balanceAfter: wallet.balance,
          idempotencyKey: `refund:${job.id}`,
          description: 'Automatic refund after failed generation',
          referenceType: 'GenerationJob',
          referenceId: job.id,
        },
      });
      await tx.generationJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', completedAt: new Date(), errorCode: code, errorMessage: String(message).slice(0, 5000) },
      });
      return true;
    });
  }
}
