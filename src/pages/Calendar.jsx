import { useState } from "react";
import { Calendar as CalendarIcon, Plus, X, Target, CheckCircle2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { goalApi } from "../services/api";
import GoalCalendar from "../components/GoalCalendar";
import GoalCelebration from "../components/GoalCelebration";
import { GoalLoadingState } from "../components/LoadingSkeleton";

export default function CalendarPage() {
  const {
    goals,
    hasLoadedGoals,
    addGoal,
    updateGoalInCache,
    recentlyCompletedGoal,
    triggerGoalCompletion,
    clearCompletedGoalTrigger,
  } = useData();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Active");
  const [targetDate, setTargetDate] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("");
    setStatus("Active");
    setTargetDate("");
    setProgressValue(0);
    setProgressNote("");
    setEditingGoal(null);
    setFormError("");
    setShowCreateModal(false);
  }

  function openEdit(goal) {
    setEditingGoal(goal);
    setTitle(goal.title || "");
    setDescription(goal.description || "");
    setCategory(goal.category || "");
    setStatus(goal.status || "Active");
    setTargetDate(goal.target_date || "");
    setProgressValue(goal.status === "Completed" ? 100 : goal.progress_value || 0);
    setProgressNote(goal.latest_progress_note || "");
    setFormError("");
    setShowCreateModal(true);
  }

  async function handleSaveGoal(e) {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Goal title is required");
      return;
    }

    setSaving(true);
    setFormError("");

    let finalStatus = status;
    let finalProgress = Number(progressValue);

    if (finalProgress === 100 || finalStatus === "Completed") {
      finalStatus = "Completed";
      finalProgress = 100;
    }

    const wasAlreadyCompleted = editingGoal && editingGoal.status === "Completed";
    const isNewlyCompleted = finalStatus === "Completed" && !wasAlreadyCompleted;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || "General",
      status: finalStatus,
      target_date: targetDate || null,
      progress_value: finalProgress,
      latest_progress_note: progressNote.trim() || null,
    };

    try {
      if (editingGoal) {
        const updated = await goalApi.updateGoal(editingGoal.id, payload);
        updateGoalInCache(updated);
        if (isNewlyCompleted) {
          triggerGoalCompletion(updated);
        }
      } else {
        const created = await goalApi.createGoal(payload);
        addGoal(created);
        if (isNewlyCompleted) {
          triggerGoalCompletion(created);
        }
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save goal:", err);
      setFormError(err.message || "Failed to save goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusChange(goalId, newStatus) {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const wasAlreadyCompleted = targetGoal.status === "Completed";
    const isNewlyCompleted = newStatus === "Completed" && !wasAlreadyCompleted;

    const updatedData = {
      ...targetGoal,
      status: newStatus,
      progress_value: newStatus === "Completed" ? 100 : targetGoal.progress_value || 0,
    };

    try {
      const updated = await goalApi.updateGoal(goalId, {
        status: newStatus,
        progress_value: updatedData.progress_value,
      });
      updateGoalInCache(updated);

      if (isNewlyCompleted) {
        triggerGoalCompletion(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  if (!hasLoadedGoals && goals.length === 0) {
    return <GoalLoadingState />;
  }

  return (
    <div className="app-page min-h-screen bg-slate-50">
      <main className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 lg:px-12 space-y-8 animate-fade-in pb-16">
      {/* CELEBRATION MODAL */}
      <GoalCelebration
        completedGoal={recentlyCompletedGoal}
        onDismiss={clearCompletedGoalTrigger}
      />

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Goal Calendar
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Visualize milestone deadlines, target dates, and upcoming objectives
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 hover:shadow transition"
        >
          <Plus size={18} />
          Add Milestone Goal
        </button>
      </div>

      {/* MAIN CALENDAR COMPONENT */}
      <GoalCalendar
        goals={goals}
        onQuickStatusChange={handleQuickStatusChange}
        onOpenEdit={openEdit}
      />

      {/* CREATE / EDIT GOAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingGoal ? "Edit Milestone Goal" : "New Milestone Goal"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set clear target dates for calendar tracking
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-5 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete AWS Developer Certification"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, key outcomes, or success criteria..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Career, Learning"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newSt = e.target.value;
                      setStatus(newSt);
                      if (newSt === "Completed") {
                        setProgressValue(100);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Stalled">Stalled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Progress ({progressValue}%)
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProgressValue(val);
                      if (val === 100) setStatus("Completed");
                      else if (status === "Completed") setStatus("Active");
                    }}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
