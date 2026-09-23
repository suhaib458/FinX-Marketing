import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { firebaseAuth, firebasePersistenceReady } from './firebaseClient';

const googleProvider = new GoogleAuthProvider();
// Explicitly request the standard Google identity scopes. This ensures
// Firebase receives the account email/profile and can propagate the
// verified-email claim for trusted Google identities.
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

const SAFE_ERROR_KEYS = {
  'auth/popup-closed-by-user': 'popupCancelled',
  'auth/cancelled-popup-request': 'popupCancelled',
  'auth/popup-blocked': 'popupBlocked',
  'auth/network-request-failed': 'networkError',
  'auth/invalid-credential': 'invalidCredentials',
  'auth/wrong-password': 'invalidCredentials',
  'auth/user-not-found': 'invalidCredentials',
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/invalid-email': 'invalidEmail',
  'auth/operation-not-allowed': 'operationUnavailable',
  'auth/account-exists-with-different-credential': 'accountExistsWithDifferentCredential',
  'auth/unauthorized-domain': 'unauthorizedDomain',
};

export function safeAuthErrorKey(error) {
  if (error?.name === 'TypeError' || error?.message?.includes('fetch') || error?.code === 'REQUEST_TIMEOUT') {
    return 'networkError';
  }
  if (error?.code === 'AUTH_EMAIL_CONFLICT') {
    return 'emailInUse';
  }
  if (error?.code === 'INVALID_AUTH_TOKEN' || error?.code === 'SESSION_REQUIRED') {
    return 'invalidCredentials';
  }
  return SAFE_ERROR_KEYS[error?.code] || 'unknownError';
}

function logFirebaseError(operation, error) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.error(`[AUTH_ERROR_STAGE=firebase] ${operation} failed:`, {
      code: error?.code,
      message: error?.message,
    });
  }
}

function isPrivateNetworkHost(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\./);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return hostname.endsWith('.local');
}

function assertGoogleAuthOrigin() {
  if (typeof window === 'undefined') return;
  const { protocol, hostname } = window.location;
  if (protocol === 'http:' && isPrivateNetworkHost(hostname)) {
    const error = new Error('Google sign-in requires an authorized HTTPS origin.');
    error.code = 'auth/unauthorized-domain';
    error.stage = 'firebase';
    throw error;
  }
}

function prefersRedirectAuth() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const mobile = /Android|Mobile/i.test(ua);
  return iOS || mobile;
}

async function ready() {
  await firebasePersistenceReady;
}

/**
 * Reload the user and force a fresh ID token so that the local
 * emailVerified value and the token claims are both current.
 * Returns the same user reference (mutated in-place by reload).
 */
async function refreshUser(user) {
  try {
    await reload(user);
  } catch (reloadErr) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[AUTH_ERROR_STAGE=firebase] User reload warning:', reloadErr?.message);
    }
  }
  // Force a fresh token — the backend is the source of truth,
  // but this ensures the token it receives reflects the latest state.
  await user.getIdToken(true);
  return user;
}

export const firebaseAuthService = {
  subscribe(callback) {
    let cancelled = false;
    let unsubscribe = () => {};
    ready()
      .then(() => {
        if (!cancelled) unsubscribe = onAuthStateChanged(firebaseAuth, callback);
      })
      .catch((err) => {
        logFirebaseError('subscribe', err);
        if (!cancelled) callback(null);
      });
    return () => { cancelled = true; unsubscribe(); };
  },

  async register(name, email, password) {
    await ready();
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await sendEmailVerification(credential.user);
      return credential.user;
    } catch (error) {
      logFirebaseError('register', error);
      throw error;
    }
  },

  async login(email, password) {
    await ready();
    try {
      const { user } = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return await refreshUser(user);
    } catch (error) {
      logFirebaseError('login', error);
      throw error;
    }
  },

  async loginWithGoogle() {
    await ready();
    try {
      assertGoogleAuthOrigin();

      // Firebase recommends a redirect flow on mobile browsers. It avoids
      // iOS/Safari popup restrictions and returns to the same route after
      // the Google account picker completes. onAuthStateChanged then
      // resumes the normal FinX backend-session synchronization.
      if (prefersRedirectAuth()) {
        await signInWithRedirect(firebaseAuth, googleProvider);
        return null;
      }

      const { user } = await signInWithPopup(firebaseAuth, googleProvider);
      return await refreshUser(user);
    } catch (error) {
      logFirebaseError('loginWithGoogle', error);
      throw error;
    }
  },

  async logout() {
    await ready();
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      logFirebaseError('logout', error);
      throw error;
    }
  },

  async resetPassword(email) {
    await ready();
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      logFirebaseError('resetPassword', error);
      throw error;
    }
  },

  async resendVerification(user) {
    try {
      await sendEmailVerification(user);
    } catch (error) {
      logFirebaseError('resendVerification', error);
      throw error;
    }
  },

  async refreshVerification(user) {
    return refreshUser(user);
  },

  async getIdToken(user, forceRefresh = false) {
    return user.getIdToken(forceRefresh);
  },
};

export default firebaseAuthService;
