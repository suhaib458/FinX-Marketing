import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { mockStorage } from '../services/mockStorage';
import { authApi as defaultAuthApi } from '../services/authApi';
import { firebaseAuthService as defaultAuthService, safeAuthErrorKey } from '../services/firebaseAuth';

const AuthContext = createContext(null);
const PROFILE_KEY = 'auth-profile';

/** Backend error code for unverified email — the only code that triggers /verify-email. */
const EMAIL_NOT_VERIFIED_CODE = 'AUTH_EMAIL_NOT_VERIFIED';

function legacyMockScopeId(email) {
  const normalized = String(email || '').trim().toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mock-${(hash >>> 0).toString(36)}`;
}

function compatibleUser(appUser) {
  if (!appUser) return null;
  // Keep only non-authoritative legacy local preferences/drafts scoped to the authenticated user.
  // Credits, brand data and generated content are owned by backend APIs.
  mockStorage.migrateUserScope(legacyMockScopeId(appUser.email), appUser.id);
  mockStorage.setUserId(appUser.id);
  const localProfile = mockStorage.get(PROFILE_KEY, {});
  return {
    ...appUser,
    plan: appUser.planCode || 'free',
    onboarded: Boolean(appUser.onboardingCompleted || localProfile.onboarded),
    avatar: appUser.photoUrl || null,
    authMode: 'firebase',
  };
}

export function AuthProvider({
  children,
  authService = defaultAuthService,
  apiClient = defaultAuthApi,
}) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  // True when the backend explicitly rejects with AUTH_EMAIL_NOT_VERIFIED.
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const syncInFlight = useRef(null);

  const clearAppSession = useCallback(() => {
    syncInFlight.current = null;
    mockStorage.setUserId(null);
    setAppUser(null);
    setUser(null);
  }, []);

  const applyAppUser = useCallback((nextAppUser) => {
    const nextUser = compatibleUser(nextAppUser);
    setAppUser(nextAppUser);
    setUser(nextUser);
    setAuthError(null);
    setEmailNotVerified(false);
    return nextUser;
  }, []);

  /**
   * Synchronize the Firebase user with the backend.
   *
   * The backend is the SINGLE SOURCE OF TRUTH for email verification.
   * We do NOT gate on firebaseUser.emailVerified client-side.
   * If the backend returns AUTH_EMAIL_NOT_VERIFIED, we keep the
   * Firebase session but clear the app session so the user can be
   * routed to /verify-email for email/password accounts.
   */
  const synchronize = useCallback(async (nextFirebaseUser) => {
    if (!nextFirebaseUser) {
      clearAppSession();
      return null;
    }
    if (syncInFlight.current?.uid === nextFirebaseUser.uid) {
      return syncInFlight.current.promise;
    }
    const promise = apiClient.syncSession(nextFirebaseUser)
      .then(({ user: synchronizedUser }) => applyAppUser(synchronizedUser))
      .catch((error) => {
        clearAppSession();
        if (error?.code === EMAIL_NOT_VERIFIED_CODE) {
          // Backend confirmed email is not verified.
          // Keep firebaseUser alive so the user can resend/refresh.
          setEmailNotVerified(true);
          setAuthError(null);
          return null;
        }
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.error('[AUTH_ERROR_STAGE=session] Session synchronization error:', error);
        }
        setAuthError(error);
        throw error;
      })
      .finally(() => {
        if (syncInFlight.current?.promise === promise) syncInFlight.current = null;
      });
    syncInFlight.current = { uid: nextFirebaseUser.uid, promise };
    return promise;
  }, [apiClient, applyAppUser, clearAppSession]);

  useEffect(() => authService.subscribe(async (nextFirebaseUser) => {
    setFirebaseUser(nextFirebaseUser);
    try {
      if (!nextFirebaseUser) {
        clearAppSession();
        setAuthError(null);
        setEmailNotVerified(false);
      } else {
        // Always let the backend decide. reload + forced token refresh
        // have already been done by the login/loginWithGoogle functions
        // for explicit actions. For cold-start restores via onAuthStateChanged,
        // the token refresh happens inside apiClient.syncSession (401 retry).
        await synchronize(nextFirebaseUser);
      }
    } catch {
      // Keep the Firebase session available so a temporary backend failure can be retried.
    } finally {
      setIsInitializing(false);
    }
  }), [authService, clearAppSession, synchronize]);

  const run = useCallback(async (operation) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      return await operation();
    } catch (error) {
      setAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((email, password) => run(async () => {
    const nextFirebaseUser = await authService.login(email, password);
    setFirebaseUser(nextFirebaseUser);
    // synchronize calls the backend which is the source of truth.
    // If the backend returns AUTH_EMAIL_NOT_VERIFIED, synchronize
    // returns null and sets emailNotVerified=true.
    return synchronize(nextFirebaseUser);
  }), [authService, run, synchronize]);

  const register = useCallback((name, email, password) => run(async () => {
    const nextFirebaseUser = await authService.register(name, email, password);
    setFirebaseUser(nextFirebaseUser);
    // After registration the email is not verified.
    // Do NOT call synchronize — the backend would reject with AUTH_EMAIL_NOT_VERIFIED.
    // sendEmailVerification was already called inside authService.register.
    clearAppSession();
    setEmailNotVerified(true);
    return nextFirebaseUser;
  }), [authService, clearAppSession, run]);

  const loginWithGoogle = useCallback(() => run(async () => {
    const nextFirebaseUser = await authService.loginWithGoogle();
    setFirebaseUser(nextFirebaseUser);
    // Google users always have email_verified=true in the token.
    // The backend will accept and provision the session.
    return synchronize(nextFirebaseUser);
  }), [authService, run, synchronize]);

  const logout = useCallback(() => run(async () => {
    await authService.logout();
    setFirebaseUser(null);
    clearAppSession();
    setAuthError(null);
    setEmailNotVerified(false);
  }), [authService, clearAppSession, run]);

  const resetPassword = useCallback((email) => run(() => authService.resetPassword(email)), [authService, run]);
  const resendVerification = useCallback(() => run(() => {
    if (!firebaseUser) throw new Error('No Firebase user');
    return authService.resendVerification(firebaseUser);
  }), [authService, firebaseUser, run]);

  /**
   * Called when the user clicks "I verified my email".
   * Does reload + getIdToken(true) then calls the backend session.
   * The backend is the source of truth — if the email is now verified
   * in the Firebase token, the backend will accept and return the user.
   */
  const refreshVerification = useCallback(() => run(async () => {
    if (!firebaseUser) return null;
    const refreshed = await authService.refreshVerification(firebaseUser);
    setFirebaseUser(refreshed);
    // Let the backend decide. If still unverified, synchronize returns null
    // and sets emailNotVerified=true. If verified, we get the user back.
    return synchronize(refreshed);
  }), [authService, firebaseUser, run, synchronize]);

  const retrySession = useCallback(() => run(() => synchronize(firebaseUser)), [firebaseUser, run, synchronize]);
  const getIdToken = useCallback((forceRefresh = false) => {
    if (!firebaseUser) return Promise.resolve(null);
    return authService.getIdToken(firebaseUser, forceRefresh);
  }, [authService, firebaseUser]);

  const updateUser = useCallback((updates) => {
    if (!appUser) return;
    const allowed = {};
    if (typeof updates?.onboarded === 'boolean') allowed.onboarded = updates.onboarded;
    mockStorage.set(PROFILE_KEY, { ...mockStorage.get(PROFILE_KEY, {}), ...allowed });
    setUser((previous) => previous ? { ...previous, ...allowed } : previous);
  }, [appUser]);

  const completeOnboarding = useCallback(() => updateUser({ onboarded: true }), [updateUser]);

  const value = useMemo(() => ({
    firebaseUser,
    appUser,
    user,
    isAuthenticated: Boolean(firebaseUser),
    hasAppSession: Boolean(appUser),
    isEmailVerified: Boolean(appUser?.emailVerified),
    emailNotVerified,
    isOnboarded: Boolean(user?.onboarded),
    isInitializing,
    isLoading,
    authError,
    authErrorKey: authError ? safeAuthErrorKey(authError) : null,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerification,
    refreshVerification,
    retrySession,
    getIdToken,
    updateUser,
    completeOnboarding,
    authMode: 'firebase',
  }), [appUser, authError, completeOnboarding, emailNotVerified, firebaseUser, getIdToken, isInitializing,
    isLoading, login, loginWithGoogle, logout, refreshVerification, register,
    resendVerification, resetPassword, retrySession, updateUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
