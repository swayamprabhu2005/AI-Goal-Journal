import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Target,
  Sparkles,
  Filter,
} from 'lucide-react';

export default function GoalCalendar({ goals = [], onQuickStatusChange, onOpenEdit }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // Today reference normalized to midnight
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Filter goals by status filter
  const filteredGoals = useMemo(() => {
    if (statusFilter === 'All') return goals;
    if (statusFilter === 'Overdue') {
      return goals.filter((g) => {
        if (!g.target_date || g.status === 'Completed') return false;
        const target = new Date(g.target_date);
        target.setHours(0, 0, 0, 0);
        return target < today;
      });
    }
    return goals.filter((g) => g.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [goals, statusFilter, today]);

  // Map goals with target dates into date-indexed map ('YYYY-MM-DD' => goals[])
  const goalsByDate = useMemo(() => {
    const map = {};
    goals.forEach((goal) => {
      if (!goal.target_date) return;
      // Handle standard ISO date YYYY-MM-DD or full date string
      const dateKey = goal.target_date.split('T')[0];
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(goal);
    });
    return map;
  }, [goals]);

  // Derived arrays for Overdue and Upcoming deadlines
  const overdueGoals = useMemo(() => {
    return goals
      .filter((g) => {
        if (!g.target_date || g.status === 'Completed') return false;
        const target = new Date(g.target_date);
        target.setHours(0, 0, 0, 0);
        return target < today;
      })
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  }, [goals, today]);

  const upcomingGoals = useMemo(() => {
    return goals
      .filter((g) => {
        if (!g.target_date || g.status === 'Completed') return false;
        const target = new Date(g.target_date);
        target.setHours(0, 0, 0, 0);
        return target >= today;
      })
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  }, [goals, today]);

  const completedGoalsWithDates = useMemo(() => {
    return goals
      .filter((g) => g.status === 'Completed' && g.target_date)
      .sort((a, b) => new Date(b.target_date) - new Date(a.target_date));
  }, [goals]);

  // Helper functions for month navigation
  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonthDate(new Date());
    setSelectedDateStr(new Date().toISOString().split('T')[0]);
  };

  // Calendar grid computation
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate matrix cells
  const calendarDays = useMemo(() => {
    const days = [];
    // Padding from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        dateKey: null,
      });
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateKey,
      });
    }
    // Padding for remaining grid to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateKey: null,
      });
    }
    return days;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  // Helper to format days overdue or days left
  function getDeadlineLabel(targetDateStr, status) {
    if (status === 'Completed') return { text: 'Completed', color: 'text-emerald-600 bg-emerald-50' };
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        text: `${daysAgo} day${daysAgo === 1 ? '' : 's'} overdue`,
        color: 'text-rose-600 bg-rose-50 border-rose-200 font-bold',
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return { text: 'Due Today!', color: 'text-amber-700 bg-amber-100 border-amber-300 font-bold' };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    } else {
      return { text: `${diffDays} days left`, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  }

  // Selected date's goals
  const selectedDateGoals = selectedDateStr ? goalsByDate[selectedDateStr] || [] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Metric Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5 shadow-sm border-slate-200 bg-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Milestones</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{goals.filter((g) => g.target_date).length}</h4>
            <p className="text-[11px] text-slate-500 font-medium">goals with target dates</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="panel p-5 shadow-sm border-rose-200 bg-rose-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Overdue Goals</p>
            <h4 className="text-2xl font-bold text-rose-700 mt-1">{overdueGoals.length}</h4>
            <p className="text-[11px] text-rose-600 font-medium">requires immediate attention</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="panel p-5 shadow-sm border-indigo-200 bg-indigo-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Upcoming Deadlines</p>
            <h4 className="text-2xl font-bold text-indigo-700 mt-1">{upcomingGoals.length}</h4>
            <p className="text-[11px] text-indigo-600 font-medium">scheduled in future</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="panel p-5 shadow-sm border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completed on Time</p>
            <h4 className="text-2xl font-bold text-emerald-700 mt-1">{completedGoalsWithDates.length}</h4>
            <p className="text-[11px] text-emerald-600 font-medium">milestones achieved</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* OVERDUE GOALS BANNER ALERT (If any exist) */}
      {overdueGoals.length > 0 && (
        <section className="rounded-3xl p-6 bg-gradient-to-r from-rose-500/10 via-rose-50 to-white border border-rose-200/90 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-rose-600" />
            <h3 className="text-base font-bold text-rose-900">
              Action Required: {overdueGoals.length} Overdue Goal{overdueGoals.length === 1 ? '' : 's'}
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overdueGoals.map((goal) => {
              const deadline = getDeadlineLabel(goal.target_date, goal.status);
              return (
                <div
                  key={goal.id}
                  className="panel p-4 bg-white border border-rose-200 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 border border-rose-200">
                        {deadline.text}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{goal.title}</h4>
                    {goal.description && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{goal.description}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenEdit && onOpenEdit(goal)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => onQuickStatusChange && onQuickStatusChange(goal.id, 'Completed')}
                      className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold shadow-sm hover:bg-emerald-700 transition flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} /> Mark Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MAIN CALENDAR GRID & DEADLINES SIDEBAR */}
      <div className="grid gap-7 lg:grid-cols-[1.8fr_1.1fr]">
        {/* CALENDAR MONTH MATRIX */}
        <section className="panel p-6 sm:p-7 shadow-sm bg-white border border-slate-200 rounded-3xl">
          {/* Calendar Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {monthName} {year}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Goal Target Date Calendar</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Today
              </button>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={prevMonth}
                  className="p-2 text-slate-600 hover:bg-slate-50 transition border-r border-slate-100"
                  title="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 text-slate-600 hover:bg-slate-50 transition"
                  title="Next Month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Status Filter Pills inside Calendar */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter size={13} /> Filter:
            </span>
            {['All', 'Active', 'Stalled', 'Completed', 'Overdue'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={idx}
                    className="min-h-[72px] sm:min-h-[84px] rounded-2xl bg-slate-50/50 p-2 text-slate-300 border border-slate-100/50 cursor-not-allowed"
                  >
                    <span className="text-xs font-medium">{cell.dayNumber}</span>
                  </div>
                );
              }

              const dateKey = cell.dateKey;
              const goalsOnDate = (goalsByDate[dateKey] || []).filter((g) => {
                if (statusFilter === 'All') return true;
                if (statusFilter === 'Overdue') {
                  const target = new Date(g.target_date);
                  target.setHours(0, 0, 0, 0);
                  return target < today && g.status !== 'Completed';
                }
                return g.status?.toLowerCase() === statusFilter.toLowerCase();
              });

              const isTodayCell =
                dateKey === today.toISOString().split('T')[0];
              const isSelected = selectedDateStr === dateKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={`min-h-[72px] sm:min-h-[84px] rounded-2xl p-2 border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-sm'
                      : isTodayCell
                      ? 'border-indigo-300 bg-indigo-50/20 font-bold'
                      : goalsOnDate.length > 0
                      ? 'border-slate-300 bg-white hover:border-indigo-300 hover:shadow-sm'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold ${
                        isTodayCell
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {goalsOnDate.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {goalsOnDate.length}
                      </span>
                    )}
                  </div>

                  {/* Goal Badges inside Cell */}
                  <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                    {goalsOnDate.slice(0, 2).map((g) => {
                      const isOverdueGoal =
                        g.status !== 'Completed' &&
                        new Date(g.target_date) < today;

                      return (
                        <div
                          key={g.id}
                          className={`truncate text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                            g.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isOverdueGoal
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : g.status === 'Stalled'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                          title={g.title}
                        >
                          {g.title}
                        </div>
                      );
                    })}
                    {goalsOnDate.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold pl-0.5">
                        +{goalsOnDate.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DEADLINES & INSPECTOR SIDEBAR */}
        <section className="space-y-6">
          {/* Selected Date Inspector Panel (if date is picked) */}
          {selectedDateStr && (
            <div className="panel p-6 shadow-sm bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-200 rounded-3xl animate-fade-in">
              <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Date Details
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDateStr(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear Selection
                </button>
              </div>

              {selectedDateGoals.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium py-3 italic">
                  No goal deadlines scheduled for this date.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 bg-white border border-indigo-100 rounded-2xl shadow-sm hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            g.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : g.status === 'Stalled'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          }`}
                        >
                          {g.status}
                        </span>
                        {onOpenEdit && (
                          <button
                            onClick={() => onOpenEdit(g)}
                            className="text-[11px] text-indigo-600 font-bold hover:underline"
                          >
                            Edit Goal
                          </button>
                        )}
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{g.title}</h5>
                      {g.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{g.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UPCOMING DEADLINES TIMELINE CARD */}
          <div className="panel p-6 shadow-sm bg-white border border-slate-200 rounded-3xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" />
                <h4 className="text-base font-bold text-slate-900">Upcoming Timeline</h4>
              </div>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {upcomingGoals.length} active
              </span>
            </div>

            {upcomingGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target size={30} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No upcoming deadlines scheduled.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {upcomingGoals.map((goal) => {
                  const deadline = getDeadlineLabel(goal.target_date, goal.status);
                  return (
                    <div key={goal.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${deadline.color}`}
                          >
                            {deadline.text}
                          </span>
                          {goal.priority && goal.status !== 'Completed' && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                                goal.priority.includes('High')
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : goal.priority.includes('Low')
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {goal.priority}
                            </span>
                          )}
                          {goal.category && (
                            <span className="text-[10px] text-slate-400 font-semibold truncate">
                              {goal.category}
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 leading-snug truncate">
                          {goal.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => onQuickStatusChange && onQuickStatusChange(goal.id, 'Completed')}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition shrink-0"
                        title="Mark Completed"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
