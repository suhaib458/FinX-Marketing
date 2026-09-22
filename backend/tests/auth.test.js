import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp, createMemoryRepositories } from './helpers/test-app.js';

const verifiedPassword = {
  uid: 'firebase-password-user', sub: 'firebase-password-user',
  email: 'new-user@example.com', email_verified: true, name: 'مستخدم جديد 🚀',
  firebase: { sign_in_provider: 'password' },
};

const tokenVerifier = {
  async verifyIdToken(token) {
    if (token === 'valid') return verifiedPassword;
    if (token === 'google') return {
      ...verifiedPassword, uid: 'firebase-google-user', sub: 'firebase-google-user',
      email: 'google-user@example.com', picture: 'https://example.com/photo.png',
      firebase: { sign_in_provider: 'google.com' },
    };
    if (token === 'unverified') return { ...verifiedPassword, email_verified: false };
    if (token === 'conflict') return {
      ...verifiedPassword, uid: 'different-firebase-user', sub: 'different-firebase-user',
      email: 'a@finx.local',
    };
    throw new Error('invalid token details must not escape');
  },
};

describe('Firebase authentication', () => {
  it.each([
    ['missing', undefined, 'AUTH_REQUIRED'],
    ['malformed', 'Token value', 'INVALID_AUTH_HEADER'],
    ['invalid', 'Bearer invalid', 'INVALID_AUTH_TOKEN'],
  ])('rejects a %s bearer token safely', async (_case, authorization, code) => {
    const { app } = buildTestApp({ tokenVerifier });
    const pending = request(app).post('/api/v1/auth/session');
    if (authorization) pending.set('authorization', authorization);
    const response = await pending;
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe(code);
    expect(JSON.stringify(response.body)).not.toContain('invalid token details');
  });

  it('ignores client identity fields and provisions the verified token identity once', async () => {
    const { app, repositories } = buildTestApp({ tokenVerifier });
    const first = await request(app).post('/api/v1/auth/session')
      .set('authorization', 'Bearer valid')
      .send({ uid: 'attacker', role: 'ADMIN', credits: 999999 });
    const second = await request(app).post('/api/v1/auth/session')
      .set('authorization', 'Bearer valid');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.data.user).toMatchObject({ email: 'new-user@example.com', role: 'USER', credits: 100 });
    expect(first.body.data.user.id).toBe(second.body.data.user.id);
    expect(first.body.data.user).not.toHaveProperty('firebaseUid');
    expect(repositories.state.users.filter((user) => user.firebaseUid === verifiedPassword.uid)).toHaveLength(1);
    expect(repositories.state.ledger.filter((entry) => entry.idempotencyKey === 'firebase-initial-grant-v1')).toHaveLength(1);
  });

  it('keeps concurrent provisioning idempotent', async () => {
    const { app, repositories } = buildTestApp({ tokenVerifier });
    const responses = await Promise.all(Array.from({ length: 5 }, () => request(app)
      .post('/api/v1/auth/session').set('authorization', 'Bearer valid')));
    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(new Set(responses.map((response) => response.body.data.user.id)).size).toBe(1);
    expect(repositories.state.ledger.filter((entry) => entry.idempotencyKey === 'firebase-initial-grant-v1')).toHaveLength(1);
  });

  it('rejects unverified email users without provisioning', async () => {
    const repositories = createMemoryRepositories();
    const { app } = buildTestApp({ tokenVerifier, repositories });
    const before = repositories.state.users.length;
    const response = await request(app).post('/api/v1/auth/session')
      .set('authorization', 'Bearer unverified');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('AUTH_EMAIL_NOT_VERIFIED');
    expect(repositories.state.users).toHaveLength(before);
  });

  it('accepts verified Google identity and exposes /me after synchronization', async () => {
    const { app } = buildTestApp({ tokenVerifier });
    expect((await request(app).post('/api/v1/auth/session').set('authorization', 'Bearer google')).status).toBe(200);
    const response = await request(app).get('/api/v1/me').set('authorization', 'Bearer google');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ emailVerified: true, photoUrl: 'https://example.com/photo.png' });
  });

  it('returns a safe conflict instead of auto-linking an existing email', async () => {
    const { app, repositories } = buildTestApp({ tokenVerifier });
    const response = await request(app).post('/api/v1/auth/session')
      .set('authorization', 'Bearer conflict');
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('AUTH_EMAIL_CONFLICT');
    expect(repositories.state.users.find((user) => user.email === 'a@finx.local').firebaseUid).toBeNull();
  });

  it('updates an existing user emailVerified from false to true when token becomes verified', async () => {
    const { app, repositories } = buildTestApp({ tokenVerifier });
    // First provision with verified token
    await request(app).post('/api/v1/auth/session').set('authorization', 'Bearer valid');
    const user = repositories.state.users.find((u) => u.firebaseUid === 'firebase-password-user');
    expect(user.emailVerified).toBe(true);
    // Manually set to false to simulate stuck user
    user.emailVerified = false;
    // Re-sync with verified token — should update back to true
    const response = await request(app).post('/api/v1/auth/session').set('authorization', 'Bearer valid');
    expect(response.status).toBe(200);
    expect(response.body.data.user.emailVerified).toBe(true);
    expect(user.emailVerified).toBe(true);
  });

  it('/me returns correct state after session sync', async () => {
    const { app } = buildTestApp({ tokenVerifier });
    await request(app).post('/api/v1/auth/session').set('authorization', 'Bearer google');
    const response = await request(app).get('/api/v1/me').set('authorization', 'Bearer google');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      email: 'google-user@example.com',
      emailVerified: true,
      credits: 100,
    });
    expect(response.body.data).not.toHaveProperty('firebaseUid');
    expect(response.body.data).not.toHaveProperty('password');
  });

  it('email conflict does not allow account takeover', async () => {
    const repositories = createMemoryRepositories();
    const { app } = buildTestApp({ tokenVerifier, repositories });
    // User A already owns a@finx.local — conflict token tries to claim it with different uid
    const before = repositories.state.users.length;
    const response = await request(app).post('/api/v1/auth/session')
      .set('authorization', 'Bearer conflict');
    expect(response.status).toBe(409);
    // No new user created
    expect(repositories.state.users).toHaveLength(before);
    // Original user's firebaseUid unchanged
    const original = repositories.state.users.find((u) => u.email === 'a@finx.local');
    expect(original.firebaseUid).toBeNull();
  });

  it('returning user sync is idempotent and preserves existing credits and wallet', async () => {
    const { app, repositories } = buildTestApp({ tokenVerifier });
    // First provision
    const first = await request(app).post('/api/v1/auth/session').set('authorization', 'Bearer valid');
    expect(first.status).toBe(200);
    expect(first.body.data.user.credits).toBe(100);

    // Simulate returning user logging in again
    const second = await request(app).post('/api/v1/auth/session').set('authorization', 'Bearer valid');
    expect(second.status).toBe(200);
    expect(second.body.data.user.id).toBe(first.body.data.user.id);
    expect(second.body.data.user.credits).toBe(100);

    // Only one initial grant ledger entry exists
    const ledger = repositories.state.ledger.filter((l) => l.userId === first.body.data.user.id);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].type).toBe('INITIAL_GRANT');
  });
});
