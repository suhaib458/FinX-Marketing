import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import AuthVisual from '../components/ui/AuthVisual';
import { requestedPath, safeProtectedDestination } from '../utils/routeGuards';
import { safeAuthErrorKey } from '../services/firebaseAuth';

const RESEND_SECONDS = 60;

export function maskEmail(email) {
  const [local = '', domain = ''] = String(email || '').split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return domain ? `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}` : '';
}

export default function VerifyEmail() {
  const { t } = useLanguage();
  const { firebaseUser, user, emailNotVerified, isInitializing, isLoading, authError,
    resendVerification, refreshVerification, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (isInitializing) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}><div className="fx-spinner fx-spinner--lg" /></div>;
  }
  if (!firebaseUser) return <Navigate to="/login" state={{ from: location.state?.from }} replace />;
  if (user) {
    const requested = safeProtectedDestination(requestedPath(location.state?.from));
    return <Navigate to={user.onboarded ? requested : '/onboarding'} state={{ from: location.state?.from }} replace />;
  }

  const resend = async () => {
    try {
      await resendVerification();
      setCooldown(RESEND_SECONDS);
      success(t.auth.verificationSent);
    } catch (resendError) {
      error(t.auth.errors[safeAuthErrorKey(resendError)] || t.auth.errors.unknownError);
    }
  };

  const refresh = async () => {
    try {
      const nextUser = await refreshVerification();
      if (!nextUser) {
        error(t.auth.notVerifiedYet);
        return;
      }
      const requested = safeProtectedDestination(requestedPath(location.state?.from));
      navigate(nextUser.onboarded ? requested : '/onboarding', { replace: true, state: { from: location.state?.from } });
    } catch {
      error(t.auth.sessionSyncFailed);
    }
  };

  const signOutNow = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isUnverifiedState = emailNotVerified || (!user && !authError);
  const isGoogleProvider = Boolean(firebaseUser?.providerData?.some(
    (provider) => provider?.providerId === 'google.com',
  ));
  const shouldVerifyEmail = isUnverifiedState && !isGoogleProvider;

  return (
    <div className="auth-layout">
      <AuthVisual />
      <div className="auth-form-side page-enter">
        <div className="auth-content-wrapper">
          <main className="auth-content">
            <MailCheck size={48} style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }} />
            <h1 className="auth-title">{shouldVerifyEmail ? t.auth.verifyTitle : t.auth.syncTitle}</h1>
            <p className="auth-subtitle">
              {shouldVerifyEmail ? t.auth.verifySubtitle : t.auth.syncSubtitle}
            </p>
            <p dir="ltr" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>{maskEmail(firebaseUser.email)}</p>
            {authError && <p className="auth-status-notice" role="alert">{t.auth.sessionSyncFailed}</p>}
            <Button fullWidth onClick={refresh} isLoading={isLoading} icon={RefreshCw}>
              {shouldVerifyEmail ? t.auth.iVerified : t.auth.retrySession}
            </Button>
            {shouldVerifyEmail && (
              <Button variant="outline" fullWidth onClick={resend} disabled={isLoading || cooldown > 0}
                style={{ marginTop: 'var(--space-3)' }}>
                {cooldown > 0 ? `${t.auth.resendIn} ${cooldown}` : t.auth.resendVerification}
              </Button>
            )}
            <Button variant="ghost" fullWidth onClick={signOutNow} disabled={isLoading} icon={LogOut}
              style={{ marginTop: 'var(--space-3)' }}>{t.nav.logout}</Button>
          </main>
        </div>
      </div>
    </div>
  );
}
