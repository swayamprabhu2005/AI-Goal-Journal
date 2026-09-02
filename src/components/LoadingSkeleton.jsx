import { Target, Sparkles, BookOpen } from "lucide-react";

export function FullscreenLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 p-6 text-slate-900 font-sans animate-fade-in">
      <div className="panel p-9 shadow-lg bg-white border border-slate-200 rounded-3xl text-center max-w-md w-full">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm mb-5">
          <Target size={36} className="text-indigo-600 animate-target-pulse" />
          <Sparkles size={20} className="absolute -top-2 -right-2 text-purple-600 animate-sparkle-spin" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Journal</h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Loading daily reflection workspace & goals...
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="panel p-6 shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-2xl skeleton-box" />
          <div className="h-3.5 w-24 skeleton-box mt-4" />
          <div className="flex items-baseline gap-2">
            <div className="h-9 w-16 skeleton-box" />
            <div className="h-4 w-20 skeleton-box" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ height = "h-40", className = "" }) {
  return (
    <div className={`panel p-7 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-4.5 w-36 skeleton-box" />
        <div className="h-5 w-20 skeleton-box rounded-full" />
      </div>
      <div className="h-6 w-3/4 skeleton-box" />
      <div className={`${height} w-full skeleton-box mt-3`} />
    </div>
  );
}

export function GridSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="panel p-6 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="h-5 w-24 skeleton-box rounded-full" />
            <div className="h-4 w-20 skeleton-box" />
          </div>
          <div className="h-6 w-5/6 skeleton-box" />
          <div className="h-4 w-full skeleton-box" />
          <div className="h-4 w-2/3 skeleton-box" />
          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <div className="h-4 w-20 skeleton-box" />
            <div className="h-5 w-5 skeleton-box rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ANIMATED DART & TARGET LOADING STATE FOR GOALS */
export function GoalLoadingState() {
  return (
    <div className="panel p-12 text-center shadow-md bg-white rounded-3xl animate-fade-in my-6">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 shadow-sm animate-target-pulse mb-6">
        <Target size={48} className="text-indigo-600" />
        <div className="absolute top-3 right-3 animate-dart">
          <span className="text-2xl">🎯</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Hitting Your Goal Targets...</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
        Organizing your manual goals, tracking progress, and preparing milestone updates.
      </p>
    </div>
  );
}

/* ANIMATED BOOK WRITING LOADING STATE FOR JOURNAL */
export function JournalLoadingState() {
  return (
    <div className="panel p-12 text-center shadow-md bg-white rounded-3xl animate-fade-in my-6">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-purple-50 border border-purple-100 shadow-sm animate-book-write mb-6">
        <BookOpen size={44} className="text-purple-600" />
        <Sparkles size={22} className="absolute -top-2 -right-2 text-amber-500 animate-sparkle-spin" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Opening Journal Archive...</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
        Fetching your daily voice and text reflections with Gemini AI extraction.
      </p>
    </div>
  );
}

/* ANIMATED SPARKLE LOADING STATE FOR AI COACH */
export function CoachLoadingState() {
  return (
    <div className="panel p-12 text-center shadow-md bg-white rounded-3xl animate-fade-in my-6">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 shadow-sm animate-pulse-glow mb-6">
        <Sparkles size={48} className="text-indigo-600 animate-sparkle-spin" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Weekly Growth...</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
        Synthesizing goal progress, blockers, and journal reflections into coaching insights.
      </p>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <StatCardSkeleton />
      <CardSkeleton height="h-32" />
      <div className="grid gap-7 md:grid-cols-2">
        <CardSkeleton height="h-44" />
        <CardSkeleton height="h-44" />
      </div>
    </div>
  );
}
