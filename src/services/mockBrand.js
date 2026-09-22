// FinX — Mock Brand Service
// Manages brand/business profile data in localStorage.
// Replace with real API calls when connecting a backend.

import { mockStorage } from './mockStorage';

const BRAND_KEY = 'brand-profile';

function durableAsset(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
}

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  return {
    ...profile,
    logo: durableAsset(profile.logo),
    images: Array.isArray(profile.images)
      ? profile.images.map(durableAsset).filter(Boolean).slice(0, 5)
      : [],
  };
}

export const mockBrand = {
  // Get the current brand profile
  getProfile() {
    return sanitizeProfile(mockStorage.get(BRAND_KEY, null));
  },

  // Save or update the brand profile
  saveProfile(profile) {
    const existing = this.getProfile();
    const updated = {
      ...(existing || {}),
      ...sanitizeProfile(profile),
      updatedAt: new Date().toISOString(),
    };
    if (!existing) {
      updated.createdAt = new Date().toISOString();
    }
    return mockStorage.set(BRAND_KEY, updated);
  },

  // Check if brand profile exists
  hasProfile() {
    return !!this.getProfile();
  },

  // Delete the brand profile
  deleteProfile() {
    return mockStorage.remove(BRAND_KEY);
  },

  // Get a specific field from the profile
  getField(field, defaultValue = '') {
    const profile = this.getProfile();
    return profile ? (profile[field] || defaultValue) : defaultValue;
  },
};

export default mockBrand;
