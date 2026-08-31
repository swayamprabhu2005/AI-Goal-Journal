import {
  TrendingUp,
  Flame,
  CheckCircle2,
  CalendarDays,
  Target,
} from "lucide-react";
import { useData } from "../context/DataContext";

function computeStreak(journals) {
  if (!journals || journals.length === 0) return 0;
  const dates = new Set(
    journals.map((j) =>
      new Date(j.created_at || j.createdAt).toDateString()
    )
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    if (dates.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function computeWeeklyData(journals, goals) {
  const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const raw = labels.map((label, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const count = [...journals, ...goals].filter((item) => {
      const d = new Date(item.created_at || item.createdAt);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    }).length;
    return { day: label, value: count };
  });

  const max = Math.max(...raw.map((d) => d.value), 1);
  return raw.map((d) => ({
    day: d.day,
    value: Math.round((d.value / max) * 100),
  }));
}

function formatRelativeDate(date) {
  if (!date) return "";
  const created = new Date(date);
  if (Number.isNaN(created.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return created.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Progress() {
  const { goals = [], journals = [], progress = {}, initialLoading } = useData();
  const loading = initialLoading;

  const weeklyData = computeWeeklyData(journals, goals);
  const average = Math.round(
    weeklyData.reduce((sum, item) => sum + item.value, 0) / (weeklyData.length || 1)
  );

  const streak = computeStreak(journals);
  const completedActivities = goals.length + journals.length;

  const goalProgressValues = goals.map((goal) => {
    const latestProgress = progress?.[goal.id];
    if (latestProgress?.progress_value !== undefined) {
      return Number(latestProgress.progress_value);
    }
    if (goal.status?.toLowerCase() === "completed") {
      return 100;
    }
    return Number(goal.progress_value || 0);
  });

  const overallProgress =
    goalProgressValues.length > 0
      ? Math.round(
          goalProgressValues.reduce((sum, value) => sum + value, 0) /
            goalProgressValues.length
        )
      : 0;

  const activeGoalsCount = goals.filter(
    (g) => g.status?.toLowerCase() !== "completed"
  ).length;

  const recentActivity = [
    ...journals.map((j) => ({
      id: `journal-${j.id}`,
      title: j.title || j.ai_analysis?.title || "Untitled Reflection",
      detail: j.content?.substring(0, 65) || "",
      time: formatRelativeDate(j.created_at || j.createdAt),
      sortDate: j.created_at || j.createdAt,
    })),
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      title: g.title,
      detail: g.description || "Active goal milestone",
      time: formatRelativeDate(g.created_at || g.createdAt),
      sortDate: g.created_at || g.createdAt,
    })),
    ...Object.values(progress || {}).map((p) => {
      const relatedGoal = goals.find((g) => String(g.id) === String(p.goal_id));
      return {
        id: `progress-${p.id}`,
        title: relatedGoal?.title
          ? `${relatedGoal.title} — ${p.progress_value}%`
          : `Goal Progress — ${p.progress_value}%`,
        detail: p.note || "Progress updated",
        time: formatRelativeDate(p.created_at),
        sortDate: p.created_at,
      };
    }),
  ]
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
    .slice(0, 5);

  // SVG Ring Progress Calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="app-page">
      <header className="border-b border-slate-200 bg-white px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1250px]">
          <p className="section-label">PERFORMANCE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Progress Velocity
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track weekly momentum, journal streaks, and average goal completion metrics.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10">
        {loading ? (
          <section className="panel px-6 py-20 text-center shadow-card bg-white border border-slate-200">
            <p className="text-sm text-slate-500">Loading progress telemetry…</p>
          </section>
        ) : (
          <>
            {/* METRICS GRID */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<TrendingUp size={18} />}
                label="WEEKLY PROGRESS"
                value={`${average}%`}
                detail="average momentum"
              />
              <StatCard
                icon={<Flame size={18} />}
                label="CURRENT STREAK"
                value={String(streak)}
                detail="consecutive days"
              />
              <StatCard
                icon={<CheckCircle2 size={18} />}
                label="COMPLETED"
                value={String(completedActivities)}
                detail="activities & entries"
              />
            </div>

            {/* CHART + OVERALL RING */}
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
              <div className="panel p-6 shadow-card bg-white border border-slate-200 md:p-7">
                <p className="section-label">ACTIVITY OVERVIEW</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Weekly Consistency
                </h2>
                <div className="mt-8 flex h-56 items-end gap-3">
                  {weeklyData.map((item) => (
                    <div key={item.day} className="flex h-full flex-1 flex-col justify-end">
                      <div className="flex h-full items-end">
                        <div
                          className="mx-auto w-full max-w-[42px] rounded-t-lg bg-teal-600 transition hover:bg-teal-700 shadow-sm"
                          style={{ height: `${Math.max(12, item.value)}%` }}
                        />
                      </div>
                      <span className="mt-3 text-center text-[10px] font-bold tracking-wider text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DYNAMIC OVERALL PROGRESS RING */}
              <div className="panel p-6 shadow-card bg-white border border-slate-200 md:p-7">
                <p className="section-label">GOAL COMPLETION</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Overall Progress
                </h2>

                <div className="mt-6 flex justify-center">
                  <div className="relative flex items-center justify-center">
                    <svg className="h-44 w-44 -rotate-90 transform">
                      <circle
                        cx="88"
                        cy="88"
                        r={radius}
                        className="text-slate-100"
                        strokeWidth="14"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="88"
                        cy="88"
                        r={radius}
                        className="text-teal-700 transition-all duration-1000 ease-out"
                        strokeWidth="14"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-3xl font-extrabold text-slate-900">
                        {overallProgress}%
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase font-bold tracking-[0.15em] text-slate-500">
                        COMPLETE
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Goals On Track
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {goals.length === 0 ? "0 / 0" : `${activeGoalsCount} / ${goals.length}`}
                      </p>
                    </div>
                    <Target size={20} className="text-teal-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIVITY LOG */}
            <section className="panel mt-5 p-6 shadow-card bg-white border border-slate-200 md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">ACTIVITY LOG</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Recent Progress
                  </h2>
                </div>
                <CalendarDays size={20} className="text-slate-400" />
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {recentActivity.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 size={22} className="mx-auto text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      No activity recorded yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your goal milestones and journal entries will appear here.
                    </p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 py-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">
                          {activity.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {activity.detail}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {activity.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="panel p-5 shadow-card bg-white border border-slate-200">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
        {icon}
      </div>
      <p className="mt-4 section-label">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500 font-medium">{detail}</span>
      </div>
    </div>
  );
}