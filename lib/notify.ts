/**
 * Notification copy + scheduling decisions for the cron fan-out.
 *
 * Three slots fire per streak per day, each in the user's local time:
 *   - morning   at hour 6
 *   - midday    at hour 12
 *   - reminder  at the streak's `reminder_hour`
 *
 * If `reminder_hour` lands on 6 or 12 we use the morning/midday copy
 * (one notification per streak per hour, not duplicated).
 *
 * The reminder slot is skipped when the user has already checked in for
 * today — there's nothing to remind them about.
 */

export const MORNING_HOUR = 6;
export const MIDDAY_HOUR = 12;

export type Slot = "morning" | "midday" | "reminder";

export type NotifPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

/**
 * Return the local hour (0-23) right now in the given IANA timezone.
 * Falls back to UTC if the zone string is unrecognised.
 */
export function localHourIn(timezone: string, now: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    if (!hourPart) return now.getUTCHours();
    // "24" can appear in some locales for midnight; normalize to 0.
    const h = parseInt(hourPart.value, 10) % 24;
    return Number.isFinite(h) ? h : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

/**
 * Pick the slot that should fire for this streak right now, or null if none.
 *
 * Order matters: morning > midday > reminder, so a streak whose reminder_hour
 * happens to be 6 or 12 just gets the warmer fixed-slot copy.
 */
export function chooseSlot(
  localHour: number,
  reminderHour: number,
  loggedToday: boolean,
): Slot | null {
  if (localHour === MORNING_HOUR) return "morning";
  if (localHour === MIDDAY_HOUR) return "midday";
  if (localHour === reminderHour) {
    return loggedToday ? null : "reminder";
  }
  return null;
}

export function buildPayload(args: {
  slot: Slot;
  streakId: string;
  streakName: string;
  count: number;
}): NotifPayload {
  const { slot, streakId, streakName, count } = args;
  const url = `/streak/${streakId}`;
  // Tag per (streak, slot) so a second cron run in the same hour doesn't
  // stack two notifications on top of each other.
  const tag = `strik-${streakId}-${slot}`;

  if (slot === "morning") {
    return {
      title: "good morning ☀",
      body:
        count > 0
          ? `${streakName} — day ${count}. let's keep it going.`
          : `${streakName} — today's a clean start.`,
      url,
      tag,
    };
  }

  if (slot === "midday") {
    return {
      title: "midway check",
      body:
        count > 0
          ? `still in this — ${streakName}, day ${count}.`
          : `${streakName} — half the day left.`,
      url,
      tag,
    };
  }

  // reminder
  return {
    title: streakName,
    body:
      count > 0
        ? `log today before midnight? you're at ${count} days.`
        : `log today's check-in and start the streak.`,
    url,
    tag,
  };
}
