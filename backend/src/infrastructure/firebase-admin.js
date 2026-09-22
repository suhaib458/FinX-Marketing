import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp;

export function getOrCreateAdminApp(config) {
  if (!config.firebaseProjectId) {
    throw new Error('Firebase Admin is not configured');
  }
  if (!adminApp) {
    adminApp = getApps()[0] ?? initializeApp({
      credential: applicationDefault(),
      projectId: config.firebaseProjectId,
      storageBucket: config.firebaseStorageBucket,
    });
  }
  return adminApp;
}

export function createFirebaseTokenVerifier(config) {
  return {
    async verifyIdToken(idToken) {
      const app = getOrCreateAdminApp(config);
      // Revocation checks are intentionally not performed on every request in
      // Phase 5C. Firebase signature, audience, issuer, and expiry are verified.
      return getAuth(app).verifyIdToken(idToken, false);
    },
  };
}

export function resetFirebaseAdminForTests() {
  adminApp = undefined;
}
