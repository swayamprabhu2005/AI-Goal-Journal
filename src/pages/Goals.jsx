import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { goalApi } from '../services/api';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [statusFilter, setStatusFilter] = useState(''); // '' for All, 'Active', 'Completed', 'Stalled'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Active');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [statusFilter]);

  async function loadGoals() {
    try {
      setLoading(true);
      const data = await goalApi.listGoals(statusFilter);
      setGoals(data || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setError('Could not load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setCategory('');
    setStatus('Active');
    setTargetDate('');
    setEditingGoal(null);
    setShowCreateModal(false);
    setError('');
  }

  function openEdit(goal) {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || '');
    setStatus(goal.status || 'Active');
    setTargetDate(goal.target_date || '');
    setShowCreateModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a goal title.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingGoal) {
        const updated = await goalApi.updateGoal(editingGoal.id, {
          title,
          description: description || null,
          category: category || null,
          status,
          target_date: targetDate || null,
        });
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      } else {
        const created = await goalApi.createGoal({
          title,
          description: description || null,
          category: category || null,
          status,
          target_date: targetDate || null,
        });
        setGoals((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error('Save goal error:', err);
      setError(err.message || 'Could not save goal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusChange(goalId, newStatus) {
    try {
      const updated = await goalApi.updateGoal(goalId, { status: newStatus });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update goal status.');
    }
  }

  async function handleDelete(goalId) {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }
    try {
      await goalApi.deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error('Failed to delete goal:', err);
      alert('Could not delete goal.');
    }
  }

  const activeCount = goals.filter((g) => g.status === 'Active').length;
  const completedCount = goals.filter((g) => g.status === 'Completed').length;
  const stalledCount = goals.filter((g) => g.status === 'Stalled').length;

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Goals & Milestones</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Define your targets. AI journals will automatically map daily activities to these goals.
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-xs font-bold">
          ➕ New Goal
        </Button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-card bg-status-error-bg p-4 text-xs text-status-error border border-status-error/30">
          <strong>Notice: </strong> {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-card-border pb-3">
        {[
          { id: '', label: 'All Goals' },
          { id: 'Active', label: `Active (${activeCount})` },
          { id: 'Completed', label: `Completed (${completedCount})` },
          { id: 'Stalled', label: `Stalled (${stalledCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-card px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === tab.id
                ? 'bg-primary text-white shadow-glow-primary'
                : 'bg-muted text-secondary-foreground hover:bg-secondary hover:text-foreground border border-card-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <Card className="mb-8 border-primary/40 bg-secondary/90 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 border-b border-card-border pb-3">
            <h2 className="text-lg font-bold text-foreground font-display">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <button
              onClick={resetForm}
              className="text-xs text-muted-foreground hover:text-foreground transition font-medium"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="goal-title"
              label="Goal Title *"
              placeholder="e.g. Master FastAPI & Cloud Deployment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                id="goal-category"
                label="Category"
                placeholder="e.g. Career, Academics, Fitness"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="goal-status" className="text-xs font-semibold text-secondary-foreground">
                  Status
                </label>
                <select
                  id="goal-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-card border border-card-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Stalled">Stalled</option>
                </select>
              </div>

              <Input
                id="goal-target-date"
                type="date"
                label="Target Date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-desc" className="text-xs font-semibold text-secondary-foreground">
                Description & Success Criteria
              </label>
              <textarea
                id="goal-desc"
                rows={3}
                placeholder="What does completing this goal look like?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-card border border-card-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-card-border">
              <Button variant="ghost" onClick={resetForm} disabled={saving} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={saving} className="text-xs">
                {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-card border border-card-border">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary-foreground/30 border-t-accent mb-3" />
          <p className="text-xs text-muted-foreground font-mono">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <Card className="text-center py-12 bg-card border-card-border">
          <span className="text-3xl mb-2 inline-block">🎯</span>
          <h3 className="text-lg font-bold text-foreground font-display">No goals found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {statusFilter
              ? `You have no goals with '${statusFilter}' status.`
              : 'Start your accountability journey by creating your first milestone.'}
          </p>
          <div className="mt-4">
            <Button onClick={() => setShowCreateModal(true)} className="text-xs">
              ➕ Create a Goal
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              className="flex flex-col justify-between border-card-border bg-card p-5 transition hover:border-primary/50"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        goal.status === 'Completed'
                          ? 'bg-status-success-bg text-status-success border border-status-success/30'
                          : goal.status === 'Stalled'
                          ? 'bg-status-error-bg text-status-error border border-status-error/30'
                          : 'bg-accent/15 text-accent border border-accent/30'
                      }`}
                    >
                      {goal.status}
                    </span>

                    {goal.category && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-secondary-foreground border border-card-border">
                        {goal.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-1 text-xs text-muted-foreground hover:text-foreground transition"
                      title="Edit Goal"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 text-xs text-muted-foreground hover:text-status-error transition"
                      title="Delete Goal"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-foreground font-display leading-snug">
                  {goal.title}
                </h3>

                {goal.description && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {goal.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-card-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="text-[11px]">
                  {goal.target_date
                    ? `Target: ${new Date(goal.target_date).toLocaleDateString()}`
                    : `Created: ${new Date(goal.created_at).toLocaleDateString()}`}
                </span>

                {/* Quick status switch */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Status:</span>
                  <select
                    value={goal.status}
                    onChange={(e) => handleQuickStatusChange(goal.id, e.target.value)}
                    className="rounded border border-card-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Stalled">Stalled</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}