import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Journal from './pages/Journal';
import AiCoach from './pages/AiCoach';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

function RootIndexRoute() {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft-app">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-moss-200 border-t-moss-600" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            Loading AI Goal Journal...
          </p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to workspace dashboard; otherwise show public landing page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Landing Route */}
      <Route path="/" element={<RootIndexRoute />} />

      {/* Public Auth Routes (Redirects to dashboard if logged in) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Workspace Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <AppShell>
              <Journal />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <AppShell>
              <Goals />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach"
        element={
          <ProtectedRoute>
            <AppShell>
              <AiCoach />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <Profile />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}