/**
 * Streak math.
 *
 * A streak_log row exists per (streak, day) that the user checked in. The DB
 * schema's CHECK constraint still allows {'done','freeze','missed'} from
 * earlier iterations, but in practice we only ever insert 'done' — there's no
 * UI for the other two — so this module treats every row as a check-in and
 * never reads the column.
 *
 * Day boundary is local midnight (per spec). The walk runs backward from
 * today (or yesterday if today not yet logged):
 *   - logged day  → +1
 *   - gap day     → consume one freeze from this gap's calendar-month budget,
 *                   +1; if budget exhausted, the chain breaks
 *   - before the streak's start → break (no pretending the user "missed"
 *                                 days that pre-date the streak)
 *
 * Freezes are virtual — nothing persists. The set of dates the walk absorbed
 * is returned so the calendar can paint them in the soft-lavender freeze
 * style.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type StreakLog = {
  log_date: string; // 'YYYY-MM-DD'
};

export type StreakState = {
  count: number;
  freezesUsedThisMonth: number;
  virtuallyFrozenDates: Set<string>;
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Walk backward from today, applying virtual freezes to gap days when budget
 * remains in that gap's calendar month. Stops at `streakStartDate` so days
 * before the streak existed never burn budget.
 *
 * `streakStartDate` is the YYYY-MM-DD floor — usually `toDateKey(new
 * Date(streak.created_at))`. When omitted the walk has no floor (previous
 * behavior).
 */
export function computeStreakState(
  logs: StreakLog[],
  freezesPerMonth: number,
  streakStartDate?: string,
): StreakState {
  const byDate = new Set<string>(logs.map((l) => l.log_date));

  const today = todayKey();
  const cursor = new Date();

  // Today is in progress — start at yesterday if today not logged.
  if (!byDate.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  const usedByMonth = new Map<string, number>();
  const virtuallyFrozen = new Set<string>();

  let count = 0;
  for (;;) {
    const key = toDateKey(cursor);

    // Don't walk past the day the streak started — those days aren't gaps,
    // they pre-date the existence of the streak.
    if (streakStartDate && key < streakStartDate) break;

    if (byDate.has(key)) {
      count += 1;
    } else {
      const m = monthKey(cursor);
      const used = usedByMonth.get(m) ?? 0;
      if (used < freezesPerMonth) {
        usedByMonth.set(m, used + 1);
        virtuallyFrozen.add(key);
        count += 1;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const currentMonth = monthKey(new Date());
  const freezesUsedThisMonth = usedByMonth.get(currentMonth) ?? 0;

  return { count, freezesUsedThisMonth, virtuallyFrozenDates: virtuallyFrozen };
}

/**
 * Convenience wrapper for callsites that only need the count and where the
 * floor doesn't matter (older code paths). Newer callers should prefer
 * `computeStreakState` directly and pass `streakStartDate`.
 */
export function currentStreak(
  logs: StreakLog[],
  freezesPerMonth = 0,
  streakStartDate?: string,
): number {
  return computeStreakState(logs, freezesPerMonth, streakStartDate).count;
}

export function loggedToday(logs: StreakLog[]): boolean {
  const t = todayKey();
  return logs.some((l) => l.log_date === t);
}

/** Calendar grid for the given month (Sunday-start). Returns 6 weeks. */
export function calendarMonth(
  year: number,
  monthIdx: number,
): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, monthIdx, 1);
  const startWeekday = first.getDay(); // 0..6, Sunday=0
  const gridStart = new Date(year, monthIdx, 1 - startWeekday);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getTime() + i * MS_PER_DAY);
    cells.push({ date: d, inMonth: d.getMonth() === monthIdx });
  }
  return cells;
}
