import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sun, Moon, Globe, Menu, X, Sparkles, Settings,
  BookOpen, UserRound, ArrowRight, ChevronDown
} from 'lucide-react';
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
  const isLandingPage = location.pathname === '/';

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
      <header className={`public-layout__header ${isLandingPage ? 'public-layout__header--landing' : ''} ${scrolled ? 'public-layout__header--scrolled' : ''}`}>
        <div className={`public-layout__header-container ${isLandingPage ? 'landing-nav-shell' : ''}`}>
          <Link to="/" className="brand-logo brand-logo--landing" aria-label={t.common.appName}>
            <span className="brand-logo__wordmark" lang="en">Fin<span>X</span></span>
          </Link>

          {isLandingPage ? (
            <>
              <span className="landing-nav-divider hide-on-mobile" aria-hidden="true" />

              <button
                type="button"
                className="landing-nav-language hide-on-mobile"
                onClick={toggleLanguage}
                aria-label={t.language.toggle}
                title={t.language.toggle}
              >
                <Globe size={15} />
                <span lang="en">{language === 'ar' ? 'EN' : 'AR'}</span>
                <ChevronDown size={12} />
              </button>

              <nav className="landing-nav-links hide-on-mobile" aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
                <button
                  type="button"
                  className="landing-nav-link"
                  onClick={() => navigate('/blog')}
                >
                  <span>{language === 'ar' ? 'المدونة' : 'Blog'}</span>
                  <BookOpen size={15} />
                </button>

                <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="landing-nav-link">
                  <span>{t.nav.howItWorks}</span>
                  <Settings size={15} />
                </a>

                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="landing-nav-link">
                  <span>{t.nav.features}</span>
                  <Sparkles size={15} />
                </a>
              </nav>

              <div className="landing-nav-actions hide-on-mobile">
                {isAuthenticated ? (
                  <button type="button" className="landing-nav-login" onClick={() => navigate('/app')}>
                    <span>{t.nav.dashboard}</span>
                    <UserRound size={16} />
                  </button>
                ) : (
                  <button type="button" className="landing-nav-login" onClick={() => navigate('/login')}>
                    <span>{t.nav.login}</span>
                    <UserRound size={16} />
                  </button>
                )}

                {!isAuthenticated && (
                  <button type="button" className="landing-nav-cta" onClick={() => navigate('/register')}>
                    <span>{language === 'ar' ? 'ابدأ مجانًا' : 'Start free'}</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <nav className="public-layout__nav hide-on-mobile">
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="public-layout__nav-link">
                  {t.nav.features}
                </a>
                <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="public-layout__nav-link">
                  {t.nav.howItWorks}
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
                  <Button variant="secondary" size="sm" onClick={() => navigate('/app')}>
                    {t.nav.dashboard}
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                      {t.nav.login}
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                      {t.nav.register}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

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
        isLandingPage ? (
          <div className="public-layout__mobile-menu landing-mobile-menu">
            <nav className="landing-mobile-menu__nav">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="landing-mobile-menu__link">
                <Sparkles size={16} />
                <span>{t.nav.features}</span>
              </a>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="landing-mobile-menu__link">
                <Settings size={16} />
                <span>{t.nav.howItWorks}</span>
              </a>
              <button
                type="button"
                className="landing-mobile-menu__link"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/blog');
                }}
              >
                <BookOpen size={16} />
                <span>{language === 'ar' ? 'المدونة' : 'Blog'}</span>
              </button>
            </nav>

            <div className="landing-mobile-menu__divider" />

            <button
              type="button"
              className="landing-mobile-menu__utility"
              onClick={toggleLanguage}
            >
              <Globe size={16} />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <div className="landing-mobile-menu__auth">
              {isAuthenticated ? (
                <button
                  type="button"
                  className="landing-mobile-menu__primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/app');
                  }}
                >
                  <span>{t.nav.dashboard}</span>
                  <UserRound size={16} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="landing-mobile-menu__secondary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    <span>{t.nav.login}</span>
                    <UserRound size={16} />
                  </button>
                  <button
                    type="button"
                    className="landing-mobile-menu__primary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/register');
                    }}
                  >
                    <span>{language === 'ar' ? 'ابدأ مجانًا' : 'Start free'}</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="public-layout__mobile-menu">
            <nav className="public-layout__mobile-nav">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="public-layout__mobile-link">
                {t.nav.features}
              </a>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="public-layout__mobile-link">
                {t.nav.howItWorks}
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
        )
      )}

      <main className="public-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
