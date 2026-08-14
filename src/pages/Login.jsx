import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Failed to log in. Please check your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 selection:bg-primary selection:text-white">
      <div className="w-full max-w-sm">
        {/* Brand Return Link */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground hover:opacity-90 transition"
          >
            <span>AI Goal Journal</span>
          </Link>
        </div>

        <Card className="w-full border-card-border bg-card p-6 sm:p-8 shadow-soft">
          <h1 className="text-2xl font-bold text-foreground font-display">
            Welcome back
          </h1>

          <p className="mt-1 mb-6 text-xs text-muted-foreground">
            Sign in to access your journal reflections & AI coach.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p
                role="alert"
                className="rounded-card bg-status-error-bg p-3 text-xs text-status-error border border-status-error/30"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={loading}
              className="mt-2 w-full py-3"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-card-border text-center text-xs text-muted-foreground">
            <span>Don't have an account yet? </span>
            <Link
              to="/register"
              className="font-semibold text-secondary-foreground hover:text-foreground underline"
            >
              Register here
            </Link>
          </div>
        </Card>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}