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
} from "lucide-react";
import { useState } from "react";
import { useData } from "../context/DataContext";
import { goalApi } from "../services/api";
import CircularProgress from "../components/CircularProgress";

export default function Goals() {
  const {
    goals,
    loading,
    addGoal,
    updateGoalInCache,
    deleteGoalFromCache,
  } = useData();

  const [statusFilter, setStatusFilter] = useState("");
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

  const filteredGoals = statusFilter
    ? goals.filter((g) => g.status?.toLowerCase() === statusFilter.toLowerCase())
    : goals;

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
    setProgressValue(goal.progress_value || 0);
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

    try {
      if (editingGoal) {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          status,
          target_date: targetDate || null,
          progress_value: Number(progressValue),
          latest_progress_note: progressNote.trim() || null,
        };
        const updated = await goalApi.updateGoal(editingGoal.id, payload);
        updateGoalInCache(updated);
      } else {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          status,
          target_date: targetDate || null,
          progress_value: Number(progressValue),
        };
        const created = await goalApi.createGoal(payload);
        addGoal(created);
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "Failed to save goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goalId) {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await goalApi.deleteGoal(goalId);
      deleteGoalFromCache(goalId);
    } catch (err) {
      alert("Failed to delete goal: " + err.message);
    }
  }

  async function handleQuickStatusChange(goalId, newStatus) {
    try {
      const updated = await goalApi.updateGoal(goalId, { status: newStatus });
      updateGoalInCache(updated);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  }

  return (
    <div className="app-page">
      <header className="border-b border-border bg-surface px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1250px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="section-label">TARGETS & MILESTONES</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cream">
              Goals
            </h1>
            <p className="mt-2 text-sm text-beige/60">
              Define target goals, track progress percentages, and celebrate wins.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="primary-button"
          >
            <Plus size={16} />
            Create Goal
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10">
        {/* Status Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {["", "Active", "Completed", "Stalled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-burgundy text-cream shadow-card"
                    : "bg-surface2 text-beige/70 border border-border hover:bg-wine/30 hover:text-cream"
                }`}
              >
                {st === "" ? "All Goals" : st}
              </button>
            ))}
          </div>

          <span className="text-xs text-beige/50 font-mono">
            Showing {filteredGoals.length} {filteredGoals.length === 1 ? "goal" : "goals"}
          </span>
        </div>

        {/* Create / Edit Modal Form */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="panel w-full max-w-xl p-6 shadow-glow border border-border bg-surface max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <h3 className="text-lg font-bold text-cream flex items-center gap-2">
                  <Target size={18} className="text-beige" />
                  {editingGoal ? "Edit Goal" : "Create New Goal"}
                </h3>
                <button onClick={resetForm} className="text-beige hover:text-cream">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded-xl bg-red-950/30 p-3 text-xs text-red-400 border border-red-900/40">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveGoal} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-beige/70 block mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master FastAPI Backend Architecture"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-dark p-3 text-sm"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-beige/70 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="Career, Academics"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-dark p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-beige/70 block mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-dark p-2.5 text-sm bg-surface2"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Stalled">Stalled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-beige/70 block mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="input-dark p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-beige/70 block mb-1">
                      Progress (%): {progressValue}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(Number(e.target.value))}
                      className="w-full accent-burgundy"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-beige/70 block mb-1">
                      Latest Progress Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Finished modules 1 & 2"
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      className="input-dark p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-beige/70 block mb-1">
                    Description & Success Criteria
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What does completing this goal look like?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-dark p-3 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-beige/70 hover:bg-surface2"
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

        {/* Goals Grid */}
        {loading ? (
          <section className="panel px-6 py-20 text-center shadow-card">
            <p className="text-sm text-beige/55">Loading goals…</p>
          </section>
        ) : filteredGoals.length === 0 ? (
          <section className="panel px-6 py-16 text-center shadow-card">
            <Target size={36} className="mx-auto text-beige/40 mb-3" />
            <h3 className="text-lg font-bold text-cream">No goals found</h3>
            <p className="mt-1 text-xs text-beige/60 max-w-sm mx-auto">
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
          <div className="grid gap-5 md:grid-cols-2">
            {filteredGoals.map((goal) => {
              const prog = goal.progress_value || (goal.status === "Completed" ? 100 : 0);

              return (
                <div
                  key={goal.id}
                  className="panel p-6 shadow-card flex flex-col justify-between border-border hover:border-wine transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            goal.status === "Completed"
                              ? "bg-green-950/40 text-green-400 border border-green-900/40"
                              : goal.status === "Stalled"
                              ? "bg-red-950/40 text-red-400 border border-red-900/40"
                              : "bg-wine/30 text-cream border border-wine/50"
                          }`}
                        >
                          {goal.status}
                        </span>

                        {goal.category && (
                          <span className="rounded-lg bg-surface2 px-2.5 py-0.5 text-[10px] font-medium text-beige/80 border border-border">
                            {goal.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(goal)}
                          className="p-1.5 text-beige/60 hover:text-cream transition rounded-lg hover:bg-surface2"
                          title="Edit Goal"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-1.5 text-beige/60 hover:text-red-400 transition rounded-lg hover:bg-surface2"
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
                          trackClass="stroke-[#352024]"
                          fillClass="stroke-[#561C24]"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-base font-bold text-cream leading-snug">
                          {goal.title}
                        </h3>

                        {goal.description && (
                          <p className="mt-1.5 text-xs text-beige/70 leading-relaxed whitespace-pre-wrap">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {goal.latest_progress_note && (
                      <div className="mt-3.5 rounded-xl bg-surface2 p-2.5 border border-border text-[11px] text-beige/80 italic">
                        Latest: {goal.latest_progress_note}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-beige/60">
                    <span className="text-[11px]">
                      {goal.target_date
                        ? `Target: ${new Date(goal.target_date).toLocaleDateString()}`
                        : `Created: ${new Date(goal.created_at || goal.createdAt).toLocaleDateString()}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">Status:</span>
                      <select
                        value={goal.status}
                        onChange={(e) => handleQuickStatusChange(goal.id, e.target.value)}
                        className="rounded-lg border border-border bg-surface2 px-2 py-0.5 text-xs font-medium text-cream focus:outline-none"
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
        )}
      </main>
    </div>
  );
}