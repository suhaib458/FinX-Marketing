import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestedPath, safeProtectedDestination } from '../../utils/routeGuards';

export default function AuthRoute({ children }) {
  const { firebaseUser, user, emailNotVerified, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}><div className="fx-spinner fx-spinner--lg" /></div>;
  }
  // Backend confirmed email not verified — route to verification page
  if (firebaseUser && emailNotVerified) {
    return <Navigate to="/verify-email" state={{ from: location.state?.from }} replace />;
  }
  // Fully authenticated and synced with backend — route to app
  if (user) {
    const destination = user.onboarded
      ? safeProtectedDestination(requestedPath(location.state?.from))
      : '/onboarding';
    return <Navigate to={destination} state={{ from: location.state?.from }} replace />;
  }
  return children;
}
