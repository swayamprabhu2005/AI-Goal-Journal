import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Flame, Sliders } from "lucide-react";

export default function ProductivityCalculator() {
  const [journalDays, setJournalDays] = useState(5);
  const [goalRatio, setGoalRatio] = useState(75);
  const [activeBlockers, setActiveBlockers] = useState(1);

  // Deterministic calculation formula matching spec
  // Journal consistency: max 30 pts (30 * days/7)
  // Goal ratio: max 50 pts (50 * ratio/100)
  // Blocker penalty: -3 pts per blocker
  const consistencyScore = Math.round(30 * (journalDays / 7));
  const goalScore = Math.round(50 * (goalRatio / 100));
  const blockerPenalty = activeBlockers * 3;
  const rawScore = consistencyScore + goalScore - blockerPenalty;
  const finalScore = Math.min(100, Math.max(0, rawScore));

  const getScoreTier = (score) => {
    if (score >= 85) return { label: "High Momentum", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
    if (score >= 60) return { label: "Steady Progress", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
    return { label: "Needs Focus", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  };

  const tier = getScoreTier(finalScore);

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <span className="section-label">INTERACTIVE CALCULATOR</span>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mt-1">
            Test Your Personal Productivity Score
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Adjust your weekly journaling habits and goal milestones to simulate your auditable 0–100 rating
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <Sliders size={16} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">Live Mathematical Model</span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12 items-center">
        {/* Sliders Control Panel (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-5">
          {/* Slider 1: Journaling Days */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame size={15} className="text-orange-500" /> Journal Consistency
              </span>
              <span className="text-indigo-600 font-mono">{journalDays} Days / Week</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={journalDays}
              onChange={(e) => setJournalDays(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Slider 2: Goal Completion % */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={15} className="text-emerald-600" /> Goal Completion Rate
              </span>
              <span className="text-emerald-600 font-mono">{goalRatio}% Milestones</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={goalRatio}
              onChange={(e) => setGoalRatio(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Slider 3: Active Blockers */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-red-500" /> Active Friction Blockers
              </span>
              <span className="text-red-600 font-mono">-{blockerPenalty} pts ({activeBlockers} active)</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={activeBlockers}
              onChange={(e) => setActiveBlockers(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>

        {/* Score Display Ring & Tier Badge (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="relative flex items-center justify-center mb-3">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-200"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                className="text-indigo-600"
                fill="transparent"
                strokeDasharray="326.7"
                animate={{ strokeDashoffset: 326.7 - (326.7 * finalScore) / 100 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900">{finalScore}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Out of 100</span>
            </div>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-extrabold border ${tier.bg} ${tier.color}`}>
            {tier.label}
          </span>
        </div>
      </div>
    </div>
  );
}
