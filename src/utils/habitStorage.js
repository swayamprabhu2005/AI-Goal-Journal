/**
 * Habit Tracker — pure date/streak calculation helpers.
 *
 * NOTE: Persistence now lives on the backend Habit API (FastAPI). This module
 * intentionally contains NO localStorage/API code — only the reusable,
 * deterministic date + streak helpers shared by the frontend.
 *
 * Date shape used by these helpers:
 *   'YYYY-MM-DD' strings (local-time based, no TZ surprises).
 */

/* ---------- Date helpers (local-time based, no TZ surprises) ---------- */

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

/** Parse 'YYYY-MM-DD' into a local Date at midnight. */
export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Add n days to a 'YYYY-MM-DD' string. */
export function addDaysISO(iso, n) {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + n);
  return toISODate(date);
}

/** Full day name for an ISO date, e.g. 'Mon'. */
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dayLabel(iso) {
  return DAY_LABELS[fromISODate(iso).getDay()];
}

/** Formats the date number with ordinal suffix, e.g. '21st', '2nd', '3rd', '4th'. */
export function formatDayNumberWithOrdinal(iso) {
  const d = fromISODate(iso).getDate();
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1:  return `${d}st`;
    case 2:  return `${d}nd`;
    case 3:  return `${d}rd`;
    default: return `${d}th`;
  }
}

/** 7 ISO dates for the week starting on Monday (Mon - Sun), adjusted by weekOffset (0 = current week). */
export function getWeekDays(weekOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + weekOffset * 7);
  const currentDay = now.getDay();
  // Monday is 1; if Sunday (0), distance is 6 days back
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(toISODate(d));
  }
  return days;
}

/** Most recent `count` ISO dates ending today (chronological). */
export function lastNDays(count = 7) {
  const days = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(addDaysISO(todayISO(), -i));
  }
  return days;
}

/* ----------------------- Streak calculation ----------------------- */

/**
 * Current streak = consecutive checked-off days counting backwards from
 * today. If today is not yet checked, the streak counts from yesterday
 * (today is still "in progress" and shouldn't break the streak).
 * For weekly habits, streak = consecutive weeks with at least one completion.
 */
export function calculateCurrentStreak(completedDates, frequency = 'daily') {
  if (!completedDates || completedDates.length === 0) return 0;
  const set = new Set(completedDates);
  const today = todayISO();

  if (frequency === 'weekly') {
    // Map each completion to the ISO date of the Monday of its week.
    const toWeekStart = (iso) => {
      const d = fromISODate(iso);
      const offset = (d.getDay() + 6) % 7; // Monday = 0
      return addDaysISO(iso, -offset);
    };
    const weeks = new Set([...set].map(toWeekStart));
    const todayWeek = toWeekStart(today);
    let cursor = weeks.has(todayWeek) ? todayWeek : addDaysISO(todayWeek, -7);
    let streak = 0;
    while (weeks.has(cursor)) {
      streak += 1;
      cursor = addDaysISO(cursor, -7);
    }
    return streak;
  }

  // Daily: start anchor — today if checked, otherwise yesterday.
  let cursor = set.has(today) ? today : addDaysISO(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive daily completions ever recorded. */
export function calculateBestStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;
  const sorted = [...new Set(completedDates)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = addDaysISO(sorted[i - 1], 1) === sorted[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Convenience aggregate for the stats header. */
export function habitStats(habits, completions) {
  const today = todayISO();
  const dueToday = habits.filter((h) => h.frequency !== 'weekly');
  const doneToday = dueToday.filter((h) => (completions[h.id] || []).includes(today)).length;

  let activeStreaks = 0;
  let bestStreak = 0;
  let totalCheckoffs = 0;

  habits.forEach((habit) => {
    const dates = completions[habit.id] || [];
    totalCheckoffs += dates.length;
    bestStreak = Math.max(bestStreak, calculateBestStreak(dates));
    if (calculateCurrentStreak(dates, habit.frequency) > 0) activeStreaks += 1;
  });

  return {
    totalHabits: habits.length,
    dueToday: dueToday.length,
    doneToday,
    activeStreaks,
    bestStreak,
    totalCheckoffs,
  };
}