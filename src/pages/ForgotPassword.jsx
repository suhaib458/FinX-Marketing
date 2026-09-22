import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthVisual from '../components/ui/AuthVisual';

export default function ForgotPassword() {
  const { t, language } = useLanguage();
  const { resetPassword, isLoading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError(t.auth.invalidEmail);
      return;
    }
    setFieldError('');
    try {
      await resetPassword(email.trim().toLowerCase());
    } catch {
      // Keep the same response to avoid revealing whether an account exists.
    }
    setSubmitted(true);
  };

  return (
    <div className="auth-layout">
      <AuthVisual />
      <div className="auth-form-side page-enter">
        <header className="auth-header">
          <Link to="/" className="brand-logo" aria-label={t.common.appName}>
            <div className="brand-logo__mark" lang="en">FX</div>
            <span className="brand-logo__text" lang="en">FinX</span>
          </Link>
          <Link to="/login" state={{ from: location.state?.from }} className="auth-back-link">
            <ArrowIcon size={16} /> {t.auth.backToLogin}
          </Link>
        </header>
        <div className="auth-content-wrapper">
          <main className="auth-content">
            <h1 className="auth-title">{t.auth.forgotTitle}</h1>
            <p className="auth-subtitle">{submitted ? t.auth.resetGeneric : t.auth.forgotSubtitle}</p>
            {!submitted && (
              <form className="auth-form" onSubmit={handleSubmit}>
                <Input label={t.auth.email} type="email" value={email}
                  onChange={(event) => setEmail(event.target.value)} icon={Mail}
                  error={fieldError} disabled={isLoading} dir="ltr" required />
                <Button type="submit" fullWidth isLoading={isLoading}>{t.auth.sendReset}</Button>
              </form>
            )}
            {submitted && <Link className="auth-link" to="/login" state={{ from: location.state?.from }}>{t.auth.backToLogin}</Link>}
          </main>
        </div>
      </div>
    </div>
  );
}
