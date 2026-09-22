import { describe, expect, it } from 'vitest';
import { validateCreateValues } from '../utils/createValidation';

const messages = { required: 'Required', invalidDate: 'Invalid date' };

describe('Create Content validation', () => {
  it('blocks missing required Social Post fields and trims values', () => {
    const result = validateCreateValues('social-post', {
      platform: 'instagram', goal: 'engagement', contentLanguage: 'ar',
      postType: 'promotional', description: '   ', tone: 'professional',
    }, messages);
    expect(result.valid).toBe(false);
    expect(result.errors.description).toBe('Required');
  });

  it('accepts complete ad and idea input and rejects malformed campaign dates', () => {
    expect(validateCreateValues('ad-design', {
      platform: 'instagram', goal: 'leads', contentLanguage: 'en',
      offerDescription: ' 25% off ', designSize: 'squarePost',
    }, messages).valid).toBe(true);
    expect(validateCreateValues('campaign', {
      platform: 'facebook', goal: 'traffic', contentLanguage: 'en',
      objective: 'Launch', campaignProduct: 'Coffee', tone: 'friendly', startDate: '2026-02-30',
    }, messages).errors.startDate).toBe('Invalid date');
  });
});
