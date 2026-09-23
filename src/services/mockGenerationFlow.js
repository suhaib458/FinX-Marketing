// Generation coordinator. Production always uses the backend as the source of truth.
// Local mocks are isolated to VITE_AI_MODE=mock for offline/demo development only.
import mockCredits from './mockCredits';
import mockGeneration from './mockGeneration';
import generationApi from './generationApi';
import contentApi from './contentApi';

const generators = {
  'social-post': 'generateSocialPost',
  'ad-design': 'generateAdDesign',
  'content-ideas': 'generateContentIdeas',
  campaign: 'generateCampaign',
};

const useMockGeneration = import.meta.env.VITE_AI_MODE === 'mock';

function insufficientCreditsError() {
  const error = new Error('INSUFFICIENT_CREDITS');
  error.code = 'INSUFFICIENT_CREDITS';
  return error;
}

export async function generateWithCredits(tool, params, brand, { firebaseUser } = {}) {
  const method = generators[tool];
  if (!method) throw new Error('UNKNOWN_TOOL');

  if (useMockGeneration) {
    if (!mockCredits.canAfford(tool)) throw insufficientCreditsError();
    const result = await mockGeneration[method](params, brand);
    if (!mockCredits.deduct(tool)) {
      mockGeneration.removeResult(result.id);
      throw insufficientCreditsError();
    }
    return result;
  }

  if (!firebaseUser) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  return generationApi.generate(firebaseUser, { tool, params, brand });
}

export async function generateVariationWithCredits(originalId, options, { firebaseUser } = {}) {
  if (useMockGeneration) {
    const original = mockGeneration.getResult(originalId);
    if (!original) throw new Error('ORIGINAL_NOT_FOUND');
    if (!mockCredits.canAfford(original.type)) throw insufficientCreditsError();
    const variation = await mockGeneration.generateVariation(originalId, options);
    if (!mockCredits.deduct(original.type)) {
      mockGeneration.removeResult(variation.id);
      throw insufficientCreditsError();
    }
    return variation;
  }

  if (!firebaseUser) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  return contentApi.variation(firebaseUser, originalId, options);
}
