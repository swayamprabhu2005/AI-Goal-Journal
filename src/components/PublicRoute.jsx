import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guard for public-only auth pages (Login, Register).
 * Redirects already-authenticated users directly to /dashboard.
 */
export default function PublicRoute({ children }) {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft-app">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-moss-200 border-t-moss-600" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
