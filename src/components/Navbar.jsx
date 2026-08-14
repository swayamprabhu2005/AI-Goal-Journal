import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  const email = user?.email || '';

  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-secondary/95 px-4 sm:px-6 py-3.5 backdrop-blur">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-display text-xl font-bold tracking-tight text-foreground hover:opacity-90 flex items-center gap-2"
          >
            <span>AI Goal Journal</span>
          </button>

          <span className="hidden sm:inline-block rounded-full bg-primary/20 border border-primary/40 px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
            AI Coach
          </span>
        </div>

        {/* Desktop User Info & Logout */}
        <div className="hidden md:flex items-center gap-3">
          {email && (
            <span className="rounded-card bg-muted px-3 py-1 text-xs text-secondary-foreground font-mono border border-card-border">
              {email}
            </span>
          )}

          <Button variant="ghost" onClick={handleLogout} className="text-xs">
            Sign out
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-secondary-foreground hover:text-foreground focus:outline-none text-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mt-3 pt-3 border-t border-card-border md:hidden flex flex-col gap-2">
          {[
            { to: '/dashboard', label: '📊 Dashboard' },
            { to: '/journal', label: '✍️ Journal' },
            { to: '/goals', label: '🎯 Goals' },
            { to: '/coach', label: '🛡️ AI Coach' },
            { to: '/profile', label: '👤 Profile' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-card transition ${
                  isActive ? 'bg-primary text-white font-semibold shadow-glow-primary' : 'text-secondary-foreground hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="pt-2 border-t border-card-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono truncate max-w-[200px]">{email}</span>
            <button onClick={handleLogout} className="text-status-error font-semibold hover:underline">
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}