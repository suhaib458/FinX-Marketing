import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sun, Moon, Globe, Palette, LogOut } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

function SettingsSection({ title, children }) {
  return (
    <div className="settings-section">
      <h2 className="settings-section__title">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SettingsRow({ icon: Icon, label, children, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`settings-row ${onClick ? 'settings-row--interactive' : ''}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4)',
        transition: 'background-color var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--color-border)',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'inherit',
      }}
      onMouseEnter={onClick ? (e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)' : undefined}
      onMouseLeave={onClick ? (e) => e.currentTarget.style.backgroundColor = 'transparent' : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {Icon && <Icon size={20} style={{ color: 'var(--color-text-muted)' }} />}
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)' }}>{label}</span>
      </div>
      <div>
        {children}
      </div>
    </Tag>
  );
}

function Settings() {
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    success(t.toasts.logoutSuccess);
    navigate('/');
  }, [logout, navigate, success, t]);

  return (
    <div className="page-enter settings-page">
      <h1 style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-bold)',
        marginBottom: 'var(--space-8)',
      }}>
        {t.settings.title}
      </h1>

      {/* Profile */}
      <SettingsSection title={t.settings.profile}>
        <Card variant="quiet" compact style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <Avatar name={user?.name || ''} size="xl" />
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                {user?.name || ''}
              </div>
              <div lang="en" dir="ltr" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <SettingsRow icon={Palette} label={t.settings.editBrand} onClick={() => navigate('/onboarding?restart=true')} />
        </Card>
      </SettingsSection>

      {/* Plan */}
      <SettingsSection title={t.settings.planAndCredits}>
        <Card variant="quiet" compact style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
          }}>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {t.settings.currentPlan}
              </div>
              <div style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-1)',
              }}>
                {t.plans[user?.plan || 'free']?.name}
                <Badge variant="primary">{t.common.free}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/#pricing')}>
              {t.settings.upgradePlan}
            </Button>
          </div>
        </Card>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title={t.settings.appearance}>
        <Card variant="quiet" compact style={{ padding: 0, overflow: 'hidden' }}>
          <SettingsRow icon={isDark ? Moon : Sun} label={isDark ? t.settings.darkMode : t.settings.lightMode} onClick={toggleTheme}>
            <div style={{
              width: 44,
              height: 24,
              borderRadius: 'var(--radius-full)',
              background: isDark ? 'var(--color-accent)' : 'var(--color-border)',
              position: 'relative',
              transition: 'background-color var(--transition-fast)',
            }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--text-on-primary)',
                position: 'absolute',
                top: 3,
                insetInlineStart: isDark ? 23 : 3,
                transition: 'inset-inline-start var(--transition-fast)',
              }} />
            </div>
          </SettingsRow>

          <SettingsRow icon={Globe} label={t.settings.language} onClick={toggleLanguage}>
            <span lang={language === 'ar' ? 'ar' : 'en'} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {language === 'ar' ? t.settings.arabic : t.settings.english}
            </span>
          </SettingsRow>
        </Card>
      </SettingsSection>

      {/* Logout */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <Button
          variant="ghost"
          icon={LogOut}
          onClick={handleLogout}
          style={{ color: 'var(--color-error)' }}
        >
          {t.nav.logout}
        </Button>
      </div>
    </div>
  );
}

export default Settings;
