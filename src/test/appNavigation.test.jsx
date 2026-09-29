import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from '../components/layout/AppLayout';
import { ThemeProvider } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'مستخدم', plan: 'free' }, logout: vi.fn() }),
}));

vi.mock('../context/AppDataContext', () => ({
  useAppData: () => ({ credits: 75, brand: null }),
}));

function renderAppLayout() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/app/create']}>
            <Routes>
              <Route path="/app" element={<AppLayout />}>
                <Route path="create" element={<div>صفحة الإنشاء</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>,
  );
}

describe('app navigation', () => {
  it('keeps Create first and omits plan upgrades from the mobile navigation', () => {
    const { container } = renderAppLayout();

    const desktopLinks = within(container.querySelector('.sidebar__nav')).getAllByRole('link');
    expect(desktopLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app/create',
      '/app/library',
      '/app/analytics',
      '/app/settings',
    ]);
    expect(container.querySelector('.sidebar__logo')).toHaveAttribute('href', '/app/create');

    const mobileLinks = within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getAllByRole('link');
    expect(mobileLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app/create',
      '/app/library',
      '/app/analytics',
      '/app/settings',
    ]);
    expect(screen.queryByText('لوحة التحكم')).not.toBeInTheDocument();
  });
});
