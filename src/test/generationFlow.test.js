import { beforeEach, describe, expect, it } from 'vitest';
import mockCredits from '../services/mockCredits';
import mockGeneration from '../services/mockGeneration';
import { generateVariationWithCredits, generateWithCredits } from '../services/mockGenerationFlow';
import { mockStorage } from '../services/mockStorage';

const socialParams = {
  platform: 'instagram', goal: 'engagement', contentLanguage: 'ar',
  postType: 'promotional', description: 'قهوة مختصة', tone: 'friendly', ctaPreference: 'اطلب الآن',
};

describe('mock generation credit integrity', () => {
  beforeEach(() => {
    mockStorage.setUserId('generation-user');
    mockCredits.setBalance(100);
  });

  it('deducts zero and stores nothing on controlled failure', async () => {
    window.__FINX_FAIL_MOCK = true;
    await expect(generateWithCredits('social-post', socialParams, null)).rejects.toThrow('MOCK_FAILURE');
    expect(mockCredits.getBalance()).toBe(100);
    expect(mockGeneration.getAllResults()).toEqual([]);
    expect(mockGeneration.getRecentActivity()).toEqual([]);
  });

  it('deducts exactly once after successful generation', async () => {
    const result = await generateWithCredits('social-post', socialParams, null);
    expect(result.parameters.description).toBe('قهوة مختصة');
    expect(mockCredits.getBalance()).toBe(95);
    expect(mockGeneration.getAllResults()).toHaveLength(1);
    expect(mockGeneration.getRecentActivity()).toHaveLength(1);
  });

  it('creates an unsaved variation without mutating the original', async () => {
    const original = await generateWithCredits('social-post', socialParams, null);
    const snapshot = JSON.parse(JSON.stringify(mockGeneration.getResult(original.id)));
    const variation = await generateVariationWithCredits(original.id, { tone: 'bold', length: 'short' });
    expect(variation.id).not.toBe(original.id);
    expect(variation.originalId).toBe(original.id);
    expect(variation.saved).toBe(false);
    expect(mockGeneration.getResult(original.id)).toEqual(snapshot);
    expect(mockCredits.getBalance()).toBe(90);
  });
});
