import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp;

function firebaseCredential(config) {
  if (!config.firebaseServiceAccountJson) return applicationDefault();

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(config.firebaseServiceAccountJson);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  if (serviceAccount?.private_key && typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return cert(serviceAccount);
}

export function getOrCreateAdminApp(config) {
  if (!config.firebaseProjectId) {
    throw new Error('Firebase Admin is not configured');
  }
  if (!adminApp) {
    adminApp = getApps()[0] ?? initializeApp({
      credential: firebaseCredential(config),
      projectId: config.firebaseProjectId,
      storageBucket: config.firebaseStorageBucket,
    });
  }
  return adminApp;
}

export function mergeFirebaseUserRecord(decodedToken, userRecord) {
  if (!userRecord) return decodedToken;

  const providerData = Array.isArray(userRecord.providerData) ? userRecord.providerData : [];
  const providerIds = providerData.map((provider) => provider?.providerId).filter(Boolean);
  const googleProvider = providerData.find(
    (provider) => provider?.providerId === 'google.com' && typeof provider?.email === 'string' && provider.email,
  );
  const providerEmail = googleProvider?.email || null;
  const existingIdentities = decodedToken.firebase?.identities && typeof decodedToken.firebase.identities === 'object'
    ? decodedToken.firebase.identities
    : {};
  const identities = { ...existingIdentities };

  for (const providerId of providerIds) {
    if (!identities[providerId]) identities[providerId] = [];
  }

  return {
    ...decodedToken,
    email: typeof decodedToken.email === 'string' && decodedToken.email
      ? decodedToken.email
      : userRecord.email || providerEmail || null,
    email_verified: decodedToken.email_verified === true
      || userRecord.emailVerified === true
      || Boolean(providerEmail),
    name: typeof decodedToken.name === 'string' && decodedToken.name
      ? decodedToken.name
      : userRecord.displayName || null,
    picture: typeof decodedToken.picture === 'string' && decodedToken.picture
      ? decodedToken.picture
      : userRecord.photoURL || null,
    firebase: {
      ...(decodedToken.firebase || {}),
      identities,
    },
  };
}

export function createFirebaseTokenVerifier(config) {
  return {
    async verifyIdToken(idToken) {
      const app = getOrCreateAdminApp(config);
      const auth = getAuth(app);

      // Revocation checks are intentionally not performed on every request in
      // Phase 5C. Firebase signature, audience, issuer, and expiry are verified.
      const decodedToken = await auth.verifyIdToken(idToken, false);

      // Some Identity Platform configurations omit email/email_verified from
      // the ID token even though the Firebase Auth user record contains them.
      // Resolve the authoritative user record server-side and enrich only the
      // identity fields needed by FinX. This keeps the client untrusted.
      const uid = decodedToken.uid || decodedToken.sub;
      if (!uid || (decodedToken.email && decodedToken.email_verified === true)) {
        return decodedToken;
      }

      const userRecord = await auth.getUser(uid);
      const enriched = mergeFirebaseUserRecord(decodedToken, userRecord);

      if (process.env.NODE_ENV === 'development' && !enriched.email) {
        console.error('[AUTH_DIAGNOSTIC=firebase_user_record_missing_email]', {
          providerIds: Array.isArray(userRecord.providerData)
            ? userRecord.providerData.map((provider) => provider?.providerId).filter(Boolean)
            : [],
          hasTopLevelEmail: Boolean(userRecord.email),
          hasGoogleProviderEmail: Boolean(
            userRecord.providerData?.find(
              (provider) => provider?.providerId === 'google.com' && provider?.email,
            ),
          ),
        });
      }

      return enriched;
    },
  };
}

export function resetFirebaseAdminForTests() {
  adminApp = undefined;
}
