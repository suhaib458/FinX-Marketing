/**
 * Route guard decision logic.
 *
 * emailNotVerified: true when the backend explicitly rejected with AUTH_EMAIL_NOT_VERIFIED.
 * hasAppSession: true when the backend accepted the session and returned the MySQL user.
 *
 * The backend is the single source of truth for email verification.
 */
export function getProtectedRouteDecision({ isAuthenticated, emailNotVerified = false, hasAppSession = true, isOnboarded }) {
  if (!isAuthenticated) return 'login';
  if (emailNotVerified) return 'verify';
  if (!hasAppSession) return 'verify';
  if (!isOnboarded) return 'onboarding';
  return 'allow';
}

export function getOnboardingRouteDecision({ isAuthenticated, emailNotVerified = false, hasAppSession = true, isOnboarded, restart }) {
  if (!isAuthenticated) return 'login';
  if (emailNotVerified) return 'verify';
  if (!hasAppSession) return 'verify';
  if (isOnboarded && !restart) return 'app';
  return 'allow';
}

export function requestedPath(location) {
  if (!location) return '/app';
  return `${location.pathname || ''}${location.search || ''}${location.hash || ''}` || '/app';
}

export function safeProtectedDestination(value) {
  return typeof value === 'string' && value.startsWith('/app') ? value : '/app';
}
