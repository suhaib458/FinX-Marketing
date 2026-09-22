import { describe, expect, it } from 'vitest';
import ar from '../i18n/ar';
import en from '../i18n/en';

function structure(value) {
  if (Array.isArray(value)) return ['array'];
  if (!value || typeof value !== 'object') return typeof value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, structure(value[key])]));
}

describe('translation parity', () => {
  it('keeps Arabic and English translation structures aligned', () => {
    expect(structure(ar)).toEqual(structure(en));
  });
});
