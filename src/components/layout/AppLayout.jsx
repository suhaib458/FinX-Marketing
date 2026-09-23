import { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FolderOpen, BarChart3, Settings,
  Sun, Moon, Globe, Menu, LogOut, Zap, Crown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAppData } from '../../context/AppDataContext';

const navItems = [
  { key: 'dashboard', path: '/app', icon: LayoutDashboard, end: true },
  { key: 'create', path: '/app/create', icon: PlusCircle },
  { key: 'library', path: '/app/library', icon: FolderOpen },
  { key: 'analytics', path: '/app/analytics', icon: BarChart3 },
  { key: 'settings', path: '/app/settings', icon: Settings },
];

function AppLayout() {
  const { toggleTheme, isDark } = useTheme();
  const { toggleLanguage, t, language } = useLanguage();
  const { user, logout } = useAuth();
  const { credits, brand } = useAppData();
  const { success, clearToasts } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const layoutRef = useRef(null);

  // Clear toasts on route change
  useEffect(() => {
    if (clearToasts) clearToasts();
  }, [location.pathname, clearToasts]);

  const handleLogout = useCallback(async () => {
    await logout();
    success(t.toasts.logoutSuccess);
    navigate('/');
  }, [logout, navigate, success, t]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handlePointerMove = useCallback((event) => {
    if (!layoutRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    layoutRef.current.style.setProperty('--pointer-x', `${event.clientX}px`);
    layoutRef.current.style.setProperty('--pointer-y', `${event.clientY}px`);
  }, []);

  return (
    <div className="app-layout" ref={layoutRef} onPointerMove={handlePointerMove}>
      <div className="app-ambient-pointer" aria-hidden="true" />
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <NavLink to="/app" className="sidebar__logo" onClick={closeSidebar}>
            <div className="sidebar__logo-mark" lang="en">FX</div>
            <span className="sidebar__logo-text" lang="en">FinX</span>
          </NavLink>
        </div>

        {/* Brand Selector */}
        {brand?.businessName && (
          <div className="sidebar__brand">
            <div className="sidebar__brand-dot" style={{ background: brand.primaryColor || 'var(--color-accent)' }} />
            <span className="sidebar__brand-name">{brand.businessName}</span>
          </div>
        )}

        <nav className="sidebar__nav" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
              onClick={closeSidebar}
            >
              <item.icon className="sidebar__nav-icon" size={20} />
              <span className="sidebar__nav-label">{t.nav[item.key]}</span>
            </NavLink>
          ))}
        </nav>

        {/* Credit Display */}
        <div className="sidebar__credits">
          <div className="sidebar__credits-info">
            <Zap size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="sidebar__credits-value">{credits}</span>
            <span className="sidebar__credits-label">{t.dashboard.creditUnit}</span>
          </div>
          <div className="sidebar__credits-bar">
            <div className="sidebar__credits-bar-fill" style={{ width: `${Math.min(credits, 100)}%` }} />
          </div>
          <button className="sidebar__upgrade-btn" onClick={() => navigate('/app/settings')}>
            <Crown size={14} /> {t.settings.upgradePlan}
          </button>
        </div>

        <div className="sidebar__footer">
          <div className="sidebar__user" onClick={() => { navigate('/app/settings'); closeSidebar(); }}>
            <Avatar name={user?.name || ''} size="sm" />
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user?.name || ''}</div>
              <div className="sidebar__user-plan">
                {t.plans[user?.plan || 'free']?.name || t.common.free}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="app-topbar">
        <div className="app-topbar__start">
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            icon={Menu}
            onClick={() => setSidebarOpen(true)}
            className="app-topbar__menu-btn"
            aria-label="Open menu"
            title="Open menu"
          />
        </div>

        <div className="app-topbar__end">
          {/* Credit pill in topbar */}
          <div className="topbar-credit-pill">
            <Zap size={14} />
            <span>{credits}</span>
          </div>
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
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
            aria-label={t.nav.logout}
            title={t.nav.logout}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
        <div className="bottom-nav__items">
          {navItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            const isCreate = item.key === 'create';

            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''} ${isCreate ? 'bottom-nav__item--create' : ''}`}
              >
                {isCreate ? (
                  <div className="bottom-nav__item-icon-wrap">
                    <item.icon size={20} />
                  </div>
                ) : (
                  <item.icon className="bottom-nav__item-icon" size={20} />
                )}
                <span className="bottom-nav__item-label">{t.nav[item.key]}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default AppLayout;
