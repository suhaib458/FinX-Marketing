import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Sun, Moon, Globe, Palette, LogOut, Crown, Pencil, Sparkles
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

function Settings() {
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const copy = language === 'ar'
    ? {
        accountSubtitle: 'إدارة ملفك الشخصي وتجربة FinX.',
        editProfile: 'تعديل الملف الشخصي',
        planTitle: 'الخطة والرصيد',
        theme: 'الوضع',
        currentTheme: isDark ? 'الوضع الداكن' : 'الوضع الفاتح',
        languageLabel: 'اللغة',
        danger: 'الحساب',
      }
    : {
        accountSubtitle: 'Manage your profile and FinX experience.',
        editProfile: 'Edit profile',
        planTitle: 'Plan and credits',
        theme: 'Theme',
        currentTheme: isDark ? 'Dark mode' : 'Light mode',
        languageLabel: 'Language',
        danger: 'Account',
      };

  const handleLogout = useCallback(async () => {
    await logout();
    success(t.toasts.logoutSuccess);
    navigate('/');
  }, [logout, navigate, success, t]);

  return (
    <div className="page-enter settings-page settings-page--premium">
      <header className="settings-premium-header">
        <div>
          <h1>{t.settings.title}</h1>
          <p>{copy.accountSubtitle}</p>
        </div>
        <div className="settings-header-orb" aria-hidden="true"><Sparkles size={18} /></div>
      </header>

      <section className="settings-premium-section">
        <h2>{t.settings.profile}</h2>
        <div className="settings-profile-card">
          <div className="settings-profile-card__identity">
            <Avatar name={user?.name || ''} size="xl" />
            <div>
              <strong>{user?.name || ''}</strong>
              <span lang="en" dir="ltr">{user?.email || ''}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Pencil}
            onClick={() => navigate('/onboarding?restart=true')}
          >
            {copy.editProfile}
          </Button>
        </div>
      </section>

      <section className="settings-premium-section">
        <h2>{copy.planTitle}</h2>
        <div className="settings-plan-card">
          <div className="settings-plan-card__icon"><Crown size={20} /></div>
          <div className="settings-plan-card__copy">
            <span>{t.settings.currentPlan}</span>
            <strong>{t.plans[user?.plan || 'free']?.name || t.common.free}</strong>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/plans')}>
            {t.settings.upgradePlan}
          </Button>
        </div>
      </section>

      <section className="settings-premium-section">
        <h2>{t.settings.appearance}</h2>
        <div className="settings-preferences-card">
          <button className="settings-preference-row" type="button" onClick={toggleLanguage}>
            <div className="settings-preference-row__main">
              <div className="settings-preference-row__icon"><Globe size={19} /></div>
              <div>
                <strong>{copy.languageLabel}</strong>
                <span>{language === 'ar' ? t.settings.arabic : t.settings.english}</span>
              </div>
            </div>
            <div className="settings-segmented" aria-hidden="true">
              <span className={language === 'ar' ? 'settings-segmented__active' : ''}>العربية</span>
              <span className={language === 'en' ? 'settings-segmented__active' : ''}>EN</span>
            </div>
          </button>

          <div className="settings-preference-divider" />

          <button className="settings-preference-row" type="button" onClick={toggleTheme}>
            <div className="settings-preference-row__main">
              <div className="settings-preference-row__icon">
                {isDark ? <Moon size={19} /> : <Sun size={19} />}
              </div>
              <div>
                <strong>{copy.theme}</strong>
                <span>{copy.currentTheme}</span>
              </div>
            </div>

            <span className={`settings-switch ${isDark ? 'settings-switch--on' : ''}`} aria-hidden="true">
              <i />
            </span>
          </button>

          <div className="settings-preference-divider" />

          <button className="settings-preference-row" type="button" onClick={() => navigate('/onboarding?restart=true')}>
            <div className="settings-preference-row__main">
              <div className="settings-preference-row__icon"><Palette size={19} /></div>
              <div>
                <strong>{t.settings.editBrand}</strong>
                <span>{t.dashboard.currentBrand}</span>
              </div>
            </div>
            <Pencil size={16} className="settings-preference-row__action" />
          </button>
        </div>
      </section>

      <section className="settings-premium-section settings-premium-section--danger">
        <h2>{copy.danger}</h2>
        <button className="settings-logout-row" type="button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>{t.nav.logout}</span>
        </button>
      </section>
    </div>
  );
}

export default Settings;
