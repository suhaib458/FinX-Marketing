import crypto from 'node:crypto';
import { AppError, notFound } from '../common/errors.js';

const TOOL_SCHEMAS = {
  'social-post': `Return a JSON object with exactly these useful fields:\n{\n  "headline": string,\n  "caption": string,\n  "cta": string,\n  "hashtags": string[],\n  "visualConcept": string,\n  "platformMeta": {\n    "charCount": number,\n    "hashtagCount": number,\n    "bestTimeToPost": string\n  }\n}`,
  'ad-design': `Return a JSON object with:\n{\n  "headline": string,\n  "offer": string,\n  "cta": string,\n  "visualConcept": string\n}`,
  'content-ideas': `Return a JSON object with:\n{\n  "ideas": [{ "id": string, "title": string, "angle": string, "format": string, "hook": string, "cta": string, "visual": string }]\n}\nReturn exactly 5 ideas.`,
  campaign: `Return a JSON object with:\n{\n  "days": [{ "day": number, "date": string, "platform": string, "format": string, "idea": string, "hook": string, "caption": string, "cta": string, "designConcept": string }]\n}\nReturn exactly 7 days.`,
};

export const GENERATION_COSTS = { 'social-post': 5, 'ad-design': 20, 'content-ideas': 8, campaign: 30 };
const ENUM_TO_SLUG = { SOCIAL_POST: 'social-post', AD_DESIGN: 'ad-design', CONTENT_IDEAS: 'content-ideas', CAMPAIGN: 'campaign' };

function systemInstruction(tool, isVariation = false) {
  return [
    'You are FinX, an expert AI marketing team for small and growing businesses.',
    'Create practical, publish-ready marketing content, not generic filler.',
    'Respect the requested language, platform, tone, goal, audience, brand identity, and Jordan context when provided.',
    'Do not fabricate factual claims, prices, testimonials, certifications, or guarantees that the user did not provide.',
    isVariation ? 'Create a genuinely different variation while preserving the factual meaning and brand constraints of the original.' : null,
    'Return valid JSON only, with no Markdown fences or commentary.',
    TOOL_SCHEMAS[tool],
  ].filter(Boolean).join('\n\n');
}

function normalizeContent(tool, generated, params, brand) {
  if (tool === 'ad-design') {
    return {
      ...generated,
      primaryColor: params.useBrandColors === false ? '#73465F' : brand.primaryColor || '#73465F',
      secondaryColor: params.useBrandColors === false ? '#EBCBC1' : brand.secondaryColor || '#EBCBC1',
      logo: params.showLogo === false ? null : brand.logo || null,
      productImage: params.productImage || brand.images?.[0] || null,
      designSize: params.designSize || 'square',
    };
  }
  return generated;
}

function publicResult(record, balance, brandName = '', source = 'gemini') {
  return {
    id: record.id,
    type: ENUM_TO_SLUG[record.tool],
    platform: record.platform || 'instagram',
    contentLanguage: record.language || 'ar',
    tone: record.submittedParameters?.tone || 'professional',
    parameters: record.submittedParameters || {},
    creditCost: GENERATION_COSTS[ENUM_TO_SLUG[record.tool]] || 0,
    content: record.content,
    createdAt: record.createdAt,
    savedAt: record.savedAt,
    businessName: brandName,
    source,
    balance,
    originalContentId: record.originalContentId || null,
  };
}

function resultTitle(generated) {
  return generated?.headline || generated?.title || generated?.ideas?.[0]?.title || generated?.days?.[0]?.idea || null;
}

export class GenerationService {
  constructor({ aiProvider, repository, brandRepository, contentRepository }) {
    this.aiProvider = aiProvider;
    this.repository = repository;
    this.brandRepository = brandRepository;
    this.contentRepository = contentRepository;
  }

  async resolveBrand(userId, brandId, fallback = {}) {
    if (!brandId) return { id: null, ...fallback };
    const brand = await this.brandRepository.findById(userId, brandId);
    if (!brand) throw notFound('Brand');
    return { ...fallback, ...brand, id: brandId };
  }

  async runGeneration(user, { tool, params, brandId, brand = {}, idempotencyKey, originalContentId = null, originalContent = null }) {
    const cost = GENERATION_COSTS[tool];
    const resolvedBrand = await this.resolveBrand(user.id, brandId, brand);
    const key = idempotencyKey || crypto.randomUUID();
    const input = { tool, params, brand: resolvedBrand, ...(originalContent ? { originalContent } : {}) };
    const reservation = await this.repository.reserve({ userId: user.id, brandId: resolvedBrand.id, tool, input, cost, idempotencyKey: key });

    if (reservation.insufficient) throw new AppError(402, 'INSUFFICIENT_CREDITS', 'Not enough credits for this generation');
    if (reservation.duplicate) {
      if (reservation.content) return publicResult(reservation.content, reservation.balance, resolvedBrand.businessName || '');
      throw new AppError(409, 'GENERATION_IN_PROGRESS', 'A generation with this idempotency key is already in progress');
    }

    try {
      const generated = await this.aiProvider.generateJson({
        systemInstruction: systemInstruction(tool, Boolean(originalContent)),
        prompt: JSON.stringify({ task: tool, params, brand: resolvedBrand, originalContent, userLocale: user.locale || 'ar' }, null, 2),
      });
      const normalized = normalizeContent(tool, generated, params, resolvedBrand);
      const completed = await this.repository.complete({
        jobId: reservation.job.id,
        userId: user.id,
        content: normalized,
        language: params.contentLanguage || user.locale || 'ar',
        platform: params.platform || 'instagram',
        title: resultTitle(normalized),
        submittedParameters: params,
        originalContentId,
        modelIdentifier: this.aiProvider.model || null,
      });
      return publicResult(completed.content, completed.balance, resolvedBrand.businessName || '');
    } catch (error) {
      await this.repository.fail({ jobId: reservation.job.id, userId: user.id, code: error?.code || 'AI_PROVIDER_ERROR', message: error?.message || 'AI provider failed' });
      throw error;
    }
  }

  generate(user, body) { return this.runGeneration(user, body); }

  async variation(user, contentId, { options = {}, idempotencyKey }) {
    const original = await this.contentRepository.findById(user.id, contentId);
    if (!original) throw notFound('Content');
    const tool = ENUM_TO_SLUG[original.tool];
    const params = { ...original.submittedParameters, ...options };
    return this.runGeneration(user, {
      tool,
      params,
      brandId: original.brandId,
      idempotencyKey,
      originalContentId: original.id,
      originalContent: original.content,
    });
  }
}
