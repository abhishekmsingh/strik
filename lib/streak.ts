/**
 * Streak math.
 *
 * Day boundary is local midnight (per spec). A log row exists per (streak, day)
 * with status: 'done' | 'freeze' | 'missed'. Streak counts consecutive non-missed
 * days walking backward from today. If today has no log, today is *not yet broken*
 * (the user still has until midnight) — we treat today as a soft boundary.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type LogStatus = "done" | "freeze" | "missed";

export type StreakLog = {
  log_date: string; // 'YYYY-MM-DD'
  status: LogStatus;
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

/**
 * Count the current active streak from a list of logs (any order).
 *
 * Rules:
 * - 'done' or 'freeze' extends the chain.
 * - 'missed' breaks the chain.
 * - A gap day (no log) breaks the chain — unless it's today (still in progress).
 */
export function currentStreak(logs: StreakLog[]): number {
  const byDate = new Map<string, LogStatus>();
  for (const l of logs) byDate.set(l.log_date, l.status);

  const today = todayKey();
  const cursor = new Date();

  // if today is not yet logged, start counting from yesterday.
  if (!byDate.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  for (;;) {
    const key = toDateKey(cursor);
    const status = byDate.get(key);
    if (status === "done" || status === "freeze") {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

export function loggedToday(logs: StreakLog[]): boolean {
  const t = todayKey();
  return logs.some((l) => l.log_date === t && l.status === "done");
}

/** Number of freezes used in the current calendar month. */
export function freezesUsedThisMonth(logs: StreakLog[]): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return logs.filter((l) => {
    if (l.status !== "freeze") return false;
    const d = new Date(l.log_date + "T00:00:00");
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
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
