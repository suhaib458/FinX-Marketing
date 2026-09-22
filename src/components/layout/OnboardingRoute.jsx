import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOnboardingRouteDecision } from '../../utils/routeGuards';

function OnboardingRoute({ children }) {
  const { isAuthenticated, isEmailVerified, hasAppSession, isOnboarded, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}><div className="fx-spinner fx-spinner--lg" /></div>;
  }
  const restart = new URLSearchParams(location.search).get('restart') === 'true';
  const decision = getOnboardingRouteDecision({ isAuthenticated, isEmailVerified, hasAppSession, isOnboarded, restart });

  if (decision === 'login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (decision === 'app') {
    return <Navigate to="/app" replace />;
  }
  if (decision === 'verify') {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }
  return children;
}

export default OnboardingRoute;
