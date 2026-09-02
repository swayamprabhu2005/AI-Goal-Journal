import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer id="privacy" className="border-t border-slate-200 bg-white py-12 px-6">
      <div className="mx-auto max-w-[1250px]">
        <div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-slate-200">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs p-1 overflow-hidden">
                <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-lg" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900">
                  AI JOURNAL
                </p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                  Growth workspace
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600 max-w-sm leading-relaxed">
              An intelligent personal reflection and goal-tracking platform. Turns conversational text and voice reflections into structured momentum, actionable blockers, and weekly accountability coaching.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Product</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-600">
              <li><a href="#features" className="hover:text-indigo-600 transition">Voice Reflection</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">Gemini AI Structuring</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">Goal Progress Engine</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">Accountability Coach</a></li>
            </ul>
          </div>

          {/* Quick Access Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Account</h4>
            <ul className="flex flex-col gap-2 text-slate-600">
              <li><Link to="/login" className="hover:text-indigo-600 transition">Sign In to Workspace</Link></li>
              <li><Link to="/register" className="hover:text-indigo-600 transition">Create Free Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AI Journal. All rights reserved.</p>
          <p className="italic text-indigo-600 font-medium">Powered by Google Gemini & faster-whisper.</p>
        </div>
      </div>
    </footer>
  );
}
