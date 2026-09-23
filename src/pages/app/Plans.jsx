import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Crown, ShieldCheck, Sparkles, Zap
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

const PLAN_KEYS = ['free', 'plus', 'pro'];

function Plans() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();

  const isArabic = language === 'ar';
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const currentPlan = user?.plan || 'free';

  const copy = useMemo(() => (isArabic ? {
    eyebrow: 'خطط FinX',
    title: 'اختر الخطة المناسبة لك',
    subtitle: 'خطط شهرية بسيطة وواضحة، وتقدر تبدأ مجاناً وتترقى لاحقاً.',
    monthly: 'اشتراك شهري',
    popular: 'الأكثر اختياراً',
    current: 'خطتك الحالية',
    choose: 'اختيار',
    back: 'العودة للإعدادات',
    freePrice: 'مجاني',
    billingNoteTitle: 'ملاحظة عن الدفع',
    billingNote: 'تم تجهيز صفحة الخطط وتجربة الترقية داخل FinX. ربط بوابة الدفع والتجديد التلقائي سيكون خطوة مستقلة قبل تفعيل الاشتراكات المدفوعة فعلياً.',
    comingSoon: 'واجهة الاشتراك جاهزة. بوابة الدفع الفعلية سيتم ربطها في الخطوة التالية.',
    currentToast: 'أنت تستخدم هذه الخطة حالياً.',
    currency: 'د.أ',
  } : {
    eyebrow: 'FinX Plans',
    title: 'Choose the plan that fits you',
    subtitle: 'Simple monthly plans. Start free and upgrade whenever you are ready.',
    monthly: 'Monthly subscription',
    popular: 'Most popular',
    current: 'Current plan',
    choose: 'Choose',
    back: 'Back to settings',
    freePrice: 'Free',
    billingNoteTitle: 'Payment note',
    billingNote: 'The plans page and upgrade experience are now built into FinX. Payment-gateway integration and automatic renewal will be connected separately before paid subscriptions are activated for real users.',
    comingSoon: 'The subscription UI is ready. The real payment gateway will be connected in the next step.',
    currentToast: 'You are already using this plan.',
    currency: 'JOD',
  }), [isArabic]);

  const handlePlan = (planKey) => {
    if (planKey === currentPlan) {
      info(copy.currentToast);
      return;
    }

    if (planKey === 'free') {
      info(copy.currentToast);
      return;
    }

    info(copy.comingSoon);
  };

  return (
    <div className="page-enter plans-page">
      <header className="plans-hero">
        <div>
          <span className="plans-eyebrow">
            <Sparkles size={15} />
            {copy.eyebrow}
          </span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={BackIcon}
          onClick={() => navigate('/app/settings')}
          className="plans-back-btn"
        >
          {copy.back}
        </Button>
      </header>

      <div className="plans-grid">
        {PLAN_KEYS.map((planKey) => {
          const plan = t.plans[planKey];
          const isCurrent = currentPlan === planKey;
          const isPopular = planKey === 'plus';
          const isPro = planKey === 'pro';

          return (
            <article
              key={planKey}
              className={[
                'plan-card',
                isPopular ? 'plan-card--popular' : '',
                isPro ? 'plan-card--pro' : '',
                isCurrent ? 'plan-card--current' : '',
              ].filter(Boolean).join(' ')}
            >
              {isPopular && (
                <div className="plan-card__ribbon">
                  <Crown size={14} />
                  {copy.popular}
                </div>
              )}

              <div className="plan-card__head">
                <div className="plan-card__icon" aria-hidden="true">
                  {planKey === 'free' ? <Zap size={22} /> : planKey === 'plus' ? <Sparkles size={22} /> : <Crown size={22} />}
                </div>
                <div>
                  <h2>{plan.name}</h2>
                  <span>{copy.monthly}</span>
                </div>
              </div>

              <div className="plan-card__price">
                {planKey === 'free' ? (
                  <strong>{copy.freePrice}</strong>
                ) : (
                  <>
                    <strong>{plan.price}</strong>
                    <span>{copy.currency}</span>
                    <small>/ {plan.period}</small>
                  </>
                )}
              </div>

              <div className="plan-card__divider" />

              <ul className="plan-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="plan-card__check"><Check size={14} /></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isPopular || isPro ? 'primary' : 'outline'}
                fullWidth
                disabled={isCurrent}
                onClick={() => handlePlan(planKey)}
                className="plan-card__cta"
              >
                {isCurrent ? copy.current : `${copy.choose} ${plan.name}`}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="plans-billing-note">
        <div className="plans-billing-note__icon"><ShieldCheck size={20} /></div>
        <div>
          <strong>{copy.billingNoteTitle}</strong>
          <p>{copy.billingNote}</p>
        </div>
      </section>
    </div>
  );
}

export default Plans;
