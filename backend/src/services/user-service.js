import { AppError } from '../common/errors.js';

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    name: user.name,
    photoUrl: user.photoUrl || null,
    role: user.role,
    status: user.status,
    planCode: user.planCode,
    onboardingCompleted: user.onboardingCompleted,
    locale: user.locale,
    timezone: user.timezone,
    credits: user.wallet?.balance ?? 0,
    createdAt: user.createdAt,
  };
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isTrustedGoogleEmail(identity) {
  const email = normalizeEmail(identity?.email);
  const providers = Array.isArray(identity?.providers) ? identity.providers : [];
  const isGoogleIdentity = identity?.provider === 'google.com' || providers.includes('google.com');
  return isGoogleIdentity && Boolean(email);
}

function verifiedIdentity(identity) {
  const email = normalizeEmail(identity?.email);
  const trustedEmail = isTrustedGoogleEmail(identity);
  const normalized = {
    ...identity,
    email,
    emailVerified: Boolean(identity?.emailVerified || trustedEmail),
    trustedEmail,
  };

  if (!normalized.email || !normalized.emailVerified) {
    if (process.env.NODE_ENV === 'development') {
      const domain = normalized.email.includes('@') ? normalized.email.split('@').pop() : null;
      console.error('[AUTH_DIAGNOSTIC=unverified_identity]', {
        provider: identity?.provider || null,
        providers: Array.isArray(identity?.providers) ? identity.providers : [],
        hasEmail: Boolean(normalized.email),
        emailDomain: domain,
        emailVerified: Boolean(identity?.emailVerified),
      });
    }
    throw new AppError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'Email verification is required');
  }

  return normalized;
}

export class UserService {
  constructor(repository) { this.repository = repository; }

  async authenticateDevelopmentUser(id) {
    const user = await this.repository.findActiveById(id);
    if (!user) throw new AppError(401, 'INVALID_DEV_USER', 'Development user was not found or is inactive');
    return publicUser(user);
  }

  async authenticateFirebaseUser(identity) {
    const verified = verifiedIdentity(identity);
    let user = await this.repository.findActiveByFirebaseUid(verified.uid);

    // Identity Platform can keep a Google identity and an email/password identity
    // as separate Firebase users. For a trusted @gmail.com Google identity, the
    // verified email is safe to use as the app-level account key.
    if (!user && verified.trustedEmail) {
      user = await this.repository.findActiveByEmail(verified.email);
    }

    if (!user) throw new AppError(401, 'SESSION_REQUIRED', 'Application session must be synchronized');
    return publicUser(user);
  }

  async provisionFirebaseUser(identity) {
    const verified = verifiedIdentity(identity);
    const user = await this.repository.provisionFirebaseUser(verified);
    if (user?.emailConflict) {
      throw new AppError(409, 'AUTH_EMAIL_CONFLICT', 'This email is already associated with another account');
    }
    return publicUser(user);
  }

  getMe(user) { return publicUser({ ...user, wallet: { balance: user.credits } }); }
}
