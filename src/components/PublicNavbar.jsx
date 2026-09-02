import { Link, useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 sm:px-10 h-[92px] flex items-center transition-all">
      <div className="mx-auto flex max-w-[1350px] w-full items-center justify-between">
        {/* Brand (Enlarged) */}
        <Link to="/" className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-xs p-1 overflow-hidden">
            <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-xl" />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-snug">
              AI JOURNAL
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Growth workspace
            </p>
          </div>
        </Link>

        {/* Anchor Links (Enlarged) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-slate-700">
          <a href="#features" className="hover:text-indigo-600 transition relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 after:transition-all hover:after:w-full">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 after:transition-all hover:after:w-full">How It Works</a>
          <a href="#privacy" className="hover:text-indigo-600 transition relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 after:transition-all hover:after:w-full">Privacy</a>
        </nav>

        {/* Auth CTAs (Enlarged) */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="primary-button px-6 py-3 text-sm font-bold shadow-md hover:shadow-indigo-200"
          >
            Start Free
          </button>
        </div>
      </div>
    </header>
  );
}
