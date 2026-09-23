import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PencilLoader } from './LoadingSkeleton';
import { isDevPreview } from '../config/devPreview'; // DEV PREVIEW ONLY (see config/devPreview.js)

export default function ProtectedRoute({ children }) {
  const { user, checkingAuth } = useAuth();

  // ===========================================================================
  // DEVELOPMENT / LOCAL PREVIEW ONLY — allow protected routes without Firebase.
  // Never active in production builds (see config/devPreview.js).
  // ===========================================================================
  if (isDevPreview) {
    if (checkingAuth) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#E2E9DF] p-6 text-slate-900 font-sans">
          <div className="flex flex-col items-center justify-center text-center">
            <PencilLoader />
            <p className="mt-2 text-sm font-semibold text-slate-700 tracking-wide animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      );
    }
    return children;
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E2E9DF] p-6 text-slate-900 font-sans">
        <div className="flex flex-col items-center justify-center text-center">
          <PencilLoader />
          <p className="mt-2 text-sm font-semibold text-slate-700 tracking-wide animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}