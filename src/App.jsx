import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Progress from "./pages/progress";
import Goals from "./pages/Goals";
import Journal from "./pages/Journal";
import AiCoach from "./pages/AiCoach";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";

function RootIndexRoute() {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-cream">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-burgundy border-t-cream" />
          <p className="text-xs font-semibold uppercase tracking-wider text-beige/70">
            Loading Goal Journal...
          </p>
        </div>
      </div>
    );
  }

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

      {/* Public Auth Routes */}
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

      {/* Protected Workspace Layout & Sub-routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/coach" element={<AiCoach />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}