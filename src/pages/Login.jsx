import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../components/ui/Input';
import AuthVisual from '../components/ui/AuthVisual';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { requestedPath, safeProtectedDestination } from '../utils/routeGuards';
import { safeAuthErrorKey } from '../services/firebaseAuth';

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.19c0-.72-.06-1.41-.18-2.08H12v3.94h5.24a4.48 4.48 0 0 1-1.94 2.94v2.55h3.15c1.84-1.69 2.9-4.19 2.9-7.35Z" />
      <path fill="#34A853" d="M12 21.7c2.62 0 4.82-.87 6.43-2.36l-3.15-2.55c-.87.58-1.99.93-3.28.93-2.53 0-4.67-1.71-5.44-4.01H3.31v2.64A9.71 9.71 0 0 0 12 21.7Z" />
      <path fill="#FBBC05" d="M6.56 13.71A5.8 5.8 0 0 1 6.25 12c0-.59.11-1.16.31-1.71V7.65H3.31A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.04 1.01 4.35l3.25-2.64Z" />
      <path fill="#EA4335" d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.81 3.36 14.62 2.3 12 2.3a9.71 9.71 0 0 0-8.69 5.35l3.25 2.64c.77-2.3 2.91-4.01 5.44-4.01Z" />
    </svg>
  );
}

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
  const [rememberMe, setRememberMe] = useState(true);
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
      if (!user) return;
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
    <div className="auth-layout auth-layout--login">
      <section className="auth-form-side auth-form-side--premium page-enter">
        <header className="auth-header auth-header--premium">
          <Link to="/" className="auth-back-link auth-back-link--premium">
            <ArrowIcon size={17} />
            <span>{language === 'ar' ? 'العودة إلى الرئيسية' : 'Back to home'}</span>
          </Link>

          <Link to="/" className="auth-brand auth-brand--premium" aria-label={t.common.appName}>
            <span className="auth-brand__wordmark" lang="en">Fin<span>X</span></span>
            <span className="auth-brand__mark" lang="en">FX</span>
          </Link>
        </header>

        <div className="auth-content-wrapper auth-content-wrapper--premium">
          <main className="auth-content auth-content--premium">
            <div className="auth-heading-block">
              <h1 className="auth-title auth-title--premium">{t.auth.loginTitle}</h1>
              <p className="auth-subtitle auth-subtitle--premium">{t.auth.loginSubtitle}</p>
            </div>

            <button
              type="button"
              className="auth-google-button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <GoogleIcon />
              <span>{t.auth.googleLogin}</span>
            </button>

            <div className="auth-divider auth-divider--premium">
              <span>{t.common.or}</span>
            </div>

            <form className="auth-form auth-form--premium" onSubmit={handleSubmit}>
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
                required={false}
                wrapperClassName="auth-field"
              />

              <div className="password-input-wrapper auth-password-field">
                <Input
                  label={t.auth.password}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  icon={Lock}
                  error={formErrors.password}
                  disabled={isLoading}
                  dir="ltr"
                  required={false}
                  wrapperClassName="auth-field"
                />
                <button
                  type="button"
                  className="password-toggle password-toggle--premium"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="auth-options-row">
                <Link to="/forgot-password" state={{ from: location.state?.from }} className="auth-link auth-link--premium">
                  {t.auth.forgotPassword}
                </Link>

                <label className="auth-checkbox-group auth-checkbox-group--premium">
                  <span className="auth-checkbox-label">{t.auth.rememberMe}</span>
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </label>
              </div>

              <button type="submit" className="auth-submit-button" disabled={isLoading}>
                <span>{isLoading ? (language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : t.auth.loginBtn}</span>
                {!isLoading && <ArrowLeft size={18} />}
              </button>
            </form>

            <p className="auth-account-switch">
              <span>{t.auth.noAccount}</span>
              <Link to="/register" state={{ from: location.state?.from }} className="auth-link auth-link--premium">
                {t.auth.registerBtn}
              </Link>
            </p>
          </main>
        </div>

        <footer className="auth-footer auth-footer--premium">
          <span dir="ltr">© {new Date().getFullYear()} FinX</span>
          <nav aria-label={language === 'ar' ? 'روابط المساعدة' : 'Help links'}>
            <button type="button" onClick={() => navigate('/privacy')}>{language === 'ar' ? 'الخصوصية' : 'Privacy'}</button>
            <button type="button" onClick={() => navigate('/terms')}>{language === 'ar' ? 'الشروط' : 'Terms'}</button>
            <button type="button" onClick={() => navigate('/help')}>{language === 'ar' ? 'المساعدة' : 'Help'}</button>
          </nav>
        </footer>
      </section>

      <AuthVisual variant="login" />
    </div>
  );
}

export default Login;
