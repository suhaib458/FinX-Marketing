import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { mockStorage } from '../services/mockStorage';
import { ApiError } from '../services/authApi';

function createAuthService(initialUser = null) {
  let listener;
  return {
    service: {
      subscribe: vi.fn((callback) => {
        listener = callback;
        queueMicrotask(() => callback(initialUser));
        return () => {};
      }),
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      resendVerification: vi.fn(),
      refreshVerification: vi.fn(),
      getIdToken: vi.fn(),
    },
    emit(user) { return act(() => listener(user)); },
  };
}

function renderAuth(authService, apiClient) {
  let auth;
  function Probe() { auth = useAuth(); return null; }
  render(<AuthProvider authService={authService} apiClient={apiClient}><Probe /></AuthProvider>);
  return () => auth;
}

function storageDump() {
  return Array.from({ length: localStorage.length }, (_, index) => {
    const key = localStorage.key(index);
    return `${key}=${localStorage.getItem(key)}`;
  }).join('\n');
}

async function callInAct(operation) {
  let result;
  let failure;
  await act(async () => {
    try { result = await operation(); } catch (error) { failure = error; }
  });
  if (failure) throw failure;
  return result;
}

const firebaseUser = {
  uid: 'firebase-uid', email: 'user@example.com', emailVerified: true,
  getIdToken: vi.fn().mockResolvedValue('secret-id-token'),
};
const googleFirebaseUser = {
  uid: 'firebase-google-uid', email: 'google-user@example.com', emailVerified: true,
  getIdToken: vi.fn().mockResolvedValue('secret-google-id-token'),
};
const mysqlUser = {
  id: 'mysql-user-id', email: 'user@example.com', emailVerified: true,
  name: 'User', role: 'USER', planCode: 'free', onboardingCompleted: false, credits: 100,
};
const googleMysqlUser = {
  id: 'mysql-google-id', email: 'google-user@example.com', emailVerified: true,
  name: 'Google User', role: 'USER', planCode: 'free', onboardingCompleted: false, credits: 100,
};

