import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="border-t border-card-border bg-secondary py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-card-border/60">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <span>AI Goal Journal</span>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground max-w-sm leading-relaxed">
              An intelligent personal reflection and goal-tracking platform. Turns conversational text and voice reflections into structured momentum, actionable blockers, and weekly accountability coaching.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-secondary-foreground font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Local MVP • In-Memory Architecture • CPU INT8 faster-whisper</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Product</h4>
            <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition">Voice Reflection</a></li>
              <li><a href="#features" className="hover:text-foreground transition">Gemini AI Structuring</a></li>
              <li><a href="#features" className="hover:text-foreground transition">Goal Tracking</a></li>
              <li><a href="#ai-coach" className="hover:text-foreground transition">Accountability Coach</a></li>
            </ul>
          </div>

          {/* Quick Access Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Account</h4>
            <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition">Sign In to Workspace</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition">Create Free Account</Link></li>
              <li><a href="#privacy" className="hover:text-foreground transition">Privacy & Local Processing</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Goal Journal & Accountability Coach. All rights reserved.</p>
          <p className="italic text-secondary-foreground">Powered by Google Gemini & faster-whisper.</p>
        </div>
      </div>
    </footer>
  );
}
