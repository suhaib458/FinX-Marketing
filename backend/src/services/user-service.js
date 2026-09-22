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

export class UserService {
  constructor(repository) { this.repository = repository; }

  async authenticateDevelopmentUser(id) {
    const user = await this.repository.findActiveById(id);
    if (!user) throw new AppError(401, 'INVALID_DEV_USER', 'Development user was not found or is inactive');
    return publicUser(user);
  }

  assertVerifiedIdentity(identity) {
    if (!identity?.email || !identity.emailVerified) {
      throw new AppError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'Email verification is required');
    }
  }

  async authenticateFirebaseUser(identity) {
    this.assertVerifiedIdentity(identity);
    const user = await this.repository.findActiveByFirebaseUid(identity.uid);
    if (!user) throw new AppError(401, 'SESSION_REQUIRED', 'Application session must be synchronized');
    return publicUser(user);
  }

  async provisionFirebaseUser(identity) {
    this.assertVerifiedIdentity(identity);
    const user = await this.repository.provisionFirebaseUser(identity);
    if (user?.emailConflict) {
      throw new AppError(409, 'AUTH_EMAIL_CONFLICT', 'This email is already associated with another account');
    }
    return publicUser(user);
  }

  getMe(user) { return publicUser({ ...user, wallet: { balance: user.credits } }); }
}
