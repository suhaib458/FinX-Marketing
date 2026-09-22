// FinX — Mock Credit System
// Manages credit balance for the prototype.
// Replace with real payment/billing API when connecting a backend.

import { mockStorage } from './mockStorage';

const CREDIT_KEY = 'credits';
const DEFAULT_BALANCE = 100;

export const TOOL_COSTS = {
  'social-post': 5,
  'ad-design': 20,
  'content-ideas': 8,
  'campaign': 30,
};

export const mockCredits = {
  // Get current credit balance
  getBalance() {
    const balance = mockStorage.get(CREDIT_KEY, null);
    if (balance === null) {
      // Initialize with default balance
      this.setBalance(DEFAULT_BALANCE);
      return DEFAULT_BALANCE;
    }
    return balance;
  },

  // Set credit balance directly
  setBalance(amount) {
    const balance = Math.max(0, Number(amount) || 0);
    mockStorage.set(CREDIT_KEY, balance);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('finx:credits-changed', { detail: { balance } }));
    }
    return balance;
  },

  // Check if user can afford a tool
  canAfford(toolSlug) {
    const cost = TOOL_COSTS[toolSlug] || 0;
    return this.getBalance() >= cost;
  },

  // Get cost for a tool
  getCost(toolSlug) {
    return TOOL_COSTS[toolSlug] || 0;
  },

  // Deduct credits for a tool (returns true if successful)
  deduct(toolSlug) {
    const cost = TOOL_COSTS[toolSlug] || 0;
    const balance = this.getBalance();
    if (balance < cost) return false;
    this.setBalance(balance - cost);
    return true;
  },

  // Check if balance is low (less than cheapest tool)
  isLow() {
    const minCost = Math.min(...Object.values(TOOL_COSTS));
    return this.getBalance() < minCost;
  },

  // DEV ONLY: Reset credits to default
  resetCredits() {
    this.setBalance(DEFAULT_BALANCE);
    return DEFAULT_BALANCE;
  },
};

export default mockCredits;
