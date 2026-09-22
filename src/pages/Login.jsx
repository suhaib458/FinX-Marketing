import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthVisual from '../components/ui/AuthVisual';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowLeft, ArrowRight } from 'lucide-react';
import { requestedPath, safeProtectedDestination } from '../utils/routeGuards';
import { safeAuthErrorKey } from '../services/firebaseAuth';

function Login() {
  const { t, language } = useLanguage();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!email) errors.email = t.common.required;
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = t.auth.invalidEmail;
    if (!password) errors.password = t.common.required;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (!user) {
        navigate('/verify-email', { replace: true, state: { from: location.state?.from } });
        return;
      }
      success(t.toasts.loginSuccess);
      const requested = safeProtectedDestination(requestedPath(location.state?.from));
      if (user.onboarded) {
        navigate(requested, { replace: true });
      } else {
        navigate('/onboarding', { replace: true, state: { from: location.state?.from } });
      }
    } catch (authFailure) {
      if (import.meta.env.DEV) {
        console.error(`[AUTH_ERROR_STAGE=${authFailure?.stage || (authFailure?.code?.startsWith('auth/') ? 'firebase' : 'session')}]`, {
          code: authFailure?.code,
          message: authFailure?.message,
          status: authFailure?.status,
        });
      }
      error(t.auth.errors[safeAuthErrorKey(authFailure)] || t.auth.errors.unknownError);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (!user) {
        navigate('/verify-email', { replace: true, state: { from: location.state?.from } });
        return;
      }
      success(t.toasts.loginSuccess);
      const requested = safeProtectedDestination(requestedPath(location.state?.from));
      if (user.onboarded) {
        navigate(requested, { replace: true });
      } else {
        navigate('/onboarding', { replace: true, state: { from: location.state?.from } });
      }
    } catch (authFailure) {
      if (import.meta.env.DEV) {
        console.error(`[AUTH_ERROR_STAGE=${authFailure?.stage || (authFailure?.code?.startsWith('auth/') ? 'firebase' : 'session')}]`, {
          code: authFailure?.code,
          message: authFailure?.message,
          status: authFailure?.status,
        });
      }
      error(t.auth.errors[safeAuthErrorKey(authFailure)] || t.auth.errors.unknownError);
    }
  };

  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <AuthVisual />

      {/* Form Side */}
      <div className="auth-form-side page-enter">
        <header className="auth-header">
          <Link to="/" className="brand-logo" aria-label={t.common.appName}>
            <div className="brand-logo__mark" lang="en">FX</div>
            <span className="brand-logo__text" lang="en">FinX</span>
          </Link>
          <Link to="/" className="auth-back-link">
            <ArrowIcon size={16} />
            <span>{t.nav.home || 'الرئيسية'}</span>
          </Link>
        </header>

        <div className="auth-content-wrapper">
          <main className="auth-content">
            <h1 className="auth-title">{t.auth.loginTitle}</h1>
            <p className="auth-subtitle">{t.auth.loginSubtitle}</p>

            <Button 
              variant="outline" 
              fullWidth 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
            <svg style={{ width: 18, height: 18, marginInlineEnd: 8 }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t.auth.googleLogin}
          </Button>

          <div className="auth-divider">
            <span>{t.common.or}</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label={t.auth.email}
              type="email"
              lang="en"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              icon={Mail}
              error={formErrors.email}
              disabled={isLoading}
              dir="ltr"
            />

            <div className="password-input-wrapper">
              <Input
                label={t.auth.password}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                icon={Lock}
                error={formErrors.password}
                disabled={isLoading}
                dir="ltr"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
              <label className="auth-checkbox-group">
                <input type="checkbox" className="auth-checkbox" />
                <span className="auth-checkbox-label">{t.auth.rememberMe}</span>
              </label>
              <Link to="/forgot-password" state={{ from: location.state?.from }} className="auth-link" style={{ fontSize: 'var(--text-sm)' }}>
                {t.auth.forgotPassword}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              icon={LogIn}
              style={{ marginTop: 'var(--space-4)' }}
            >
              {t.auth.loginBtn}
            </Button>
          </form>

            <p style={{ textAlign: 'center', marginTop: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{t.auth.noAccount}</span>{' '}
              <Link to="/register" state={{ from: location.state?.from }} className="auth-link">
                {t.auth.registerBtn}
              </Link>
            </p>
          </main>
        </div>

        <footer className="auth-footer">
          &copy; {new Date().getFullYear()} FinX.
        </footer>
      </div>
    </div>
  );
}

export default Login;
