import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PencilLoader } from './LoadingSkeleton';

/**
 * Guard for public-only auth pages (Login, Register).
 * Redirects already-authenticated users directly to /dashboard.
 */
export default function PublicRoute({ children }) {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E2E9DF] p-6 text-slate-900 font-sans">
        <div className="flex flex-col items-center justify-center text-center">
          <PencilLoader />
          <p className="mt-2 text-sm font-semibold text-slate-700 tracking-wide animate-pulse">
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