describe('AuthContext Firebase session lifecycle', () => {
  it('finishes initialization only after a verified session is synchronized', async () => {
    const auth = createAuthService(firebaseUser);
    let resolveSync;
    const apiClient = { syncSession: vi.fn(() => new Promise((resolve) => { resolveSync = resolve; })) };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(apiClient.syncSession).toHaveBeenCalled());
    expect(current().isInitializing).toBe(true);
    await act(async () => {
      resolveSync({ user: mysqlUser });
      await Promise.resolve();
    });
    await waitFor(() => expect(current().isInitializing).toBe(false));
    expect(current().user.id).toBe('mysql-user-id');
    expect(mockStorage.getUserId()).toBe('mysql-user-id');
    expect(storageDump()).not.toContain('secret-id-token');
  });

  it('handles AUTH_EMAIL_NOT_VERIFIED from backend without creating MySQL user', async () => {
    const auth = createAuthService({ ...firebaseUser, emailVerified: false });
    const unverifiedError = new ApiError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'Email verification is required');
    const apiClient = { syncSession: vi.fn().mockRejectedValue(unverifiedError) };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));
    expect(current().isAuthenticated).toBe(true);
    expect(current().hasAppSession).toBe(false);
    expect(current().emailNotVerified).toBe(true);
    expect(mockStorage.getUserId()).toBeNull();
  });

  it('1 & 2 & 3 & 4: verified Google user syncs session, never sets emailNotVerified, never calls sendEmailVerification', async () => {
    const auth = createAuthService(null);
    const apiClient = { syncSession: vi.fn().mockResolvedValue({ user: googleMysqlUser }) };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    auth.service.loginWithGoogle.mockResolvedValueOnce(googleFirebaseUser);
    const result = await callInAct(() => current().loginWithGoogle());

    expect(result).toMatchObject({ id: 'mysql-google-id' });
    expect(current().hasAppSession).toBe(true);
    expect(current().emailNotVerified).toBe(false);
    expect(current().isAuthenticated).toBe(true);
    expect(auth.service.resendVerification).not.toHaveBeenCalled();
    expect(apiClient.syncSession).toHaveBeenCalledWith(googleFirebaseUser);
  });

  it('5: email registration sets emailNotVerified without backend sync and preserves session', async () => {
    const auth = createAuthService(null);
    const apiClient = { syncSession: vi.fn() };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    const unverifiedUser = { ...firebaseUser, emailVerified: false };
    auth.service.register.mockResolvedValueOnce(unverifiedUser);
    const result = await callInAct(() => current().register('New User', 'user@example.com', 'secret123'));

    expect(result).toBe(unverifiedUser);
    expect(current().emailNotVerified).toBe(true);
    expect(current().hasAppSession).toBe(false);
    expect(apiClient.syncSession).not.toHaveBeenCalled();
  });

  it('6 & 7: email login for verified vs unverified accounts behaves correctly', async () => {
    const auth = createAuthService(null);
    const unverifiedError = new ApiError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'Email verification is required');
    const apiClient = {
      syncSession: vi.fn()
        .mockRejectedValueOnce(unverifiedError)
        .mockResolvedValueOnce({ user: mysqlUser }),
    };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    // Unverified login: backend rejects with AUTH_EMAIL_NOT_VERIFIED
    auth.service.login.mockResolvedValueOnce({ ...firebaseUser, emailVerified: false });
    const unverifiedResult = await callInAct(() => current().login('unverified@example.com', 'pass123'));
    expect(unverifiedResult).toBeNull();
    expect(current().emailNotVerified).toBe(true);
    expect(current().hasAppSession).toBe(false);
    expect(auth.service.resendVerification).not.toHaveBeenCalled();

    // Verified login: backend accepts
    auth.service.login.mockResolvedValueOnce(firebaseUser);
    const verifiedResult = await callInAct(() => current().login('verified@example.com', 'pass123'));
    expect(verifiedResult).toMatchObject({ id: 'mysql-user-id' });
    expect(current().emailNotVerified).toBe(false);
    expect(current().hasAppSession).toBe(true);
  });

  it('8 & 9: resend verification triggers only on user request and propagates errors', async () => {
    const auth = createAuthService(firebaseUser);
    const apiClient = { syncSession: vi.fn().mockResolvedValue({ user: mysqlUser }) };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    auth.service.resendVerification.mockResolvedValueOnce();
    await callInAct(() => current().resendVerification());
    expect(auth.service.resendVerification).toHaveBeenCalledWith(firebaseUser);

    const rateLimitError = Object.assign(new Error('Rate limited'), { code: 'auth/too-many-requests' });
    auth.service.resendVerification.mockRejectedValueOnce(rateLimitError);
    await expect(callInAct(() => current().resendVerification())).rejects.toBe(rateLimitError);
  });

  it('10: refreshVerification reloads user and synchronizes session with backend', async () => {
    const auth = createAuthService({ ...firebaseUser, emailVerified: false });
    const unverifiedError = new ApiError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'Email verification is required');
    const apiClient = {
      syncSession: vi.fn()
        .mockRejectedValueOnce(unverifiedError)
        .mockResolvedValueOnce({ user: mysqlUser }),
    };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));
    expect(current().emailNotVerified).toBe(true);

    // User clicks "I verified" => refreshVerification calls authService.refreshVerification then syncSession
    const verifiedFirebaseUser = { ...firebaseUser, emailVerified: true };
    auth.service.refreshVerification.mockResolvedValueOnce(verifiedFirebaseUser);
    const result = await callInAct(() => current().refreshVerification());

    expect(result).toMatchObject({ id: 'mysql-user-id' });
    expect(current().hasAppSession).toBe(true);
    expect(current().emailNotVerified).toBe(false);
  });

  it('12 & 13: deduplicates in-flight syncs and supports logout then Google login cleanly', async () => {
    localStorage.setItem('finx-existing-results', '[{"id":"keep"}]');
    const auth = createAuthService(null);
    let resolveSync;
    const apiClient = {
      syncSession: vi.fn((user) => {
        if (user.uid === 'firebase-uid') {
          return new Promise((resolve) => { resolveSync = resolve; });
        }
        return Promise.resolve({ user: googleMysqlUser });
      }),
    };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    // Two simultaneous operations for same user => 1 sync call
    auth.service.login.mockResolvedValue(firebaseUser);
    let p1, p2;
    act(() => {
      p1 = current().login('a@b.com', 'p');
      p2 = current().login('a@b.com', 'p');
    });

    await waitFor(() => expect(apiClient.syncSession).toHaveBeenCalled());
    await act(async () => {
      resolveSync({ user: mysqlUser });
      await Promise.all([p1, p2]);
    });
    expect(apiClient.syncSession).toHaveBeenCalledTimes(1);

    // Logout
    auth.service.logout.mockResolvedValueOnce();
    await callInAct(() => current().logout());
    expect(current().user).toBeNull();
    expect(current().firebaseUser).toBeNull();
    expect(current().hasAppSession).toBe(false);

    // Google Login after logout
    auth.service.loginWithGoogle.mockResolvedValueOnce(googleFirebaseUser);
    const googleResult = await callInAct(() => current().loginWithGoogle());
    expect(googleResult).toMatchObject({ id: 'mysql-google-id' });
    expect(current().hasAppSession).toBe(true);
  });

  it('15: never stores passwords or tokens in localStorage', async () => {
    const auth = createAuthService(firebaseUser);
    const apiClient = { syncSession: vi.fn().mockResolvedValue({ user: mysqlUser }) };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));
    expect(storageDump()).not.toContain('secret-id-token');
    expect(storageDump()).not.toContain('password');
  });

  it('persists only the onboarding flag inside the MySQL user scope', async () => {
    localStorage.setItem('finx-mock-1pi53az-results', '[{"id":"legacy"}]');
    const auth = createAuthService(firebaseUser);
    const apiClient = { syncSession: vi.fn().mockResolvedValue({ user: mysqlUser }) };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().user?.id).toBe('mysql-user-id'));
    act(() => current().completeOnboarding());
    expect(localStorage.getItem('finx-mysql-user-id-auth-profile')).toContain('onboarded');
    expect(localStorage.getItem('finx-mysql-user-id-results')).toContain('legacy');
    expect(localStorage.getItem('finx-mock-1pi53az-results')).toContain('legacy');
    expect(localStorage.getItem('finx-user-1-auth-profile')).toBeNull();
    expect(localStorage.getItem('finx-user@example.com-auth-profile')).toBeNull();
  });

  it('handles backend 500 error on login and sets authError without clearing firebaseUser', async () => {
    const auth = createAuthService(null);
    const serverError = new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
    const apiClient = { syncSession: vi.fn().mockRejectedValue(serverError) };
    auth.service.login.mockResolvedValueOnce(firebaseUser);
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    let threw = false;
    try {
      await callInAct(() => current().login('user@example.com', 'password'));
    } catch (err) {
      threw = true;
      expect(err.status).toBe(500);
    }
    expect(threw).toBe(true);
    expect(current().user).toBeNull();
    expect(current().authError).toBeDefined();
    expect(current().authError.status).toBe(500);
  });

  it('preserves an existing app session when backend sync temporarily returns 500', async () => {
    const auth = createAuthService(firebaseUser);
    const serverError = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Database unavailable');
    const apiClient = {
      syncSession: vi.fn()
        .mockResolvedValueOnce({ user: mysqlUser })
        .mockRejectedValueOnce(serverError),
    };
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().user?.id).toBe('mysql-user-id'));

    await auth.emit(firebaseUser);
    await waitFor(() => expect(current().authError?.status).toBe(503));

    expect(current().isAuthenticated).toBe(true);
    expect(current().hasAppSession).toBe(true);
    expect(current().user?.id).toBe('mysql-user-id');
  });

  it('handles network error (TypeError) on Google login gracefully', async () => {
    const auth = createAuthService(null);
    const networkError = new TypeError('Failed to fetch');
    const apiClient = { syncSession: vi.fn().mockRejectedValue(networkError) };
    auth.service.loginWithGoogle.mockResolvedValueOnce(googleFirebaseUser);
    const current = renderAuth(auth.service, apiClient);
    await waitFor(() => expect(current().isInitializing).toBe(false));

    let threw = false;
    try {
      await callInAct(() => current().loginWithGoogle());
    } catch (err) {
      threw = true;
      expect(err.name).toBe('TypeError');
    }
    expect(threw).toBe(true);
    expect(current().user).toBeNull();
  });
});
