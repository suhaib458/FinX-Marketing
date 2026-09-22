import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Globe, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import { useState, useEffect } from 'react';

function PublicLayout() {
  const { toggleTheme, isDark } = useTheme();
  const { toggleLanguage, t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearToasts } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Clear toasts on route change
  useEffect(() => {
    if (clearToasts) clearToasts();
  }, [location.pathname, clearToasts]);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  }, [location.hash]);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="public-layout">
      <header className={`public-layout__header ${scrolled ? 'public-layout__header--scrolled' : ''}`}>
        <div className="public-layout__header-container">
          <Link to="/" className="brand-logo brand-logo--landing" aria-label={t.common.appName}>
            <span className="brand-logo__wordmark" lang="en">Fin<span>X</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="public-layout__nav hide-on-mobile">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="public-layout__nav-link">
              {t.nav.features}
            </a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="public-layout__nav-link">
              {t.nav.howItWorks}
            </a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="public-layout__nav-link">
              {t.nav.pricing}
            </a>
          </nav>

          <div className="header-actions hide-on-mobile">
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              icon={isDark ? Sun : Moon}
              onClick={toggleTheme}
              aria-label={t.theme.toggle}
              title={t.theme.toggle}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={Globe}
              onClick={toggleLanguage}
              aria-label={t.language.toggle}
              title={t.language.toggle}
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </Button>

            {isAuthenticated ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/app')}
              >
                {t.nav.dashboard}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  {t.nav.login}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  {t.nav.register}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="show-on-mobile">
            <Button
              variant="ghost"
              isIconOnly
              icon={mobileMenuOpen ? X : Menu}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="public-layout__mobile-menu">
          <nav className="public-layout__mobile-nav">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="public-layout__mobile-link">
              {t.nav.features}
            </a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="public-layout__mobile-link">
              {t.nav.howItWorks}
            </a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="public-layout__mobile-link">
              {t.nav.pricing}
            </a>
          </nav>
          <div className="public-layout__mobile-actions">
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <Button variant="secondary" fullWidth icon={isDark ? Sun : Moon} onClick={toggleTheme}>
                {t.theme.toggle}
              </Button>
              <Button variant="secondary" fullWidth icon={Globe} onClick={toggleLanguage}>
                {language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>
            {isAuthenticated ? (
              <Button variant="primary" fullWidth onClick={() => navigate('/app')}>
                {t.nav.dashboard}
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>
                  {t.nav.login}
                </Button>
                <Button variant="primary" fullWidth onClick={() => navigate('/register')}>
                  {t.nav.register}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="public-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
