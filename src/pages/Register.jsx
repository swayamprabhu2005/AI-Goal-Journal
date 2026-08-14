import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      let msg = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
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
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
            Create your account
          </h1>

          <p className="mt-1 mb-6 text-xs text-muted-foreground">
            Start transforming daily reflections into structured momentum.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="register-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="register-password"
              label="Password (min 6 chars)"
              type="password"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              id="confirm-password"
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              disabled={loading}
              className="mt-2 w-full py-3"
            >
              Create Free Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-card-border text-center text-xs text-muted-foreground">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-semibold text-secondary-foreground hover:text-foreground underline"
            >
              Sign in here
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