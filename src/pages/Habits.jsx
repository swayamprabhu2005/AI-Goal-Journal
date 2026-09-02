import {
  Repeat,
  Plus,
  X,
  Check,
  Flame,
  Trash2,
  Pencil,
  CalendarCheck,
  Trophy,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  dayLabel,
  todayISO,
  calculateBestStreak,
  getWeekDays,
  formatDayNumberWithOrdinal,
  fromISODate,
} from "../utils/habitStorage";
import { habitApi } from "../services/api";
import { spawnGrowthParticles, popIn, floatLoop } from "../animations/motion";

/**
 * Convert a backend `completed_date` (ISO datetime) into a local 'YYYY-MM-DD'
 * string so it can be compared against the 7-day grid's local dates.
 */
function dateToISO(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Map an array of backend logs into a sorted array of 'YYYY-MM-DD' strings. */
function logsToDates(logs) {
  return (logs || [])
    .map((log) => dateToISO(log.completed_date))
    .filter((d) => d !== null)
    .sort();
}

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

function StatCard({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconClass}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [statusMap, setStatusMap] = useState({});

  // Page async state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Action error state (delete / complete / uncomplete)
  const [actionError, setActionError] = useState("");
  const [pendingToggles, setPendingToggles] = useState({});

  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekRangeLabel = useMemo(() => {
    if (week.length === 0) return "";
    const first = fromISODate(week[0]);
    const last = fromISODate(week[6]);
    const firstFormatted = first.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const lastFormatted = last.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (weekOffset === 0) return `This Week (${firstFormatted} – ${lastFormatted})`;
    if (weekOffset === -1) return `Last Week (${firstFormatted} – ${lastFormatted})`;
    if (weekOffset === 1) return `Next Week (${firstFormatted} – ${lastFormatted})`;
    return `${firstFormatted} – ${lastFormatted}`;
  }, [week, weekOffset]);
  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const dueToday = habits.filter((h) => h.frequency !== "weekly").length;
    const doneToday = habits.filter(
      (h) => h.frequency !== "weekly" && statusMap[h.id]?.completed_today
    ).length;

    let activeStreaks = 0;
    let bestStreak = 0;
    habits.forEach((h) => {
      if ((statusMap[h.id]?.current_streak ?? 0) > 0) activeStreaks += 1;
      bestStreak = Math.max(bestStreak, calculateBestStreak(completions[h.id] || []));
    });

    return { totalHabits, dueToday, doneToday, activeStreaks, bestStreak };
  }, [habits, statusMap, completions]);

  /**
   * Refresh backend status (completed_today/current_streak) and completion
   * logs for a single habit and update both frontend maps.
   */
  async function refreshHabitData(habitId) {
    const [status, logs] = await Promise.all([
      habitApi.getHabitStatus(habitId).catch(() => null),
      habitApi.getHabitLogs(habitId).catch(() => null),
    ]);
    if (status) setStatusMap((m) => ({ ...m, [habitId]: status }));
    if (logs) setCompletions((m) => ({ ...m, [habitId]: logsToDates(logs) }));
  }

  // Initial load: fetch habits + per-habit status and completion logs.
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const habitList = await habitApi.listHabits();
        if (!isMounted) return;

        // Eagerly set habits and dismiss skeleton loading immediately!
        setHabits(habitList || []);
        setLoading(false);

        if (!habitList || habitList.length === 0) return;

        // Fetch per-habit status and completion history in parallel
        const enriched = await Promise.all(
          habitList.map(async (h) => {
            const [status, logs] = await Promise.all([
              habitApi.getHabitStatus(h.id).catch(() => null),
              habitApi.getHabitLogs(h.id).catch(() => null),
            ]);
            return { habit: h, status, logs: logsToDates(logs) };
          })
        );
        if (!isMounted) return;

        const nextStatus = {};
        const nextCompletions = {};
        enriched.forEach(({ habit, status, logs }) => {
          if (status) nextStatus[habit.id] = status;
          if (logs) nextCompletions[habit.id] = logs;
        });

        setStatusMap(nextStatus);
        setCompletions(nextCompletions);
      } catch (err) {
        if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
          return;
        }
        if (isMounted) {
          setLoadError(err?.message || "Failed to load habits. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  function resetForm() {
    setName("");
    setDescription("");
    setFrequency("daily");
    setEditingHabit(null);
    setFormError("");
    setSubmitting(false);
    setShowFormModal(false);
  }

  function openCreate() {
    setEditingHabit(null);
    setName("");
    setDescription("");
    setFrequency("daily");
    setFormError("");
    setShowFormModal(true);
  }

  function openEdit(habit) {
    setEditingHabit(habit);
    setName(habit.name || "");
    setDescription(habit.description || "");
    setFrequency(habit.frequency || "daily");
    setFormError("");
    setShowFormModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Habit name is required");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      if (editingHabit) {
        const updated = await habitApi.updateHabit(editingHabit.id, {
          name: name.trim(),
          description: description.trim() || null,
          frequency,
        });
        setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      } else {
        const created = await habitApi.createHabit({
          name: name.trim(),
          description: description.trim() || null,
          frequency,
        });
        setHabits((prev) => [created, ...prev]);
        // Seed the newly created habit's status/completions from the backend.
        await refreshHabitData(created.id);
      }
      resetForm();
    } catch (err) {
      setFormError(err?.message || "Failed to save habit. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingHabit) return;
    setActionError("");
    try {
      await habitApi.deleteHabit(deletingHabit.id);
      setHabits((prev) => prev.filter((h) => h.id !== deletingHabit.id));
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[deletingHabit.id];
        return next;
      });
      setStatusMap((prev) => {
        const next = { ...prev };
        delete next[deletingHabit.id];
        return next;
      });
      setDeletingHabit(null);
    } catch (err) {
      setActionError(err?.message || "Failed to delete habit. Please try again.");
    }
  }

  async function toggleCheck(habitId, date, isCompleting, btnEl) {
    const toggleKey = `${habitId}_${date}`;
    if (pendingToggles[toggleKey]) return; // prevent duplicate clicks while pending

    setActionError("");
    setPendingToggles((prev) => ({ ...prev, [toggleKey]: true }));

    // 1. Optimistic UI update: immediately flip state so user sees instant checkmark
    const isTargetToday = date === today;
    setCompletions((prev) => {
      const existing = prev[habitId] || [];
      const updated = isCompleting
        ? [...new Set([...existing, date])]
        : existing.filter((d) => d !== date);
      return { ...prev, [habitId]: updated };
    });

    if (isTargetToday) {
      setStatusMap((prev) => {
        const curr = prev[habitId] || { current_streak: 0 };
        return {
          ...prev,
          [habitId]: {
            ...curr,
            completed_today: isCompleting,
            current_streak: isCompleting
              ? (curr.current_streak || 0) + 1
              : Math.max(0, (curr.current_streak || 1) - 1),
          },
        };
      });
    }

    if (isCompleting && btnEl) {
      spawnGrowthParticles(btnEl, { count: 7 });
      const streakEl = btnEl.closest("[data-habit-card]")?.querySelector("[data-habit-streak]");
      if (streakEl) popIn(streakEl, { scale: 1.3 });
    }

    // 2. Perform backend sync
    try {
      if (isCompleting) {
        await habitApi.completeHabit(habitId, date);
      } else {
        await habitApi.uncompleteHabit(habitId, date);
      }
      // Re-sync authoritative streak & logs from backend
      await refreshHabitData(habitId);
    } catch (err) {
      // Revert optimistic update on error
      setActionError(err?.message || "Failed to update completion. Please try again.");
      await refreshHabitData(habitId);
    } finally {
      setPendingToggles((prev) => {
        const next = { ...prev };
        delete next[toggleKey];
        return next;
      });
    }
  }

  const today = todayISO();

  // Gentle float for the empty-state icon while no habits exist.
  useEffect(() => {
    if (habits.length > 0) return;
    const el = document.querySelector("[data-empty-float]");
    if (!el) return;
    return floatLoop(el);
  }, [habits.length]);


  return (
    <div className="app-page min-h-screen bg-slate-50 relative" data-particle-scope>
      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10 animate-rise">
        {/* PAGE HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Habit Tracker
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Build consistency with daily check-offs and streaks.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus size={17} />
          Add Habit
        </button>
      </header>

      {/* PAGE LOADING STATE */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" aria-busy="true" aria-label="Loading habits">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
              <div className="h-11 w-11 rounded-xl bg-slate-200" />
              <div className="mt-4 h-7 w-16 rounded-md bg-slate-200" />
              <div className="mt-1.5 h-3 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}

      {/* LOAD ERROR STATE */}
      {!loading && loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm animate-fade-in mb-8">
          <AlertCircle size={28} className="mx-auto text-red-500 mb-3" />
          <p className="text-sm font-semibold text-red-700">{loadError}</p>
          <p className="mt-1 text-xs text-red-500 font-medium">
            Make sure the backend is running and you are authenticated.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
          >
            <Repeat size={16} />
            Retry
          </button>
        </div>
      )}

      {/* ACTION ERROR (delete / complete / uncomplete) */}
      {!loading && !loadError && actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mb-6 animate-fade-in">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            {actionError}
          </p>
        </div>
      )}

      {!loading && !loadError && (
        <>
      {/* STATS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={Repeat}
          iconClass="bg-indigo-50 border-indigo-100 text-indigo-600"
          value={stats.totalHabits}
          label="Total Habits"
        />
        <StatCard
          icon={CalendarCheck}
          iconClass="bg-emerald-50 border-emerald-100 text-emerald-600"
          value={`${stats.doneToday}/${stats.dueToday}`}
          label="Checked Off Today"
        />
        <StatCard
          icon={Flame}
          iconClass="bg-orange-50 border-orange-100 text-orange-600"
          value={stats.activeStreaks}
          label="Active Streaks"
        />
        <StatCard
          icon={Trophy}
          iconClass="bg-amber-50 border-amber-100 text-amber-600"
          value={stats.bestStreak}
          label="Best Streak (days)"
        />
      </div>

      {/* HABIT LIST */}
      {habits.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm mb-5">
            <Repeat size={34} className="text-indigo-600" data-empty-float />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Habits Tracked Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
            Add your first recurring habit — like reading, exercising, or journaling —
            then check it off each day to grow your streak.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus size={16} />
              Create Your First Habit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {habits.map((habit) => {
            const dates = completions[habit.id] || [];
            const status = statusMap[habit.id];
            const currentStreak = status?.current_streak ?? 0;
            const bestStreak = calculateBestStreak(dates);
            const doneToday = status?.completed_today ?? dates.includes(today);

            return (
              <div
                key={habit.id}
                data-habit-card
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                        {habit.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          habit.frequency === "weekly"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {habit.frequency}
                      </span>
                    </div>
                    {habit.description && (
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(habit)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-slate-100"
                      title="Edit Habit"
                      aria-label={`Edit ${habit.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingHabit(habit)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-slate-100"
                      title="Delete Habit"
                      aria-label={`Delete ${habit.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* TODAY CHECK-OFF */}
                {habit.frequency !== "weekly" && (
                  <button
                    type="button"
                    onClick={(e) => toggleCheck(habit.id, today, !doneToday, e.currentTarget)}
                    aria-pressed={doneToday}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      doneToday
                        ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500"
                        : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600 focus-visible:ring-emerald-400"
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                    {doneToday ? "Completed Today" : "Mark Today Complete"}
                  </button>
                )}

                {/* WEEKLY GRID (MONDAY TO SUNDAY WITH ORDINAL DATES AND WEEK NAVIGATION) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      {weekRangeLabel}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWeekOffset((w) => w - 1)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
                        title="Previous Week"
                        aria-label="Previous Week"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      {weekOffset !== 0 && (
                        <button
                          type="button"
                          onClick={() => setWeekOffset(0)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                          Today
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setWeekOffset((w) => w + 1)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
                        title="Next Week"
                        aria-label="Next Week"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {week.map((date) => {
                      const checked = dates.includes(date);
                      const isToday = date === today;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => toggleCheck(habit.id, date, !checked)}
                          aria-pressed={checked}
                          aria-label={`${checked ? "Uncheck" : "Check off"} ${habit.name} on ${date}`}
                          title={date}
                          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            checked
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                          } ${isToday ? "ring-2 ring-indigo-300 shadow-2xs" : ""}`}
                        >
                          <span className="text-[10px] font-bold">{dayLabel(date)}</span>
                          <span className={`text-[11px] font-extrabold ${checked ? "text-emerald-800" : isToday ? "text-indigo-700 font-black" : "text-slate-700"}`}>
                            {formatDayNumberWithOrdinal(date)}
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full mt-0.5 ${
                              checked ? "bg-emerald-500 text-white" : "bg-white border border-slate-200"
                            }`}
                          >
                            {checked && <Check size={12} strokeWidth={3.5} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STREAK FOOTER */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span
                    data-habit-streak
                    className={`inline-flex items-center gap-1.5 font-bold ${
                      currentStreak > 0 ? "text-orange-600" : "text-slate-400"
                    }`}
                  >
                    <Flame size={14} />
                    {currentStreak > 0
                      ? `${currentStreak} ${habit.frequency === "weekly" ? "week" : "day"}${currentStreak === 1 ? "" : "s"} streak`
                      : "No active streak"}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Best: {bestStreak} {bestStreak === 1 ? "day" : "days"} ·{" "}
                    {dates.length} total check-offs
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>
      )}

      {/* ADD / EDIT MODAL */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingHabit ? "Edit Habit" : "Add Habit"}
          onClick={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl animate-fade-in"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {editingHabit ? "Edit Habit" : "Add New Habit"}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="habit-name" className="text-sm font-bold text-slate-800">
                  Habit Name *
                </label>
                <input
                  id="habit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Read 20 minutes"
                  maxLength={80}
                  aria-invalid={!!formError}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="habit-description" className="text-sm font-bold text-slate-800">
                  Description
                </label>
                <textarea
                  id="habit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why does this habit matter? (optional)"
                  rows={3}
                  maxLength={300}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-800">Frequency</span>
                <div className="flex gap-2">
                  {FREQUENCIES.map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFrequency(freq.value)}
                      aria-pressed={frequency === freq.value}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        frequency === freq.value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-xs font-semibold text-red-500" role="alert">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {submitting
                  ? (editingHabit ? "Saving..." : "Adding...")
                  : (editingHabit ? "Save Changes" : "Add Habit")}
              </button>
            </div>
          </form>
        </div>
      )}



      {/* DELETE CONFIRMATION MODAL */}
      {deletingHabit && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete Habit"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingHabit(null);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 shadow-xl text-center animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-100 mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Delete Habit?</h2>
            <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
              "{deletingHabit.name}" and all of its check-off history will be permanently
              removed. This cannot be undone.
            </p>
            {actionError && (
              <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2" role="alert">
                {actionError}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingHabit(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
