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
import { useState, useEffect, useRef, useMemo } from "react";
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



const progressTrendCache = new Map();

export default function Progress() {
  const { goals = [], journals = [], initialLoading } = useData();

  const loading = initialLoading && goals.length === 0 && journals.length === 0;

  // --- Progress History & Trend (backend data) ---
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [historyByGoal, setHistoryByGoal] = useState({});
  const [trendByGoal, setTrendByGoal] = useState({});
  const [histLoading, setHistLoading] = useState({});
  const [histError, setHistError] = useState({});

  // Analytics period ("7" | "30" | "90" | "all") used to request period-based progress gain.
  // Defaults to 30 days per the Progress Period requirement.
  const [periodDays, setPeriodDays] = useState("30");

  // Default to the first available goal.
  const activeGoalId = goals.some((g) => g.id === selectedGoalId)
    ? selectedGoalId
    : goals[0]?.id || null;

  // Fetch real progress history & trend whenever activeGoalId changes with 0ms in-memory cache
  useEffect(() => {
    if (!activeGoalId) return;

    const cacheKey = `${activeGoalId}_${periodDays}`;
    let isMounted = true;

    if (progressTrendCache.has(cacheKey)) {
      const cached = progressTrendCache.get(cacheKey);
      setHistoryByGoal((m) => ({ ...m, [activeGoalId]: cached.history }));
      setTrendByGoal((m) => ({ ...m, [activeGoalId]: cached.trendData }));
      setHistLoading((m) => ({ ...m, [activeGoalId]: false }));
    } else {
      setHistLoading((m) => ({ ...m, [activeGoalId]: true }));
    }

    const daysParam = periodDays === "all" ? undefined : parseInt(periodDays, 10);

    progressApi
      .getProgressTrend(activeGoalId, daysParam)
      .then((trendData) => {
        if (!isMounted) return;
        const sorted = (trendData?.history || [])
          .slice()
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        progressTrendCache.set(cacheKey, { history: sorted, trendData });
        setHistoryByGoal((m) => ({ ...m, [activeGoalId]: sorted }));
        setTrendByGoal((m) => ({ ...m, [activeGoalId]: trendData }));
        setHistError((m) => {
          const next = { ...m };
          delete next[activeGoalId];
          return next;
        });
      })
      .catch((err) => {
        // Fallback to basic history if trend endpoint failed
        return progressApi
          .getProgressHistory(activeGoalId)
          .then((history) => {
            if (!isMounted) return;
            const sorted = (history || [])
              .slice()
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            progressTrendCache.set(cacheKey, { history: sorted, trendData: null });
            setHistoryByGoal((m) => ({ ...m, [activeGoalId]: sorted }));
          })
          .catch((fetchErr) => {
            if (!isMounted) return;
            console.warn("Progress trend fetch notice:", fetchErr?.message || err?.message);
          });
      })
      .finally(() => {
        if (isMounted) {
          setHistLoading((m) => ({ ...m, [activeGoalId]: false }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeGoalId, periodDays]);

  const selectedGoal = goals.find((g) => g.id === activeGoalId) || null;
  const rawHistory = selectedGoal ? historyByGoal[selectedGoal.id] : null;

  // Instant baseline fallback from selectedGoal so chart & cards render with 0ms latency
  const progressHistory = useMemo(() => {
    if (rawHistory && rawHistory.length > 0) return rawHistory;
    if (!selectedGoal) return [];
    const prog = selectedGoal.status === "Completed" ? 100 : (selectedGoal.progress_value || 0);
    const createdDate = selectedGoal.created_at || selectedGoal.createdAt || new Date().toISOString();
    return [
      {
        id: `init-${selectedGoal.id}`,
        goal_id: selectedGoal.id,
        progress_value: 0,
        note: "Goal created",
        created_at: createdDate,
        change_from_previous: 0,
      },
      {
        id: `cur-${selectedGoal.id}`,
        goal_id: selectedGoal.id,
        progress_value: prog,
        note: selectedGoal.latest_progress_note || (prog >= 100 ? "Goal completed" : "Current progress"),
        created_at: new Date().toISOString(),
        change_from_previous: prog,
      },
    ];
  }, [rawHistory, selectedGoal]);

  const isHistoryLoading = selectedGoal ? !!histLoading[selectedGoal.id] : false;
  const historyError = selectedGoal ? histError[selectedGoal.id] || "" : "";
  const latest = progressHistory[progressHistory.length - 1] || null;
  const previous = progressHistory[progressHistory.length - 2] || null;
  const historyDelta =
    latest && previous
      ? latest.progress_value - previous.progress_value
      : null;

  // True when the selected period window contains at least one real progress
  // update (approximates the backend's `days` cutoff for messaging only —
  // displayed values always come from the API response, never invented).
  const hasUpdatesInPeriod =
    periodDays === "all" ||
    progressHistory.some(
      (r) =>
        Date.now() - new Date(r.created_at).getTime() <=
        Number(periodDays) * 24 * 60 * 60 * 1000
    );
    const chartData =
    periodDays === "all"
      ? progressHistory
      : progressHistory.filter((r) => {
          const cutoffMs = Date.now() - Number(periodDays) * 24 * 60 * 60 * 1000;
          return new Date(r.created_at).getTime() >= cutoffMs;
        });
  const currentTrend = selectedGoal ? trendByGoal[selectedGoal.id] : null;

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
    <div className="app-page bg-[#F4F1E8] min-h-screen">
      <main className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        {loading ? (
          <section className="panel px-6 py-16 text-center shadow-xs">
            <p className="text-sm font-medium text-slate-500">Loading your performance metrics…</p>
          </section>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* METRICS STAT CARDS */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<TrendingUp size={18} className="text-[#4B5D3C]" />}
                iconBg="bg-[#E2E9DF]"
                label="WEEKLY ACTIVITY"
                value={`${totalWeeklyActivities} logs`}
                detail="this week"
              />
              <StatCard
                icon={<Flame size={18} className="text-[#C1622C]" />}
                iconBg="bg-[#FBEBE3]"
                label="ACTIVE STREAK"
                value={`${streak} Days`}
                detail="consistent momentum"
              />
              <StatCard
                icon={<CheckCircle2 size={18} className="text-[#4B5D3C]" />}
                iconBg="bg-[#E2E9DF]"
                label="TOTAL ACTIVITIES"
                value={String(completedActivities)}
                detail="reflections & goals"
              />
            </div>

            {/* CHART + OVERALL GOAL PROGRESS */}
            <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
              {/* WEEKLY CONSISTENCY BAR CHART */}
              <div className="panel p-6 shadow-xs bg-white rounded-2xl border border-[#E2E9DF]">
                <p className="section-label text-[#4B5D3C]">ACTIVITY OVERVIEW</p>
                <h2 className="mt-1 text-xl font-bold text-[#26261F]">
                  Weekly Consistency
                </h2>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Reflections and goal milestones logged over the current week.
                </p>

                <div className="mt-6 flex h-52 items-end gap-3 sm:gap-4 border-b border-[#E2E9DF] pb-3">
                  {weeklyData.map((item) => (
                    <div key={item.day} className="flex h-full flex-1 flex-col justify-end items-center">
                      {item.count > 0 && (
                        <span className="mb-1.5 text-xs font-bold text-[#4B5D3C] font-mono">
                          {item.count}
                        </span>
                      )}
                      <div className="flex h-full w-full items-end justify-center">
                        <div
                          className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                            item.count > 0
                              ? "bg-gradient-to-t from-[#3A492E] to-[#4B5D3C] shadow-2xs hover:brightness-110"
                              : "bg-slate-100 h-2"
                          }`}
                          style={{ height: item.count > 0 ? `${item.value}%` : "8px" }}
                        />
                      </div>
                      <span className="mt-2 text-center text-[11px] font-bold tracking-wider text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OVERALL GOAL PROGRESS CIRCLE */}
              <div className="panel p-6 shadow-xs bg-white rounded-2xl border border-[#E2E9DF] flex flex-col justify-between">
                <div>
                  <p className="section-label text-[#4B5D3C]">GOAL COMPLETION</p>
                  <h2 className="mt-1 text-xl font-bold text-[#26261F]">
                    Overall Progress
                  </h2>

                  <div className="mt-6 flex justify-center">
                    <CircularProgress
                      value={overallProgress}
                      className="w-36 h-36"
                      fillClass="stroke-[#4B5D3C]"
                      trackClass="stroke-[#E2E9DF]"
                      center={
                        <div className="text-center">
                          <span className="text-2xl font-bold text-[#26261F]">{overallProgress}%</span>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[#4B5D3C] font-bold">
                            Complete
                          </p>
                        </div>
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-[#E2E9DF] pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">
                        {goals.length > 0 ? "Active Goals on Track" : "Reflections Logged"}
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-[#26261F]">
                        {goals.length > 0
                          ? `${activeGoalsCount} / ${goals.length}`
                          : `${journals.length} entries`}
                      </p>
                    </div>
                    <Target size={20} className="text-[#4B5D3C]" />
                  </div>
                </div>
              </div>
            </div>

            {/* PROGRESS HISTORY & TREND */}
            <section className="panel p-6 shadow-xs bg-white rounded-2xl border border-[#E2E9DF]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-[#E2E9DF]">
                <div>
                  <p className="section-label text-[#4B5D3C]">PROGRESS TREND</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <h2 className="text-xl font-bold text-[#26261F]">
                      Progress History & Trend
                    </h2>
                    {currentTrend && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          currentTrend.trend_direction === "improving"
                            ? "bg-[#E2E9DF] text-[#4B5D3C] border-[#4B5D3C]/30"
                            : currentTrend.trend_direction === "declining"
                            ? "bg-[#FBEBE3] text-[#C1622C] border-[#C1622C]/30"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {currentTrend.trend_direction}
                      </span>
                    )}
                  </div>
                  {selectedGoal && (
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      Tracking goal: <strong className="text-[#26261F]">{selectedGoal.title}</strong>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Progress Period selector — always visible */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="progress-period"
                      className="whitespace-nowrap text-xs font-semibold text-slate-500"
                    >
                      Progress Period
                    </label>
                    <div className="relative">
                      <select
                        id="progress-period"
                        aria-label="Select progress analytics period"
                        value={periodDays}
                        onChange={(e) => setPeriodDays(e.target.value)}
                        className="appearance-none rounded-xl border border-[#E2E9DF] bg-white pl-3 pr-8 py-1.5 text-xs font-semibold text-[#26261F] shadow-2xs transition focus:border-[#4B5D3C] focus:ring-1 focus:ring-[#4B5D3C]"
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All time</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  {goals.length > 1 && (
                    <div className="relative">
                      <select
                        value={activeGoalId || ""}
                        onChange={(e) => setSelectedGoalId(e.target.value)}
                        className="appearance-none rounded-xl border border-[#E2E9DF] bg-white pl-3 pr-8 py-1.5 text-xs font-semibold text-[#26261F] shadow-2xs transition focus:border-[#4B5D3C] focus:ring-1 focus:ring-[#4B5D3C]"
                        aria-label="Select goal to view history"
                      >
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title || "Untitled Goal"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {goals.length === 0 ? (
                <div className="py-10 text-center rounded-xl bg-[#F4F1E8]/50 border border-[#E2E9DF]">
                  <Target size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-[#26261F]">No goals created yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                    Set a goal in the Goals tab to track progress trajectory.
                  </p>
                </div>
              ) : isHistoryLoading && progressHistory.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs font-medium text-slate-500">Loading progress history…</p>
                </div>
              ) : historyError && progressHistory.length === 0 ? (
                <div className="rounded-xl border border-[#C1622C]/30 bg-[#FBEBE3] p-4 text-center">
                  <p className="text-xs font-semibold text-[#C1622C] mb-2">{historyError}</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const currentProgressValue = currentTrend?.current_progress ?? (selectedGoal?.progress_value || 0);
                    const latestEntry = progressHistory && progressHistory.length > 0 ? progressHistory[progressHistory.length - 1] : null;
                    const latestNote = latestEntry?.note || selectedGoal?.latest_progress_note;

                    return (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 my-4">
                          <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Progress</span>
                            <span className="mt-1 text-2xl font-extrabold text-[#26261F]">
                              {currentProgressValue}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Target completion level</span>
                          </div>

                          <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Velocity</span>
                            <span className="mt-1 text-lg font-bold text-[#26261F] capitalize">
                              {currentTrend?.trend_direction || "Stagnant"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Direction vector</span>
                          </div>

                          <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Milestone Gain</span>
                            <span className={`mt-1 text-2xl font-extrabold ${
                              (currentTrend?.net_change || 0) > 0 ? "text-[#4B5D3C]" : (currentTrend?.net_change || 0) < 0 ? "text-[#C1622C]" : "text-slate-700"
                            }`}>
                              {formatChange(currentTrend?.net_change || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Total progress delta</span>
                          </div>

                          <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Updates Logged</span>
                            <span className="mt-1 text-2xl font-extrabold text-[#26261F]">
                              {currentTrend?.total_updates ?? progressHistory.length}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Checkpoints saved</span>
                          </div>
                        </div>

                        {/* ANALYTICS STRIP — real values from the Progress Trend API */}
                        <div className="grid gap-3 sm:grid-cols-3 my-4">
                          <div className="rounded-xl bg-white p-3 border border-[#E2E9DF] flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Progress Change</span>
                            <span className="text-base font-extrabold text-[#4B5D3C]">
                              {typeof currentTrend?.average_progress_change === "number"
                                ? currentTrend.average_progress_change.toFixed(2)
                                : "—"}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white p-3 border border-[#E2E9DF] flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stagnant Updates</span>
                            <span className="text-base font-extrabold text-[#26261F]">
                              {currentTrend?.stagnant_updates ?? 0}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white p-3 border border-[#E2E9DF]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period Progress Gain</span>
                              {/* Period is selected via the "Progress Period" control in the section header */}
                            </div>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-base font-extrabold text-[#26261F]">
                                {currentTrend?.period_progress_gain != null ? formatChange(currentTrend.period_progress_gain) : "—"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {periodDays !== "all" && !hasUpdatesInPeriod
                                  ? "No progress updates found for this period."
                                  : currentTrend?.period_days
                                  ? `last ${currentTrend.period_days}d`
                                  : "all time"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentProgressValue >= 100 && (
                          <div className="mt-4 rounded-xl border border-[#4B5D3C]/30 bg-[#E2E9DF] p-3.5 text-[#26261F] flex items-center justify-between gap-3 font-semibold text-xs animate-fade-in shadow-2xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-[#4B5D3C] shrink-0" />
                              <span>This goal was marked as completed (100% Milestone Achieved).</span>
                            </div>
                            <span className="text-xs font-bold text-[#4B5D3C] bg-white px-2.5 py-0.5 rounded-md border border-[#4B5D3C]/20 shadow-2xs shrink-0">
                              🎉 100%
                            </span>
                          </div>
                        )}

                        {latestNote && (
                          <p className="mt-3 rounded-xl border border-[#E2E9DF] bg-[#F4F1E8]/80 px-3.5 py-2.5 text-xs text-[#26261F] font-medium">
                            <span className="font-bold text-[#4B5D3C]">Note: </span>
                            {latestNote}
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-5 rounded-xl border border-[#E2E9DF] bg-white p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Progress over time
                    </p>
                    <TrendChart data={chartData} />
                  </div>

                                    <div className="mt-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {periodDays === "all" ? "All updates" : `Updates in last ${periodDays} days`} ({chartData.length})
                    </p>
                    <div className="divide-y divide-[#E2E9DF] border-t border-[#E2E9DF]">
                      {chartData.slice().reverse().map((record, idx, arr) => (
                        <div key={record.id || idx} className="flex items-start justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#26261F]">
                              {record.progress_value}% — {arr[0].id === record.id ? "Latest" : formatRelativeDate(record.created_at)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                              {formatFullDateTime(record.created_at)}
                            </p>
                            {record.note && (
                              <p className="mt-0.5 text-xs text-slate-600 font-medium leading-snug">
                                {record.note}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              idx > 0
                                ? record.progress_value > arr[idx - 1].progress_value
                                  ? "bg-[#E2E9DF] text-[#4B5D3C]"
                                  : record.progress_value < arr[idx - 1].progress_value
                                  ? "bg-[#FBEBE3] text-[#C1622C]"
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
            <section className="panel p-6 shadow-xs bg-white rounded-2xl border border-[#E2E9DF]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E9DF]">
                <div>
                  <p className="section-label text-[#4B5D3C]">ACTIVITY LOG</p>
                  <h2 className="mt-1 text-xl font-bold text-[#26261F]">Recent Progress & Activity</h2>
                </div>
                <CalendarDays size={20} className="text-[#4B5D3C]" />
              </div>

              <div className="divide-y divide-[#E2E9DF]">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center font-medium">
                    No recent activity recorded yet.
                  </p>
                ) : (
                  recentActivity.map((act) => (
                    <div key={act.id} className="py-3 flex items-start justify-between gap-3 first:pt-1 last:pb-1">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          act.type === "journal" ? "bg-[#E2E9DF] text-[#4B5D3C]" : "bg-[#E2E9DF] text-[#4B5D3C]"
                        }`}>
                          {act.type === "journal" ? <BookOpen size={15} /> : <Target size={15} />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#26261F] leading-snug">{act.title}</h3>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 font-medium">{act.detail}</p>
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

function StatCard({ icon, iconBg = "bg-[#E2E9DF]", label, value, detail }) {
  return (
    <div className="panel p-5 shadow-xs bg-white rounded-2xl border border-[#E2E9DF] flex flex-col justify-between hover:shadow-sm transition">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="mt-4">
        <p className="section-label text-[10px] font-extrabold">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#26261F]">{value}</span>
          <span className="text-xs text-slate-500 font-medium">{detail}</span>
        </div>
      </div>
    </div>
  );
}
