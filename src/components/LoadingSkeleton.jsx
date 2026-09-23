import { Target, Sparkles, BookOpen } from "lucide-react";

export function PencilLoader({ scale = "scale-75" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="200px"
      width="200px"
      viewBox="0 0 200 200"
      className={`pencil ${scale}`}
    >
      <defs>
        <clipPath id="pencil-eraser">
          <rect height="30" width="30" ry="5" rx="5" />
        </clipPath>
      </defs>
      <circle
        transform="rotate(-113,100,100)"
        strokeLinecap="round"
        strokeDashoffset="439.82"
        strokeDasharray="439.82 439.82"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        r="70"
        className="pencil__stroke"
      />
      <g transform="translate(100,100)" className="pencil__rotate">
        <g fill="none">
          <circle
            transform="rotate(-90)"
            strokeDashoffset="402"
            strokeDasharray="402.12 402.12"
            strokeWidth="30"
            stroke="hsl(223,90%,50%)"
            r="64"
            className="pencil__body1"
          />
          <circle
            transform="rotate(-90)"
            strokeDashoffset="465"
            strokeDasharray="464.96 464.96"
            strokeWidth="10"
            stroke="hsl(223,90%,60%)"
            r="74"
            className="pencil__body2"
          />
          <circle
            transform="rotate(-90)"
            strokeDashoffset="339"
            strokeDasharray="339.29 339.29"
            strokeWidth="10"
            stroke="hsl(223,90%,40%)"
            r="54"
            className="pencil__body3"
          />
        </g>
        <g transform="rotate(-90) translate(49,0)" className="pencil__eraser">
          <g className="pencil__eraser-skew">
            <rect height="30" width="30" ry="5" rx="5" fill="hsl(223,90%,70%)" />
            <rect clipPath="url(#pencil-eraser)" height="30" width="5" fill="hsl(223,90%,60%)" />
            <rect height="20" width="30" fill="hsl(223,10%,90%)" />
            <rect height="20" width="15" fill="hsl(223,10%,70%)" />
            <rect height="20" width="5" fill="hsl(223,10%,80%)" />
            <rect height="2" width="30" y="6" fill="hsla(223,10%,10%,0.2)" />
            <rect height="2" width="30" y="13" fill="hsla(223,10%,10%,0.2)" />
          </g>
        </g>
        <g transform="rotate(-90) translate(49,-30)" className="pencil__point">
          <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)" />
          <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)" />
          <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)" />
        </g>
      </g>
    </svg>
  );
}

export function FullscreenLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md p-6 text-slate-900 font-sans animate-fade-in">
      <div className="panel p-9 shadow-lg bg-white border border-[#E2E9DF] rounded-3xl text-center max-w-md w-full">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-[#E2E9DF] shadow-sm mb-5 p-3.5 animate-float">
          <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-xl" />
          <Sparkles size={20} className="absolute -top-2 -right-2 text-[#4B5D3C] animate-sparkle-spin" />
        </div>

        <h2 className="text-2xl font-bold text-[#26261F] tracking-tight font-serif">AI Journal</h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Loading daily reflection workspace & goals...
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#4B5D3C] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-[#3A492E] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-[#A3B899] animate-bounce" style={{ animationDelay: "300ms" }} />
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
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[#E2E9DF]/60 border border-[#E2E9DF] shadow-sm animate-target-pulse mb-6">
        <Target size={48} className="text-[#4B5D3C]" />
        <div className="absolute top-3 right-3 animate-dart">
          <span className="text-2xl">🎯</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Hitting Your Goal Targets...</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
        Organizing your goals, tracking progress, and preparing milestone updates.
      </p>
    </div>
  );
}

/* ANIMATED BOOK WRITING LOADING STATE FOR JOURNAL */
export function JournalLoadingState() {
  return (
    <div className="panel p-12 text-center shadow-md bg-white rounded-3xl animate-fade-in my-6">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[#E2E9DF]/60 border border-[#E2E9DF] shadow-sm animate-book-write mb-6">
        <BookOpen size={44} className="text-[#4B5D3C]" />
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
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[#E2E9DF]/60 border border-[#E2E9DF] shadow-sm animate-pulse-glow mb-6">
        <Sparkles size={48} className="text-[#4B5D3C] animate-sparkle-spin" />
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
