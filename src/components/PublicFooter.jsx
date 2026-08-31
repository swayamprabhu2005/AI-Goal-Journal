import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 px-6 text-white">
      <div className="mx-auto max-w-[1250px]">
        <div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-slate-800">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-card">
                <Target size={18} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">
                  GOAL JOURNAL
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-400">
                  Growth workspace
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-300 max-w-sm leading-relaxed">
              An intelligent personal reflection and goal-tracking platform. Turns conversational text and voice reflections into structured momentum, actionable blockers, and weekly accountability coaching.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Product</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-300">
              <li><a href="#features" className="hover:text-teal-400 transition">Voice Reflection</a></li>
              <li><a href="#features" className="hover:text-teal-400 transition">Gemini AI Structuring</a></li>
              <li><a href="#features" className="hover:text-teal-400 transition">Goal Progress Engine</a></li>
              <li><a href="#features" className="hover:text-teal-400 transition">Accountability Coach</a></li>
            </ul>
          </div>

          {/* Quick Access Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Account</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-300">
              <li><Link to="/login" className="hover:text-teal-400 transition">Sign In to Workspace</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition">Create Free Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} AI Goal Journal & Accountability Coach. All rights reserved.</p>
          <p className="italic text-slate-200 font-medium">Powered by Google Gemini & faster-whisper.</p>
        </div>
      </div>
    </footer>
  );
}
