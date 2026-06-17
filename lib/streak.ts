/**
 * Streak math.
 *
 * Day boundary is local midnight (per spec). A log row exists per (streak, day)
 * with status: 'done' | 'freeze' | 'missed'. Streak counts consecutive non-missed
 * days walking backward from today. If today has no log, today is *not yet broken*
 * (the user still has until midnight) — we treat today as a soft boundary.
 *
 * Freeze budget (virtual): when walking backward we encounter a "gap day" (no
 * log row). If the streak has freezes available for that gap's calendar month,
 * we absorb the gap into the chain and count it as a virtual freeze. The user
 * never sees these as stored rows — they're computed on read, so changing the
 * budget rule never needs a backfill. The set of absorbed dates is returned so
 * the calendar can render them in the soft-lavender freeze style.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type LogStatus = "done" | "freeze" | "missed";

export type StreakLog = {
  log_date: string; // 'YYYY-MM-DD'
  status: LogStatus;
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
 * remains in that gap's calendar month. Returns:
 *   - count: current streak length
 *   - freezesUsedThisMonth: freezes consumed in the *current* calendar month
 *   - virtuallyFrozenDates: dates absorbed by the budget (for visualisation)
 */
export function computeStreakState(
  logs: StreakLog[],
  freezesPerMonth: number,
): StreakState {
  const byDate = new Map<string, LogStatus>();
  for (const l of logs) byDate.set(l.log_date, l.status);

  const today = todayKey();
  const cursor = new Date();

  // Today is in progress — start at yesterday if today not logged.
  if (!byDate.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  // Per-month budget tracker scoped to this walk.
  const usedByMonth = new Map<string, number>();
  const virtuallyFrozen = new Set<string>();

  let count = 0;
  for (;;) {
    const key = toDateKey(cursor);
    const status = byDate.get(key);

    if (status === "done" || status === "freeze") {
      // Stored row that extends the chain.
      count += 1;
    } else if (status === "missed") {
      // Explicit "missed" is a hard break — user-asserted.
      break;
    } else {
      // Gap day. Absorb with this gap's month budget if available.
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
 * Convenience wrapper for callsites that only need the count and the freeze
 * budget isn't material (e.g. an older record that pre-dates freezes). Defaults
 * to 0 budget so the behavior matches the original walk semantics.
 */
export function currentStreak(
  logs: StreakLog[],
  freezesPerMonth = 0,
): number {
  return computeStreakState(logs, freezesPerMonth).count;
}

export function loggedToday(logs: StreakLog[]): boolean {
  const t = todayKey();
  return logs.some((l) => l.log_date === t && l.status === "done");
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
