import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../components/ui/Input';
import AuthVisual from '../components/ui/AuthVisual';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { safeAuthErrorKey } from '../services/firebaseAuth';
import { requestedPath, safeProtectedDestination } from '../utils/routeGuards';
import { validateRegistration } from '../utils/authValidation';

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

function Register() {
  const { t, language } = useLanguage();
  const { register, loginWithGoogle, isLoading } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = validateRegistration(
      { name, email, password, confirmPassword, agreed },
      {
        required: t.common.required,
        invalidEmail: t.auth.invalidEmail,
        passwordMinLength: t.auth.passwordMinLength,
        passwordsNotMatch: t.auth.passwordsNotMatch,
      },
    );
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      success(t.toasts.registerSuccess);
      navigate('/verify-email', { state: { from: location.state?.from } });
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

  const handleGoogleRegister = async () => {
    try {
      const user = await loginWithGoogle();
      if (!user) {
        navigate('/verify-email', { replace: true, state: { from: location.state?.from } });
        return;
      }
      success(t.toasts.registerSuccess);
      const requested = safeProtectedDestination(requestedPath(location.state?.from));
      navigate(user?.onboarded ? requested : '/onboarding', { replace: true, state: { from: location.state?.from } });
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

  const showLegalInfo = (event) => {
    event.preventDefault();
    info(t.toasts.legalUnavailable);
  };

  return (
    <div className="auth-layout auth-layout--login auth-layout--register">
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

        <div className="auth-content-wrapper auth-content-wrapper--premium auth-content-wrapper--register">
          <main className="auth-content auth-content--premium">
            <div className="auth-heading-block auth-heading-block--register">
              <h1 className="auth-title auth-title--premium">{t.auth.registerTitle}</h1>
              <p className="auth-subtitle auth-subtitle--premium">{t.auth.registerSubtitle}</p>
            </div>

            <button
              type="button"
              className="auth-google-button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
            >
              <GoogleIcon />
              <span>{t.auth.googleLogin}</span>
            </button>

            <div className="auth-divider auth-divider--premium">
              <span>{t.common.or}</span>
            </div>

            <form className="auth-form auth-form--premium auth-form--register" onSubmit={handleSubmit}>
              <Input
                label={t.auth.fullName}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.auth.fullNamePlaceholder}
                icon={User}
                error={formErrors.name}
                disabled={isLoading}
                required
                wrapperClassName="auth-field"
              />

              <Input
                label={t.auth.email}
                type="email"
                lang="en"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.auth.emailPlaceholder}
                icon={Mail}
                error={formErrors.email}
                disabled={isLoading}
                required
                wrapperClassName="auth-field"
              />

              <div className="password-input-wrapper auth-password-field">
                <Input
                  label={t.auth.password}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  icon={Lock}
                  error={formErrors.password}
                  disabled={isLoading}
                  dir="ltr"
                  required
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

              <div className="password-input-wrapper auth-password-field">
                <Input
                  label={t.auth.confirmPassword}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  icon={Lock}
                  error={formErrors.confirmPassword}
                  disabled={isLoading}
                  dir="ltr"
                  required
                  wrapperClassName="auth-field"
                />
                <button
                  type="button"
                  className="password-toggle password-toggle--premium"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="auth-terms-block">
                <label className="auth-terms-row">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    disabled={isLoading}
                  />
                  <span>
                    {t.auth.termsAgree}{' '}
                    <button type="button" className="auth-link auth-link--button" onClick={showLegalInfo}>{t.auth.termsLink}</button>
                    {' '}{t.auth.and}{' '}
                    <button type="button" className="auth-link auth-link--button" onClick={showLegalInfo}>{t.auth.privacyLink}</button>
                  </span>
                </label>
                {formErrors.agreed && <div className="auth-terms-error">{formErrors.agreed}</div>}
              </div>

              <button type="submit" className="auth-submit-button" disabled={isLoading}>
                <span>{isLoading ? (language === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Creating account...') : t.auth.registerBtn}</span>
                {!isLoading && <ArrowLeft size={18} />}
              </button>
            </form>

            <p className="auth-account-switch auth-account-switch--register">
              <span>{t.auth.hasAccount}</span>
              <Link to="/login" state={{ from: location.state?.from }} className="auth-link auth-link--premium">
                {t.auth.loginBtn}
              </Link>
            </p>
          </main>
        </div>

        <footer className="auth-footer auth-footer--premium auth-footer--register">
          <span dir="ltr">© {new Date().getFullYear()} FinX</span>
          <nav aria-label={language === 'ar' ? 'روابط المساعدة' : 'Help links'}>
            <button type="button" onClick={() => info(t.toasts.legalUnavailable)}>{language === 'ar' ? 'الخصوصية' : 'Privacy'}</button>
            <button type="button" onClick={() => info(t.toasts.legalUnavailable)}>{language === 'ar' ? 'الشروط' : 'Terms'}</button>
            <button type="button" onClick={() => info(t.toasts.featureUnavailable)}>{language === 'ar' ? 'المساعدة' : 'Help'}</button>
          </nav>
        </footer>
      </section>

      <AuthVisual variant="register" />
    </div>
  );
}

export default Register;
