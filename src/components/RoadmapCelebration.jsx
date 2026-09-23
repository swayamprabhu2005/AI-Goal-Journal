import React from 'react';
import { Sparkles, Trophy, CheckCircle2, TrendingUp, PartyPopper, Target, ArrowRight, X } from 'lucide-react';

/**
 * Positive Reinforcement & User Validation Component (Swayam).
 *
 * Renders inside the reserved `celebrationSlot` of Roadmap.jsx.
 * Provides 4 distinct, proportionate tiers of encouraging feedback:
 *   - Tier 1: Micro-Momentum (individual task checked off)
 *   - Tier 2: Velocity Checkpoint (25%, 50%, 75% progress milestones)
 *   - Tier 3: Milestone Mastery (full milestone section completed)
 *   - Tier 4: Epic Completion (100% roadmap / goal completed)
 */
export default function RoadmapCelebration({
  celebration = null,
  progressPercentage = 0,
  completedCount = 0,
  totalMilestones = 0,
  goalTitle = '',
  nextMilestoneTitle = '',
  onDismiss = null,
}) {
  // If no celebration event is currently active, render the mindful AI Encouragement default card
  if (!celebration) {
    const isCompleted = progressPercentage >= 100 && totalMilestones > 0;

    if (isCompleted) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left transition-all duration-300">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800">
                Roadmap Fully Completed
              </p>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
                Outstanding accomplishment on {goalTitle || 'your goal'}!
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                All {totalMilestones} milestones are finished. Your 100% progress is saved.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
            100% Mastery
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#F6F9F2] border border-[#B9CDAA]/70 text-left transition-all duration-300">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-[#4B5D3C]/10 text-[#4B5D3C] flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4B5D3C]">
                AI Coach
              </span>
              {progressPercentage > 0 && (
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-[#E2E9DF]">
                  {progressPercentage}% Progress
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-[#26261F]">
              {completedCount === 0
                ? "Every milestone begins with a single step."
                : `You've completed ${completedCount} of ${totalMilestones} milestones.`}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {nextMilestoneTitle
                ? `Next focus: ${nextMilestoneTitle}. Check off tasks as you finish them.`
                : "Check off your roadmap action items to record verifiable progress."}
            </p>
          </div>
        </div>

        {nextMilestoneTitle && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-[#4B5D3C] bg-white px-3 py-1.5 rounded-xl border border-[#E2E9DF] shadow-2xs">
            <span>Next Step</span>
            <ArrowRight size={13} />
          </div>
        )}
      </div>
    );
  }

  const { tier, milestoneTitle, taskTitle, percentage, completedMilestones, total } = celebration;

  // ---------------------------------------------------------------------------
  // TIER 4: Grand Roadmap & Goal Completion Celebration
  // ---------------------------------------------------------------------------
  if (tier === 4) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-[#F6F9F2] to-amber-50 border-2 border-emerald-500/50 p-6 text-left shadow-sm animate-fade-in">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md animate-bounce">
            <Trophy size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                <PartyPopper size={12} />
                Roadmap Accomplished
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                100% Complete
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#26261F] font-serif mt-1">
              🎉 Congratulations! You completed your entire roadmap!
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
              All {total || totalMilestones} milestones for <strong className="text-[#26261F]">"{goalTitle}"</strong> are finished.
              Your 100% achievement has been recorded in your progress history and goal dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TIER 3: Milestone Mastery Celebration
  // ---------------------------------------------------------------------------
  if (tier === 3) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[#F6F9F2] border-2 border-[#4B5D3C]/60 p-5 sm:p-6 text-left shadow-xs animate-fade-in">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        )}
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#4B5D3C] text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4B5D3C] bg-[#E2E9DF] px-2 py-0.5 rounded-full">
                Milestone Mastery
              </span>
              <span className="text-xs font-bold text-[#26261F] tabular-nums">
                {percentage ?? progressPercentage}% Complete
              </span>
            </div>
            <h4 className="text-base font-bold text-[#26261F] font-serif mt-1">
              Milestone Finished: {milestoneTitle}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Outstanding work! You've completed {completedMilestones ?? completedCount} of {total ?? totalMilestones} milestones.
              {nextMilestoneTitle && (
                <span> Ready for the next stage: <strong className="text-[#4B5D3C]">{nextMilestoneTitle}</strong>.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TIER 2: Velocity Checkpoint (25%, 50%, 75% thresholds)
  // ---------------------------------------------------------------------------
  if (tier === 2) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-amber-50/70 border border-amber-300 p-5 text-left shadow-2xs animate-fade-in">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        )}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                Progress Velocity
              </span>
              <span className="text-xs font-bold text-amber-900 tabular-nums">
                {percentage}% Roadmap Completed
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              Major milestone reached on {goalTitle || 'your roadmap'}!
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">
              You are building strong consistency. {completedMilestones ?? completedCount} of {total ?? totalMilestones} milestones completed. Keep the momentum going!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TIER 1: Micro-Momentum (individual task checked off)
  // ---------------------------------------------------------------------------
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#F6F9F2] border border-[#B9CDAA] p-4 sm:p-5 text-left shadow-2xs animate-fade-in">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          title="Dismiss notification"
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-center gap-3.5">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-[#4B5D3C]/15 text-[#4B5D3C] flex items-center justify-center">
          <Target size={18} />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4B5D3C]">
              Action Item Completed
            </span>
            <span className="text-xs font-bold text-[#26261F] tabular-nums">
              {percentage ?? progressPercentage}% Complete
            </span>
          </div>
          <p className="text-xs font-semibold text-[#26261F] mt-0.5 truncate">
            {taskTitle ? `Checked off "${taskTitle}"` : `Completed in ${milestoneTitle || 'Roadmap'}`}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Every task completed takes you one step closer to your goal.
          </p>
        </div>
      </div>
    </div>
  );
}
