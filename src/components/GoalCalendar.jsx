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
  Filter,
} from 'lucide-react';

const getLocalISODate = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getGoalDeadlineStatus = (goal) => {
  // 1. Completed goals are never overdue
  const statusStr = typeof goal.status === 'string' ? goal.status.toLowerCase() : '';
  if (statusStr === 'completed' || goal.completed || (goal.progress_value && goal.progress_value >= 100)) {
    return {
      category: 'Completed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isOverdue: false,
      isDueToday: false,
      daysRemaining: null,
      reminderLabel: 'Completed',
    };
  }

  if (!goal.target_date) {
    return {
      category: 'No Deadline',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      isOverdue: false,
      isDueToday: false,
      daysRemaining: null,
      reminderLabel: 'No Target Date',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(goal.target_date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      category: 'Overdue',
      badgeClass: 'bg-rose-100 text-rose-700 border-rose-300 font-bold',
      isOverdue: true,
      isDueToday: false,
      daysRemaining: diffDays,
      reminderLabel: `${Math.abs(diffDays)}d overdue`,
    };
  } else if (diffDays === 0) {
    return {
      category: 'Due Today',
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-300 font-bold animate-pulse',
      isOverdue: false,
      isDueToday: true,
      daysRemaining: 0,
      reminderLabel: 'Due Today',
    };
  } else if (diffDays === 1) {
    return {
      category: 'Upcoming',
      badgeClass: 'bg-blue-100 text-blue-700 border-blue-300 font-medium',
      isOverdue: false,
      isDueToday: false,
      daysRemaining: 1,
      reminderLabel: 'Due Tomorrow',
    };
  } else {
    return {
      category: 'Upcoming',
      badgeClass: 'bg-[#E2E9DF]/60 text-[#3A492E] border-[#E2E9DF] font-medium',
      isOverdue: false,
      isDueToday: false,
      daysRemaining: diffDays,
      reminderLabel: `Due in ${diffDays} days`,
    };
  }
};

export default function GoalCalendar({
  goals = [],
  onQuickStatusChange,
  onOpenEdit,
  onSyncGoal,
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Top metric bar aggregation
  const stats = useMemo(() => {
    let totalWithDate = 0;
    let overdue = 0;
    let upcoming = 0;
    let completed = 0;

    goals.forEach((goal) => {
      if (goal.target_date) totalWithDate++;
      const dl = getGoalDeadlineStatus(goal);

      if (dl.category === 'Completed') completed++;
      else if (dl.category === 'Overdue') overdue++;
      else if (dl.category === 'Upcoming' || dl.category === 'Due Today') upcoming++;
    });

    return { totalWithDate, overdue, upcoming, completed };
  }, [goals]);

  // Overdue goals list
  const overdueGoals = useMemo(() => {
    return goals
      .filter((g) => getGoalDeadlineStatus(g).category === 'Overdue')
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  }, [goals]);

  // Upcoming & Due Today goals list
  const upcomingGoals = useMemo(() => {
    return goals
      .filter((g) => {
        const cat = getGoalDeadlineStatus(g).category;
        return cat === 'Upcoming' || cat === 'Due Today';
      })
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  }, [goals]);

  // Map goals with target dates ('YYYY-MM-DD' => goals[])
  const goalsByDate = useMemo(() => {
    const map = {};
    goals.forEach((goal) => {
      if (!goal.target_date) return;
      const dateKey = goal.target_date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(goal);
    });
    return map;
  }, [goals]);

  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonthDate(new Date());
    setSelectedDateStr(getLocalISODate());
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ dayNumber: prevMonthDays - i, isCurrentMonth: false, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      days.push({ dayNumber: d, isCurrentMonth: true, dateKey: `${year}-${monthStr}-${dayStr}` });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ dayNumber: i, isCurrentMonth: false, dateKey: null });
    }
    return days;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  const selectedDateGoals = selectedDateStr ? goalsByDate[selectedDateStr] || [] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Metric Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5 shadow-sm border-slate-200 bg-white flex items-center justify-between rounded-2xl border">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Milestones</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalWithDate}</h4>
            <p className="text-[11px] text-slate-500 font-medium">goals with target dates</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2E9DF]/60 text-[#3A492E]">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="panel p-5 shadow-sm border-rose-200 bg-rose-50/40 flex items-center justify-between rounded-2xl border">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Overdue Goals</p>
            <h4 className="text-2xl font-bold text-rose-700 mt-1">{stats.overdue}</h4>
            <p className="text-[11px] text-rose-600 font-medium">requires immediate attention</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="panel p-5 shadow-sm border-[#E2E9DF] bg-[#E2E9DF]/40 flex items-center justify-between rounded-2xl border">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#3A492E]">Upcoming Deadlines</p>
            <h4 className="text-2xl font-bold text-[#3A492E] mt-1">{stats.upcoming}</h4>
            <p className="text-[11px] text-[#4B5D3C] font-medium">scheduled in future</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2E9DF] text-[#3A492E]">
            <Clock size={20} />
          </div>
        </div>

        <div className="panel p-5 shadow-sm border-emerald-200 bg-emerald-50/40 flex items-center justify-between rounded-2xl border">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completed on Time</p>
            <h4 className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</h4>
            <p className="text-[11px] text-emerald-600 font-medium">milestones achieved</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* OVERDUE GOALS BANNER ALERT */}
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
              const deadline = getGoalDeadlineStatus(goal);
              return (
                <div
                  key={goal.id}
                  className="panel p-4 bg-white border border-rose-200 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${deadline.badgeClass}`}>
                        {deadline.reminderLabel}
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
                      className="text-xs font-semibold text-slate-600 hover:text-[#4B5D3C]"
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2E9DF]/60 text-[#3A492E]">
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

          {/* Status Filter Pills */}
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
                    ? 'bg-[#4B5D3C] text-white font-bold shadow-sm'
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
                const deadline = getGoalDeadlineStatus(g);
                if (statusFilter === 'All') return true;
                if (statusFilter === 'Overdue') return deadline.category === 'Overdue';
                return g.status?.toLowerCase() === statusFilter.toLowerCase();
              });

              const todayISO = getLocalISODate();
              const isTodayCell = dateKey === todayISO;
              const isSelected = selectedDateStr === dateKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={`min-h-[72px] sm:min-h-[84px] rounded-2xl p-2 border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#4B5D3C] ring-2 ring-[#4B5D3C]/20 bg-[#E2E9DF]/40 shadow-sm'
                      : isTodayCell
                      ? 'border-[#4B5D3C]/40 bg-[#E2E9DF]/20 font-bold'
                      : goalsOnDate.length > 0
                      ? 'border-slate-300 bg-white hover:border-[#4B5D3C]/40 hover:shadow-sm'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold ${
                        isTodayCell ? 'bg-[#4B5D3C] text-white' : 'text-slate-700'
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

                  <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                    {goalsOnDate.slice(0, 2).map((g) => {
                      const deadline = getGoalDeadlineStatus(g);
                      return (
                        <div
                          key={g.id}
                          className={`truncate text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${deadline.badgeClass}`}
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
          {/* Selected Date Inspector Panel */}
          {selectedDateStr && (
            <div className="panel p-6 shadow-sm bg-gradient-to-br from-[#E2E9DF]/60 to-white border border-[#E2E9DF] rounded-3xl animate-fade-in">
              <div className="flex items-center justify-between mb-3 border-b border-[#E2E9DF] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5D3C]">
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
                      className="p-3 bg-white border border-[#E2E9DF] rounded-2xl shadow-sm hover:border-[#4B5D3C]/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            g.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : g.status === 'Stalled'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-[#E2E9DF] text-[#3A492E] border border-[#E2E9DF]'
                          }`}
                        >
                          {g.status}
                        </span>
                        <div className="flex items-center gap-2">
                          {onSyncGoal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSyncGoal(g);
                              }}
                              className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                                g.calendar_synced
                                  ? 'text-emerald-600 hover:text-emerald-700'
                                  : 'text-[#4B5D3C] hover:text-[#3A492E]'
                              }`}
                              title={g.calendar_synced ? 'Synced with Google Calendar' : 'Sync with Google Calendar'}
                            >
                              <CalendarIcon size={12} />
                              <span>{g.calendar_synced ? 'Synced' : 'Sync'}</span>
                            </button>
                          )}
                          {onOpenEdit && (
                            <button
                              type="button"
                              onClick={() => onOpenEdit(g)}
                              className="text-[11px] text-slate-500 font-bold hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
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
                <Clock size={18} className="text-[#4B5D3C]" />
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
                  const deadlineInfo = getGoalDeadlineStatus(goal);
                  return (
                    <div key={goal.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Dynamic Deadline Badge */}
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${deadlineInfo.badgeClass}`}>
                            {deadlineInfo.reminderLabel}
                          </span>

                          {/* Priority Tag */}
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

                          {/* Action Required Alert for approaching deadlines (<= 2 days) */}
                          {!deadlineInfo.isOverdue && deadlineInfo.daysRemaining !== null && deadlineInfo.daysRemaining <= 2 && deadlineInfo.daysRemaining >= 0 && (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ⚠️ Action Required
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

                      <div className="flex items-center gap-1 shrink-0">
                        {onSyncGoal && (
                          <button
                            type="button"
                            onClick={() => onSyncGoal(goal)}
                            className={`p-1.5 rounded-lg transition ${
                              goal.calendar_synced
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-slate-400 hover:text-[#4B5D3C] hover:bg-[#E2E9DF]/40'
                            }`}
                            title={goal.calendar_synced ? "Synced with Google Calendar" : "Sync with Google Calendar"}
                          >
                            <CalendarIcon size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onQuickStatusChange && onQuickStatusChange(goal.id, 'Completed')}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Mark Completed"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
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