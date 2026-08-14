import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-card-border bg-background/85 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition">
          <span>AI Goal Journal</span>
        </Link>

        {/* Anchor Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition">How It Works</a>
          <a href="#ai-coach" className="hover:text-foreground transition">AI Coach</a>
          <a href="#privacy" className="hover:text-foreground transition">Privacy & Hardware</a>
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="text-xs px-3.5 py-2"
          >
            Log In
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/register')}
            className="text-xs px-4 py-2"
          >
            Start Journaling Free
          </Button>
        </div>
      </div>
    </header>
  );
}
