import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  MessageSquare, 
  Palette, 
  Lightbulb, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Globe2, 
  Zap, 
  BarChart, 
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TikTokIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
  </svg>
);

function Landing() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { info } = useToast();

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="landing-page">
      {/* ─── Hero Section ─── */}
      <section className="landing-hero">
        <div className="landing-hero__content">
          <Badge variant="success" style={{ marginBottom: 'var(--space-6)' }}>
            <Sparkles size={14} style={{ marginInlineEnd: '4px' }} />
            {t.landing.noCreditCard}
          </Badge>
          <h1 className="landing-hero__title">
            {t.landing.heroTitle}
          </h1>
          <p className="landing-hero__subtitle">
            {t.landing.heroSubtitle}
          </p>
          <div className="landing-hero__actions">
            <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
              {t.landing.heroPrimaryCta}
            </Button>
            <Button variant="outline" size="lg" href="#how-it-works">
              {t.landing.heroSecondaryCta}
            </Button>
          </div>
          <div className="landing-hero__trust" style={{ marginTop: 'var(--space-6)' }}>
            <ShieldCheck size={16} />
            <span>{t.landing.noCreditCard}</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual__bg-glow"></div>
          
          {/* Main Mock Interface */}
          <div className="hero-visual__card hero-visual__main">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div className="brand-logo__mark" lang="en" style={{ width: 24, height: 24, fontSize: 10 }}>FX</div>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>FinX AI</span>
            </div>
            
            <div style={{ background: 'var(--color-background)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <Badge variant="primary"><span lang="en">Instagram</span></Badge>
                <Badge variant="secondary"><span lang="en">Facebook</span></Badge>
              </div>
              <div style={{ height: '4px', width: '60%', background: 'var(--color-border)', borderRadius: '2px', marginBottom: '8px' }}></div>
              <div style={{ height: '4px', width: '40%', background: 'var(--color-border)', borderRadius: '2px' }}></div>
            </div>

            <Button variant="primary" fullWidth size="sm" style={{ pointerEvents: 'none' }}>
              <Sparkles size={14} style={{ marginInlineEnd: '4px' }} />
              {t.generation.generate}
            </Button>
          </div>

          {/* Floating Ad Design */}
          <div className="hero-visual__card hero-visual__floating-1">
            <div style={{ width: '100%', aspectRatio: '1', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={24} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div style={{ height: '4px', width: '80%', background: 'var(--color-border)', borderRadius: '2px', marginBottom: '6px' }}></div>
            <div style={{ height: '4px', width: '50%', background: 'var(--color-border)', borderRadius: '2px' }}></div>
          </div>

          {/* Floating Caption */}
          <div className="hero-visual__card hero-visual__floating-2">
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-accent)' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '4px', width: '100%', background: 'var(--color-border)', borderRadius: '2px', marginBottom: '4px', marginTop: '4px' }}></div>
                <div style={{ height: '4px', width: '60%', background: 'var(--color-border)', borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ─── */}
      <section className="trust-strip">
        <h3 className="trust-strip__title">{t.landing.trustStrip}</h3>
        <div className="trust-strip__logos">
          <div className="trust-strip__logo">
            <InstagramIcon size={24} />
            <span lang="en">Instagram</span>
          </div>
          <div className="trust-strip__logo">
            <FacebookIcon size={24} />
            <span lang="en">Facebook</span>
          </div>
          <div className="trust-strip__logo">
            <TikTokIcon size={24} />
            <span lang="en">TikTok</span>
          </div>
        </div>
      </section>

      {/* ─── Tools Section ─── */}
      <section id="features" className="section">
        <div className="section__header">
          <h2 className="section__title">{t.landing.toolsTitle}</h2>
        </div>
        <div className="tools-grid">
          <div className="tool-card fx-card">
            <div className="tool-card__icon"><MessageSquare size={28} /></div>
            <h3 className="tool-card__title">{t.landing.tool1Title}</h3>
            <p className="tool-card__desc">{t.landing.tool1Desc}</p>
          </div>
          <div className="tool-card fx-card">
            <div className="tool-card__icon" style={{ color: 'var(--tool-ad)', background: 'color-mix(in srgb, var(--tool-ad) 12%, transparent)' }}>
              <Palette size={28} />
            </div>
            <h3 className="tool-card__title">{t.landing.tool2Title}</h3>
            <p className="tool-card__desc">{t.landing.tool2Desc}</p>
          </div>
          <div className="tool-card fx-card">
            <div className="tool-card__icon" style={{ color: 'var(--tool-ideas)', background: 'color-mix(in srgb, var(--tool-ideas) 12%, transparent)' }}>
              <Lightbulb size={28} />
            </div>
            <h3 className="tool-card__title">{t.landing.tool3Title}</h3>
            <p className="tool-card__desc">{t.landing.tool3Desc}</p>
          </div>
          <div className="tool-card fx-card">
            <div className="tool-card__icon" style={{ color: 'var(--tool-campaign)', background: 'color-mix(in srgb, var(--tool-campaign) 12%, transparent)' }}>
              <Calendar size={28} />
            </div>
            <h3 className="tool-card__title">{t.landing.tool4Title}</h3>
            <p className="tool-card__desc">{t.landing.tool4Desc}</p>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="section" style={{ background: 'rgba(var(--color-surface-rgb), 0.3)' }}>
        <div className="section__header">
          <h2 className="section__title">{t.landing.howItWorksTitle}</h2>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step__number">1</div>
            <h3 className="step__title">{t.landing.step1}</h3>
          </div>
          <div className="step">
            <div className="step__number">2</div>
            <h3 className="step__title">{t.landing.step2}</h3>
          </div>
          <div className="step">
            <div className="step__number">3</div>
            <h3 className="step__title">{t.landing.step3}</h3>
          </div>
        </div>
      </section>

      {/* ─── Audience Section ─── */}
      <section className="section">
        <div className="section__header">
          <h2 className="section__title">{t.landing.audienceTitle}</h2>
        </div>
        <div className="audience-grid">
          <Card variant="glass" className="tool-card" style={{ padding: 'var(--space-8)' }}>
            <h3 className="tool-card__title" style={{ marginBottom: 'var(--space-2)' }}>{t.landing.audience1}</h3>
            <p className="tool-card__desc">{t.landing.audience1Desc}</p>
          </Card>
          <Card variant="glass" className="tool-card" style={{ padding: 'var(--space-8)' }}>
            <h3 className="tool-card__title" style={{ marginBottom: 'var(--space-2)' }}>{t.landing.audience2}</h3>
            <p className="tool-card__desc">{t.landing.audience2Desc}</p>
          </Card>
          <Card variant="glass" className="tool-card" style={{ padding: 'var(--space-8)' }}>
            <h3 className="tool-card__title" style={{ marginBottom: 'var(--space-2)' }}>{t.landing.audience3}</h3>
            <p className="tool-card__desc">{t.landing.audience3Desc}</p>
          </Card>
        </div>
      </section>

      {/* ─── Benefits Section ─── */}
      <section className="section" style={{ background: 'rgba(var(--color-surface-rgb), 0.3)' }}>
        <div className="section__header">
          <h2 className="section__title">{t.landing.benefitsTitle}</h2>
        </div>
        <div className="benefits-grid">
          {[
            { icon: Clock, text: t.landing.benefit1 },
            { icon: ShieldCheck, text: t.landing.benefit2 },
            { icon: Globe2, text: t.landing.benefit3 },
            { icon: Zap, text: t.landing.benefit4 },
            { icon: ImageIcon, text: t.landing.benefit5 },
            { icon: BarChart, text: t.landing.benefit6 },
          ].map((benefit, i) => (
            <div key={i} className="benefit-item">
              <div style={{ color: 'var(--color-accent)', background: 'rgba(var(--color-accent-rgb), 0.1)', padding: '8px', borderRadius: '8px' }}>
                <benefit.icon size={20} />
              </div>
              <span style={{ fontWeight: 'var(--font-medium)' }}>{benefit.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="section">
        <div className="section__header">
          <h2 className="section__title">{t.landing.pricingTitle}</h2>
        </div>
        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="pricing-card fx-card fx-card--quiet">
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{t.plans.free.name}</h3>
            <div className="pricing-card__price">
              {t.plans.free.price} <span className="pricing-card__currency">{t.common.jod}</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>{t.plans.free.period}</p>
            <ul className="pricing-card__features">
              {t.plans.free.features.map((f, i) => (
                <li key={i} className="pricing-card__feature">
                  <CheckCircle2 size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 'auto' }}>
              <Button variant="outline" fullWidth onClick={() => navigate('/register')}>{t.nav.register}</Button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="pricing-card pricing-card--popular fx-card fx-card--selected">
            <div className="pricing-card__badge">{t.landing.popular}</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-accent)' }}>{t.plans.pro.name}</h3>
            <div className="pricing-card__price">
              {t.plans.pro.price} <span className="pricing-card__currency">{t.common.jod}</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>{t.plans.pro.period}</p>
            <ul className="pricing-card__features">
              {t.plans.pro.features.map((f, i) => (
                <li key={i} className="pricing-card__feature">
                  <CheckCircle2 size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 'auto' }}>
              <Button variant="primary" fullWidth onClick={() => navigate('/register')}>{t.nav.register}</Button>
            </div>
          </div>

          {/* Business Plan */}
          <div className="pricing-card fx-card fx-card--quiet">
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{t.plans.business.name}</h3>
            <div className="pricing-card__price">
              {t.plans.business.price} <span className="pricing-card__currency">{t.common.jod}</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>{t.plans.business.period}</p>
            <ul className="pricing-card__features">
              {t.plans.business.features.map((f, i) => (
                <li key={i} className="pricing-card__feature">
                  <CheckCircle2 size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 'auto' }}>
              <Button variant="outline" fullWidth onClick={() => navigate('/register')}>{t.nav.register}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="final-cta">
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 'bold', marginBottom: 'var(--space-8)' }}>
          {t.landing.finalCtaTitle}
        </h2>
        <Button variant="primary" size="lg" onClick={() => navigate('/register')} style={{ background: 'white', color: 'var(--color-accent)', fontWeight: 'bold' }}>
          {t.landing.finalCtaBtn} <ArrowIcon size={20} style={{ marginInlineStart: '8px' }} />
        </Button>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="footer__content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="brand-logo__mark" lang="en" style={{ width: 32, height: 32, fontSize: 14 }}>FX</div>
            <span lang="en" style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>FinX</span>
          </div>
          
          <div className="footer__links">
            <a href="#features" className="footer__link">{t.nav.features}</a>
            <a href="#pricing" className="footer__link">{t.nav.pricing}</a>
            <button type="button" className="footer__link footer__link--button" onClick={() => info(t.toasts.legalUnavailable)}>{t.auth.termsLink}</button>
            <button type="button" className="footer__link footer__link--button" onClick={() => info(t.toasts.legalUnavailable)}>{t.auth.privacyLink}</button>
          </div>
          
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            &copy; {new Date().getFullYear()} FinX. {t.landing.footerRights}.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
