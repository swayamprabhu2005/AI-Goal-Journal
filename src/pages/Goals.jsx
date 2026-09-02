import {
  Target,
  Plus,
  X,
  CheckCircle2,
  Trash2,
  Pencil,
  RotateCcw,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useModal, useToast } from "../context/ModalContext";
import { goalApi } from "../services/api";
import CircularProgress from "../components/CircularProgress";
import { GridSkeleton, GoalLoadingState } from "../components/LoadingSkeleton";
import GoalCelebration from "../components/GoalCompletionCelebration";
import GoalCalendar from "../components/GoalCalendar";
import Pagination from "../components/Pagination";

export default function Goals() {
  const {
    goals,
    loading,
    addGoal,
    updateGoalInCache,
    deleteGoalFromCache,
    recentlyCompletedGoal,
    triggerGoalCompletion,
    clearCompletedGoalTrigger,
  } = useData();

  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "calendar"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

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

  const filteredGoals = statusFilter
    ? goals.filter((g) => {
        if (statusFilter === "High Priority") {
          return (g.priority || "").toLowerCase().includes("high");
        }
        return g.status?.toLowerCase() === statusFilter.toLowerCase();
      })
    : goals;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGoals = filteredGoals.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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

    // Enforce logic: 100% progress implies Completed; Completed status implies 100% progress
    let finalStatus = status;
    let finalProgress = Number(progressValue);

    if (finalProgress === 100 || finalStatus === "Completed") {
      finalStatus = "Completed";
      finalProgress = 100;
    }

    const wasAlreadyCompleted = editingGoal && editingGoal.status === "Completed";
    const isNewlyCompleted = finalStatus === "Completed" && !wasAlreadyCompleted;

    try {
      if (editingGoal) {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          status: finalStatus,
          target_date: targetDate || null,
          progress_value: finalProgress,
          latest_progress_note: progressNote.trim() || null,
        };
        const updated = await goalApi.updateGoal(editingGoal.id, payload);
        updateGoalInCache(updated);
        if (isNewlyCompleted) {
          triggerGoalCompletion(updated);
        }
      } else {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          status: finalStatus,
          target_date: targetDate || null,
          progress_value: finalProgress,
        };
        const created = await goalApi.createGoal(payload);
        addGoal(created);
        if (isNewlyCompleted) {
          triggerGoalCompletion(created);
        }
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "Failed to save goal.");
    } finally {
      setSaving(false);
    }
  }

  const { confirm } = useModal();
  const toast = useToast();

  async function handleDelete(goalId) {
    const confirmed = await confirm({
      title: "Delete Goal",
      message: "Are you sure you want to delete this goal? This action cannot be undone.",
      confirmText: "Delete Goal",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await goalApi.deleteGoal(goalId);
      deleteGoalFromCache(goalId);
      toast.success("Goal deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete goal: " + err.message);
    }
  }

  async function handleQuickStatusChange(goalId, newStatus) {
    const targetGoal = goals.find((g) => g.id === goalId);
    const wasAlreadyCompleted = targetGoal && targetGoal.status === "Completed";
    const isNewlyCompleted = newStatus === "Completed" && !wasAlreadyCompleted;

    const payload = {
      status: newStatus,
      ...(newStatus === "Completed" ? { progress_value: 100 } : {}),
    };

    try {
      const updated = await goalApi.updateGoal(goalId, payload);
      updateGoalInCache(updated);

      if (isNewlyCompleted) {
        triggerGoalCompletion(updated);
      }
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    }
  }

  return (
    <div className="app-page bg-slate-50 min-h-screen">
      {/* Celebration Modal Overlay for Newly Completed Goals */}
      {recentlyCompletedGoal && (
        <GoalCelebration
          goal={recentlyCompletedGoal}
          onClose={clearCompletedGoalTrigger}
        />
      )}

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10">
        {/* Status Filter & Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Grid vs Calendar */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={15} /> Grid Cards
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "calendar"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays size={15} /> Calendar & Deadlines
              </button>
            </div>

            {/* Status Filter Pills (For Grid View) */}
            {viewMode === "grid" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {["", "Active", "Completed", "Stalled", "High Priority"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      statusFilter === st
                        ? "bg-indigo-600 text-white shadow-sm font-bold"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {st === "" ? "All Goals" : st}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3.5">
            <span className="text-xs text-slate-500 font-mono font-medium hidden sm:inline">
              {filteredGoals.length} {filteredGoals.length === 1 ? "goal" : "goals"}
            </span>

            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="primary-button text-sm"
            >
              <Plus size={16} />
              Create Goal
            </button>
          </div>
        </div>

        {/* Create / Edit Modal Form */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="panel w-full max-w-xl p-6 shadow-xl border border-slate-200 bg-white max-h-[90vh] overflow-y-auto rounded-2xl animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-indigo-600" />
                  {editingGoal ? "Edit Goal" : "Create New Goal"}
                </h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveGoal} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master FastAPI Backend Architecture"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field p-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="Career, Academics"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field p-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
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
                      className="input-field p-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Stalled">Stalled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="input-field p-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Progress (%): {progressValue}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProgressValue(val);
                        if (val === 100) {
                          setStatus("Completed");
                        }
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Latest Progress Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Finished modules 1 & 2"
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      className="input-field p-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Description & Success Criteria
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What does completing this goal look like?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field p-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="primary-button text-xs">
                    {saving ? "Saving…" : editingGoal ? "Update Goal" : "Create Goal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Mode Rendering: Calendar View vs Cards View */}
        {loading ? (
          <GoalLoadingState />
        ) : viewMode === "calendar" ? (
          <GoalCalendar
            goals={goals}
            onQuickStatusChange={handleQuickStatusChange}
            onOpenEdit={openEdit}
          />
        ) : filteredGoals.length === 0 ? (
          <section className="panel px-6 py-16 text-center shadow-sm">
            <Target size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No goals found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto font-medium">
              {statusFilter
                ? `You have no goals with '${statusFilter}' status.`
                : "Start your accountability journey by creating your first goal milestone."}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="primary-button mt-4 text-xs"
            >
              <Plus size={14} /> Create a Goal
            </button>
          </section>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2 stagger-in">
              {paginatedGoals.map((goal) => {
                // Ensure Completed goals immediately display 100% progress
                const prog = goal.status === "Completed" ? 100 : (goal.progress_value || 0);

                return (
                  <div
                    key={goal.id}
                    className="panel p-6 shadow-sm flex flex-col justify-between border-slate-200 hover:border-indigo-300 hover-lift"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              goal.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : goal.status === "Stalled"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                            }`}
                          >
                            {goal.status === "Active" ? "On Track" : goal.status}
                          </span>

                          {/* Smart Priority Badge */}
                          {goal.priority && goal.status !== "Completed" && (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                goal.priority.includes("High")
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : goal.priority.includes("Low")
                                  ? "bg-slate-100 text-slate-600 border border-slate-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {goal.priority}
                            </span>
                          )}

                          {goal.category && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                              {goal.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(goal)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-slate-100"
                            title="Edit Goal"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-slate-100"
                            title="Delete Goal"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
                          <CircularProgress
                            value={prog}
                            className="w-16 h-16"
                            trackClass="stroke-slate-200"
                            fillClass={goal.status === "Completed" ? "stroke-emerald-500" : "stroke-indigo-600"}
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {goal.title}
                          </h3>

                          {goal.description && (
                            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {goal.latest_progress_note && (
                        <div className="mt-3.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-[11px] text-slate-700 italic font-medium">
                          Latest: {goal.latest_progress_note}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium">
                          {goal.target_date
                            ? `Target: ${new Date(goal.target_date).toLocaleDateString()}`
                            : `Created: ${new Date(goal.created_at || goal.createdAt).toLocaleDateString()}`}
                        </span>

                        {goal.estimated_days_remaining !== null && goal.estimated_days_remaining !== undefined && goal.status !== "Completed" && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            ~{goal.estimated_days_remaining} {goal.estimated_days_remaining === 1 ? 'day' : 'days'} left
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium">Status:</span>
                        <select
                          value={goal.status}
                          onChange={(e) => handleQuickStatusChange(goal.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Stalled">Stalled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredGoals.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newLimit) => {
                setItemsPerPage(newLimit);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[6, 12, 24]}
            />
          </div>
        )}
      </main>
    </div>
  );
}