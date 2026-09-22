import { describe, expect, it } from 'vitest';
import { getOnboardingRouteDecision, getProtectedRouteDecision, requestedPath, safeProtectedDestination } from '../utils/routeGuards';

describe('route guard decisions', () => {
  it('sends guests to login and non-onboarded users to onboarding', () => {
    expect(getProtectedRouteDecision({ isAuthenticated: false, isOnboarded: false })).toBe('login');
    expect(getProtectedRouteDecision({ isAuthenticated: true, isOnboarded: false })).toBe('onboarding');
    expect(getProtectedRouteDecision({ isAuthenticated: true, isOnboarded: true })).toBe('allow');
    expect(getProtectedRouteDecision({ isAuthenticated: true, emailNotVerified: true, hasAppSession: false, isOnboarded: false })).toBe('verify');
    expect(getProtectedRouteDecision({ isAuthenticated: true, emailNotVerified: false, hasAppSession: false, isOnboarded: false })).toBe('verify');
  });

  it('allows brand restart but redirects normal onboarded visits', () => {
    expect(getOnboardingRouteDecision({ isAuthenticated: true, isOnboarded: true, restart: false })).toBe('app');
    expect(getOnboardingRouteDecision({ isAuthenticated: true, isOnboarded: true, restart: true })).toBe('allow');
  });

  it('preserves only safe requested application destinations', () => {
    expect(requestedPath({ pathname: '/app/library', search: '?saved=true', hash: '#item' }))
      .toBe('/app/library?saved=true#item');
    expect(safeProtectedDestination('/app/library?saved=true')).toBe('/app/library?saved=true');
    expect(safeProtectedDestination('https://attacker.example')).toBe('/app');
    expect(safeProtectedDestination('/login')).toBe('/app');
  });
});
