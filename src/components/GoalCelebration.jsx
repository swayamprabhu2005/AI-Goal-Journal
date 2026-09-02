import { useEffect, useState } from 'react';
import { PartyPopper, Trophy, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Dispatch a global custom event whenever a goal is newly completed.
 * Panshobh's celebration component or any external module can listen via:
 * window.addEventListener('goal:completed', (e) => console.log(e.detail.goal));
 */
export function notifyGoalCompleted(goal) {
  if (typeof window !== 'undefined' && goal) {
    const event = new CustomEvent('goal:completed', {
      detail: {
        goal,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  }
}

export default function GoalCelebration({ goal, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (goal) {
      setVisible(true);
    }
  }, [goal]);

  if (!goal || !visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-pulse delay-500" />
        {["#4F46E5", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"].flatMap((color, ci) =>
          [0, 1, 2, 3, 4].map((n) => (
            <span
              key={`${ci}-${n}`}
              className="confetti-piece"
              style={{
                left: `${8 + ((ci * 19 + n * 13) % 84)}%`,
                background: color,
                animationDelay: `${(ci * 0.08 + n * 0.05).toFixed(2)}s`,
                "--cx": `${(n % 2 === 0 ? 1 : -1) * (18 + ci * 10)}px`,
              }}
            />
          ))
        )}
      </div>

      <div className="relative panel w-full max-w-md p-7 shadow-2xl border border-emerald-200/80 bg-white rounded-3xl text-center overflow-hidden animate-scale-up">
        {/* Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X size={18} />
        </button>

        {/* Celebratory Icon Header */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 via-amber-100 to-emerald-50 text-emerald-600 shadow-md ring-8 ring-emerald-50/50">
          <Trophy size={40} className="text-amber-500 animate-bounce" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200 mb-3 shadow-sm">
          <Sparkles size={14} className="text-amber-500" /> Goal Achieved! <PartyPopper size={14} className="text-emerald-600" />
        </div>

        <h3 className="text-2xl font-bold text-slate-900 leading-tight">
          Congratulations! 🎉
        </h3>

        <p className="mt-2 text-sm text-slate-600 font-medium">
          You've successfully crossed the finish line on:
        </p>

        {/* Goal Card Container */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 border border-emerald-100 shadow-sm text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {goal.category || 'Milestone'}
              </span>
              <h4 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
                {goal.title}
              </h4>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 shadow-sm flex items-center gap-1">
              <CheckCircle2 size={13} /> 100%
            </span>
          </div>

          {goal.description && (
            <p className="mt-2 text-xs text-slate-600 font-medium line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>

        <p className="mt-4 text-xs italic text-slate-500 font-medium">
          “Success is the sum of small efforts repeated day in and day out.” Keep up the amazing momentum!
        </p>

        <button
          onClick={handleClose}
          className="mt-6 primary-button w-full py-3 text-sm font-bold shadow-md hover:shadow-emerald-200 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center gap-2"
        >
          Keep Crushing Goals <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
