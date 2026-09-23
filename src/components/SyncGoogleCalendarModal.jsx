import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ExternalLink, X, AlertCircle } from "lucide-react";
import { calendarApi } from "../services/api";

export default function SyncGoogleCalendarModal({ goal, isOpen, onClose, onSuccess }) {
  const [targetDate, setTargetDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncedResult, setSyncedResult] = useState(null);

  useEffect(() => {
    if (goal) {
      const initialDate = goal.target_date ? goal.target_date.split("T")[0] : new Date().toISOString().split("T")[0];
      setTargetDate(initialDate);
      setStartTime("09:00");
      setDuration(60);
      setError("");
      setSyncedResult(null);
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  async function handleSync(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await calendarApi.syncGoal(goal.id, {
        target_date: targetDate,
        start_time: startTime,
        duration_minutes: Number(duration),
      });

      setSyncedResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      console.error("Failed to sync goal to Google Calendar:", err);
      setError(err.message || "Failed to sync event to Google Calendar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl animate-scale-up text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2E9DF]/60 text-[#3A492E] border border-[#E2E9DF] shadow-xs">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Sync to Google Calendar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Schedule this goal milestone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Goal Preview Pill */}
        <div className="mb-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#4B5D3C]">
            {goal.category || "General"} • {goal.priority || "Medium Priority"}
          </p>
          <h4 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {goal.title}
          </h4>
          {goal.calendar_synced && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Currently synced on your calendar</span>
            </div>
          )}
        </div>

        {/* Success Confirmation View */}
        {syncedResult ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Scheduled on Google Calendar!
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                {syncedResult.message || "Goal milestone is now synchronized with your Google Calendar."}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 w-full">
              {syncedResult.google_event_link && (
                <a
                  href={syncedResult.google_event_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E2E9DF] bg-[#E2E9DF]/60 py-2.5 text-xs font-bold text-[#3A492E] hover:bg-[#E2E9DF] transition shadow-xs"
                >
                  <span>View in Calendar</span>
                  <ExternalLink size={13} />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-900 dark:bg-slate-100 py-2.5 text-xs font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSync} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Date
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-[#4B5D3C] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#4B5D3C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#4B5D3C] outline-none"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4B5D3C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3A492E] active:scale-[0.98] transition shadow-xs disabled:opacity-60"
              >
                {loading ? "Scheduling..." : goal.calendar_synced ? "Update Calendar Event" : "Add to Google Calendar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
