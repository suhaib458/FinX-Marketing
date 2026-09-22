import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProtectedRouteDecision } from '../../utils/routeGuards';

// Redirects unauthenticated users to /login
function ProtectedRoute({ children, requireOnboarded = true }) {
  const { isAuthenticated, emailNotVerified, hasAppSession, isOnboarded, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}><div className="fx-spinner fx-spinner--lg" /></div>;
  }
  const decision = getProtectedRouteDecision({
    isAuthenticated,
    emailNotVerified,
    hasAppSession,
    isOnboarded: requireOnboarded ? isOnboarded : true,
  });

  if (decision === 'login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (decision === 'verify') {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  if (decision === 'onboarding') {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
