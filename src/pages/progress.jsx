import {
  TrendingUp,
  Flame,
  CheckCircle2,
  CalendarDays,
  Target,
  BookOpen,
  TrendingDown,
  Minus,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import { progressApi } from "../services/api";
import CircularProgress from "../components/CircularProgress";
import TrendChart from "../components/TrendChart";

function computeStreak(journals) {
  if (!journals || journals.length === 0) return 0;
  const dates = new Set(
    journals.map((j) => new Date(j.created_at || j.createdAt).toDateString())
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

    return { day: label, count };
  });

  const max = Math.max(...raw.map((d) => d.count), 1);

  return raw.map((d) => ({
    day: d.day,
    count: d.count,
    value: d.count > 0 ? Math.max(20, Math.round((d.count / max) * 100)) : 0,
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

  return created.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/** Short date label for the SVG x-axis (e.g. "5 Feb"). */
function formatChartDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Readable full date + time for the history list. */
function formatFullDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Human-friendly progress change text: "+5%", "-3%", "0%". */
function formatChange(value) {
  if (typeof value !== "number") return "0%";
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return "0%";
}



export default function Progress() {
  const { goals = [], journals = [], initialLoading } = useData();

  const loading = initialLoading && goals.length === 0 && journals.length === 0;

  // --- Progress History & Trend (backend data) ---
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [historyByGoal, setHistoryByGoal] = useState({});
  const [trendByGoal, setTrendByGoal] = useState({});
  const [histLoading, setHistLoading] = useState({});
  const [histError, setHistError] = useState({});

  // Default to the first available goal.
  const activeGoalId = goals.some((g) => g.id === selectedGoalId)
    ? selectedGoalId
    : goals[0]?.id || null;

  // Fetch real progress history & trend whenever activeGoalId changes
  useEffect(() => {
    if (!activeGoalId) return;

    let isMounted = true;
    setHistLoading((m) => ({ ...m, [activeGoalId]: true }));

    progressApi
      .getProgressTrend(activeGoalId)
      .then((trendData) => {
        if (!isMounted) return;
        const sorted = (trendData?.history || [])
          .slice()
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setHistoryByGoal((m) => ({ ...m, [activeGoalId]: sorted }));
        setTrendByGoal((m) => ({ ...m, [activeGoalId]: trendData }));
        setHistError((m) => {
          const next = { ...m };
          delete next[activeGoalId];
          return next;
        });
      })
      .catch(() => {
        return progressApi.getProgressHistory(activeGoalId).then((history) => {
          if (!isMounted) return;
          const sorted = (history || [])
            .slice()
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          setHistoryByGoal((m) => ({ ...m, [activeGoalId]: sorted }));
          setHistError((m) => {
            const next = { ...m };
            delete next[activeGoalId];
            return next;
          });
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setHistError((m) => ({
          ...m,
          [activeGoalId]: err?.message || "Failed to load progress history.",
        }));
      })
      .finally(() => {
        if (isMounted) {
          setHistLoading((m) => ({ ...m, [activeGoalId]: false }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeGoalId]);

  const selectedGoal = goals.find((g) => g.id === activeGoalId) || null;
  const progressHistory = selectedGoal ? historyByGoal[selectedGoal.id] || [] : [];
  const isHistoryLoading = selectedGoal ? !!histLoading[selectedGoal.id] : false;
  const historyError = selectedGoal ? histError[selectedGoal.id] || "" : "";
  const latest = progressHistory[progressHistory.length - 1] || null;
  const previous = progressHistory[progressHistory.length - 2] || null;
  const historyDelta =
    latest && previous
      ? latest.progress_value - previous.progress_value
      : null;

  const currentTrend = selectedGoal ? trendByGoal[selectedGoal.id]?.trend_direction : null;

  const weeklyData = computeWeeklyData(journals, goals);
  const totalWeeklyActivities = weeklyData.reduce((sum, item) => sum + item.count, 0);
  const average = Math.round(
    (totalWeeklyActivities / 7) * 100
  );
  const streak = computeStreak(journals);
  const completedActivities = goals.length + journals.length;
  
  const completedGoalsCount = goals.filter((g) => g.status?.toLowerCase() === "completed").length;
  const activeGoalsCount = goals.filter((g) => g.status?.toLowerCase() === "active").length;

  const overallProgress = (() => {
    if (goals.length > 0) {
      return Math.min(
        100,
        Math.round(((completedGoalsCount * 1.0 + activeGoalsCount * 0.5) / goals.length) * 100)
      );
    }
    if (journals.length > 0) {
      return Math.min(100, journals.length * 25);
    }
    return 0;
  })();

  const recentActivity = [
    ...journals.map((j) => ({
      id: `journal-${j.id}`,
      title: j.title || "Reflection Entry",
      detail: j.content?.substring(0, 70) || "",
      time: formatRelativeDate(j.created_at || j.createdAt),
      sortDate: j.created_at || j.createdAt,
      type: "journal",
    })),
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      title: g.title,
      detail: g.description || "Goal milestone",
      time: formatRelativeDate(g.created_at || g.createdAt),
      sortDate: g.created_at || g.createdAt,
      type: "goal",
    })),
  ]
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
    .slice(0, 5);

  return (
    <div className="app-page bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-[1350px] px-6 py-8 md:px-10 lg:px-12">
        {loading ? (
          <section className="panel px-6 py-20 text-center shadow-sm">
            <p className="text-base font-medium text-slate-500">Loading your performance metrics…</p>
          </section>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* METRICS STAT CARDS */}
            <div className="grid gap-5 md:grid-cols-3">
              <StatCard
                icon={<TrendingUp size={20} className="text-indigo-600" />}
                iconBg="bg-indigo-50"
                label="WEEKLY ACTIVITY"
                value={`${totalWeeklyActivities} logs`}
                detail="this week"
              />
              <StatCard
                icon={<Flame size={20} className="text-amber-500" />}
                iconBg="bg-amber-50"
                label="ACTIVE STREAK"
                value={`${streak} Days`}
                detail="consistent momentum"
              />
              <StatCard
                icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="TOTAL ACTIVITIES"
                value={String(completedActivities)}
                detail="reflections & goals"
              />
            </div>

            {/* CHART + OVERALL GOAL PROGRESS */}
            <div className="grid gap-7 lg:grid-cols-[1.6fr_0.9fr]">
              {/* WEEKLY CONSISTENCY BAR CHART */}
              <div className="panel p-7 sm:p-8 shadow-sm bg-white rounded-3xl">
                <p className="section-label">ACTIVITY OVERVIEW</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Weekly Consistency
                </h2>
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  Reflections and goal milestones logged over the current week.
                </p>

                <div className="mt-8 flex h-60 items-end gap-3 sm:gap-4 border-b border-slate-100 pb-4">
                  {weeklyData.map((item) => (
                    <div key={item.day} className="flex h-full flex-1 flex-col justify-end items-center">
                      {item.count > 0 && (
                        <span className="mb-2 text-xs font-bold text-indigo-600 font-mono">
                          {item.count}
                        </span>
                      )}
                      <div className="flex h-full w-full items-end justify-center">
                        <div
                          className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                            item.count > 0
                              ? "bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-sm hover:brightness-110"
                              : "bg-slate-100 h-2"
                          }`}
                          style={{ height: item.count > 0 ? `${item.value}%` : "8px" }}
                        />
                      </div>
                      <span className="mt-3 text-center text-xs font-bold tracking-wider text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OVERALL GOAL PROGRESS CIRCLE */}
              <div className="panel p-7 sm:p-8 shadow-sm bg-white rounded-3xl flex flex-col justify-between">
                <div>
                  <p className="section-label">GOAL COMPLETION</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Overall Progress
                  </h2>

                  <div className="mt-8 flex justify-center">
                    <CircularProgress
                      value={overallProgress}
                      className="w-44 h-44"
                      fillClass="stroke-indigo-600"
                      trackClass="stroke-slate-100"
                      center={
                        <div className="text-center">
                          <span className="text-3xl font-bold text-slate-900">{overallProgress}%</span>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">
                            Complete
                          </p>
                        </div>
                      }
                    />
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">
                        {goals.length > 0 ? "Active Goals on Track" : "Reflections Logged"}
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {goals.length > 0
                          ? `${activeGoalsCount} / ${goals.length}`
                          : `${journals.length} entries`}
                      </p>
                    </div>
                    <Target size={22} className="text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* PROGRESS HISTORY & TREND */}
            <section className="panel p-7 sm:p-8 shadow-sm bg-white rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <p className="section-label">PROGRESS TREND</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <h2 className="text-2xl font-bold text-slate-900">
                      Progress History & Trend
                    </h2>
                    {currentTrend && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        currentTrend === 'improving' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        currentTrend === 'declining' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {currentTrend}
                      </span>
                    )}
                    {(selectedGoal?.status?.toLowerCase() === "completed" || (selectedGoal?.progress_value || 0) >= 100) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Goal selector */}
                {goals.length > 1 && (
                  <div className="relative">
                    <select
                      value={activeGoalId || ""}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      aria-label="Select goal to view progress history"
                    >
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title || "Untitled Goal"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                )}
              </div>

              {goals.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-10 text-center font-medium">
                  Add a goal to start tracking progress history.
                </p>
              ) : isHistoryLoading ? (
                <div className="space-y-4 animate-pulse py-4" aria-busy="true" aria-label="Loading progress history">
                  <div className="h-16 w-full rounded-xl bg-slate-100" />
                  <div className="h-56 w-full rounded-xl bg-slate-100" />
                </div>
              ) : historyError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                  <TrendingDown size={24} className="mx-auto text-red-500 mb-2" />
                  <p className="text-sm font-semibold text-red-700">
                    Couldn't load progress history for this goal.
                  </p>
                  <p className="mt-1 text-xs text-red-500 font-medium">{historyError}</p>
                </div>
              ) : progressHistory.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-10 text-center font-medium">
                  No progress updates recorded yet.
                </p>
              ) : (
                <>
                  {/* Latest / Previous / Change summary */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Latest progress
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {latest?.progress_value ?? "—"}%
                      </p>
                      {latest?.created_at && (
                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                          {formatFullDateTime(latest.created_at)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Previous progress
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {previous?.progress_value ?? "—"}%
                      </p>
                      {previous?.created_at && (
                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                          {formatFullDateTime(previous.created_at)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Change
                      </p>
                      <div className={`mt-1.5 inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-lg font-bold ${
                        historyDelta > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : historyDelta < 0
                          ? "bg-rose-50 text-rose-600"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {historyDelta > 0 ? (
                          <TrendingUp size={18} />
                        ) : historyDelta < 0 ? (
                          <TrendingDown size={18} />
                        ) : (
                          <Minus size={18} />
                        )}
                        {formatChange(historyDelta)}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 font-medium">
                        vs previous update
                      </p>
                    </div>
                  </div>

                  {/* Completed Goal Milestone Banner */}
                  {(selectedGoal?.status?.toLowerCase() === "completed" || (selectedGoal?.progress_value || 0) >= 100) && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 flex items-center justify-between gap-3 font-semibold text-sm animate-fade-in shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={19} className="text-emerald-600 shrink-0" />
                        <span>This goal was marked as completed (100% Milestone Achieved).</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs shrink-0">
                        🎉 100%
                      </span>
                    </div>
                  )}

                  {/* Latest progress note */}
                  {latest?.note && (
                    <p className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-slate-700 font-medium">
                      <span className="font-bold text-indigo-700">Note: </span>
                      {latest.note}
                    </p>
                  )}

                  {/* Trend chart */}
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Progress over time
                    </p>
                    <TrendChart data={progressHistory} />
                  </div>

                  {/* Full history list */}
                  <div className="mt-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      All updates ({progressHistory.length})
                    </p>
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      {progressHistory.slice().reverse().map((record, idx, arr) => (
                        <div key={record.id || idx} className="flex items-start justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">
                              {record.progress_value}% — {arr[0].id === record.id ? "Latest" : formatRelativeDate(record.created_at)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 font-medium">
                              {formatFullDateTime(record.created_at)}
                            </p>
                            {record.note && (
                              <p className="mt-1 text-sm text-slate-600 font-medium leading-snug">
                                {record.note}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                              idx > 0
                                ? record.progress_value > arr[idx - 1].progress_value
                                  ? "bg-emerald-50 text-emerald-600"
                                  : record.progress_value < arr[idx - 1].progress_value
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-slate-100 text-slate-500"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {idx > 0 ? formatChange(record.progress_value - arr[idx - 1].progress_value) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* RECENT ACTIVITY LOG */}
            <section className="panel p-7 sm:p-8 shadow-sm bg-white rounded-3xl">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div>
                  <p className="section-label">ACTIVITY LOG</p>
                  <h2 className="mt-1.5 text-2xl font-bold text-slate-900">Recent Progress & Activity</h2>
                </div>
                <CalendarDays size={22} className="text-indigo-600" />
              </div>

              <div className="divide-y divide-slate-100">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-8 text-center font-medium">
                    No recent activity recorded yet.
                  </p>
                ) : (
                  recentActivity.map((act) => (
                    <div key={act.id} className="py-4.5 flex items-start justify-between gap-4 first:pt-2 last:pb-2">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          act.type === "journal" ? "bg-purple-50 text-purple-600" : "bg-indigo-50 text-indigo-600"
                        }`}>
                          {act.type === "journal" ? <BookOpen size={16} /> : <Target size={16} />}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">{act.title}</h3>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-1 font-medium">{act.detail}</p>
                        </div>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400 font-mono font-medium">
                        {act.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, iconBg = "bg-indigo-50", label, value, detail }) {
  return (
    <div className="panel p-6 shadow-sm bg-white rounded-3xl flex flex-col justify-between hover:shadow-md transition">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}>
        {icon}
      </div>
      <div className="mt-5">
        <p className="section-label text-xs font-bold">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
          <span className="text-xs text-slate-500 font-medium">{detail}</span>
        </div>
      </div>
    </div>
  );
}
