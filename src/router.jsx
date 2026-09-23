import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PublicLayout from './components/layout/PublicLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import OnboardingRoute from './components/layout/OnboardingRoute';
import AuthRoute from './components/layout/AuthRoute';

// ─── Lazy-loaded Pages ───
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const CreateContent = lazy(() => import('./pages/app/CreateContent'));
const ContentResult = lazy(() => import('./pages/app/ContentResult'));
const Library = lazy(() => import('./pages/app/Library'));
const Analytics = lazy(() => import('./pages/app/Analytics'));
const Settings = lazy(() => import('./pages/app/Settings'));
const Plans = lazy(() => import('./pages/app/Plans'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PublicResourcePage = lazy(() => import('./pages/PublicResourcePage'));

// Loading fallback
function PageLoader() {
  return (
    <div className="route-loader" role="status" aria-label="Loading FinX">
      <div className="route-loader__orb" aria-hidden="true" />
      <div className="route-loader__mark" lang="en">Fin<span>X</span></div>
      <div className="route-loader__line" aria-hidden="true"><i /></div>
    </div>
  );
}

function SuspenseWrap({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  // ─── Public Routes ───
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <SuspenseWrap><Landing /></SuspenseWrap>,
      },
      {
        path: '/blog',
        element: <SuspenseWrap><PublicResourcePage type="blog" /></SuspenseWrap>,
      },
      {
        path: '/help',
        element: <SuspenseWrap><PublicResourcePage type="help" /></SuspenseWrap>,
      },
      {
        path: '/contact',
        element: <SuspenseWrap><PublicResourcePage type="contact" /></SuspenseWrap>,
      },
      {
        path: '/faq',
        element: <SuspenseWrap><PublicResourcePage type="faq" /></SuspenseWrap>,
      },
      {
        path: '/terms',
        element: <SuspenseWrap><PublicResourcePage type="terms" /></SuspenseWrap>,
      },
      {
        path: '/privacy',
        element: <SuspenseWrap><PublicResourcePage type="privacy" /></SuspenseWrap>,
      },
    ],
  },
  
  // ─── Auth Routes (Standalone layouts) ───
  {
    path: '/login',
    element: <AuthRoute><SuspenseWrap><Login /></SuspenseWrap></AuthRoute>,
  },
  {
    path: '/register',
    element: <AuthRoute><SuspenseWrap><Register /></SuspenseWrap></AuthRoute>,
  },
  {
    path: '/forgot-password',
    element: <AuthRoute><SuspenseWrap><ForgotPassword /></SuspenseWrap></AuthRoute>,
  },
  {
    path: '/verify-email',
    element: <SuspenseWrap><VerifyEmail /></SuspenseWrap>,
  },

  // ─── Onboarding (no sidebar) ───
  {
    path: '/onboarding',
    element: (
      <OnboardingRoute>
        <SuspenseWrap><Onboarding /></SuspenseWrap>
      </OnboardingRoute>
    ),
  },

  // ─── App Routes (authenticated, with sidebar) ───
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/app',
        element: <SuspenseWrap><Dashboard /></SuspenseWrap>,
      },
      {
        path: '/app/create/:tool?',
        element: <SuspenseWrap><CreateContent /></SuspenseWrap>,
      },
      {
        path: '/app/result/:id',
        element: <SuspenseWrap><ContentResult /></SuspenseWrap>,
      },
      {
        path: '/app/library',
        element: <SuspenseWrap><Library /></SuspenseWrap>,
      },
      {
        path: '/app/analytics',
        element: <SuspenseWrap><Analytics /></SuspenseWrap>,
      },
      {
        path: '/app/settings',
        element: <SuspenseWrap><Settings /></SuspenseWrap>,
      },
      {
        path: '/app/plans',
        element: <SuspenseWrap><Plans /></SuspenseWrap>,
      },
      {
        path: '/app/*',
        element: <SuspenseWrap><NotFound /></SuspenseWrap>,
      },
    ],
  },
  {
    path: '*',
    element: <SuspenseWrap><NotFound /></SuspenseWrap>,
  },
]);

export default router;
