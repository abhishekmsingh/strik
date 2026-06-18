import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { webpush } from "@/lib/web-push";
import {
  buildPayload,
  chooseSlot,
  localHourIn,
  type Slot,
} from "@/lib/notify";
import {
  computeStreakState,
  loggedToday,
  toDateKey,
  type StreakLog,
} from "@/lib/streak";

// web-push uses node:crypto + https
export const runtime = "nodejs";
// Vercel cron pings can take a few seconds when fanning out — give them room.
export const maxDuration = 60;

type Sub = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
};

type Streak = {
  id: string;
  owner_id: string;
  name: string;
  reminder_hour: number;
  freezes_per_month: number;
  created_at: string;
};

type LogRow = StreakLog & { streak_id: string };

export async function GET(request: Request) {
  // Vercel-Cron requests carry Authorization: Bearer <CRON_SECRET>.
  // Manual curl from a dev can use the same header to test.
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  // Manual override for testing — only honored once auth has already passed.
  const forceHourParam = url.searchParams.get("force_hour");
  const dry = url.searchParams.get("dry") === "1";
  const forceHour =
    forceHourParam !== null && /^\d+$/.test(forceHourParam)
      ? Math.max(0, Math.min(23, parseInt(forceHourParam, 10)))
      : null;

  const supabase = createServiceClient();

  const { data: subsData, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth, timezone");
  if (subsErr) {
    console.error("[cron] subs query failed", subsErr);
    return NextResponse.json({ error: "subs_query" }, { status: 500 });
  }
  const subs = (subsData ?? []) as Sub[];
  if (subs.length === 0) {
    return NextResponse.json({ ok: true, subs: 0, sent: 0 });
  }

  const userIds = Array.from(new Set(subs.map((s) => s.user_id)));

  const { data: streaksData } = await supabase
    .from("streaks")
    .select("id, owner_id, name, reminder_hour, freezes_per_month, created_at")
    .in("owner_id", userIds)
    .is("archived_at", null);
  const streaks = (streaksData ?? []) as Streak[];
  const streaksByUser = new Map<string, Streak[]>();
  for (const s of streaks) {
    const arr = streaksByUser.get(s.owner_id) ?? [];
    arr.push(s);
    streaksByUser.set(s.owner_id, arr);
  }

  // Fetch all logs in one shot, group per streak.
  const streakIds = streaks.map((s) => s.id);
  const logsByStreak = new Map<string, StreakLog[]>();
  if (streakIds.length > 0) {
    const { data: logsData } = await supabase
      .from("streak_logs")
      .select("streak_id, log_date")
      .in("streak_id", streakIds);
    for (const l of (logsData ?? []) as LogRow[]) {
      const arr = logsByStreak.get(l.streak_id) ?? [];
      arr.push({ log_date: l.log_date });
      logsByStreak.set(l.streak_id, arr);
    }
  }

  type Planned = {
    sub: Sub;
    streakId: string;
    slot: Slot;
    payload: string;
  };
  const planned: Planned[] = [];
  const now = new Date();

  for (const sub of subs) {
    const hour =
      forceHour !== null ? forceHour : localHourIn(sub.timezone, now);
    const userStreaks = streaksByUser.get(sub.user_id) ?? [];
    for (const streak of userStreaks) {
      const logs = logsByStreak.get(streak.id) ?? [];
      const slot = chooseSlot(hour, streak.reminder_hour, loggedToday(logs));
      if (!slot) continue;
      const start = toDateKey(new Date(streak.created_at));
      const { count } = computeStreakState(
        logs,
        streak.freezes_per_month,
        start,
      );
      const payload = buildPayload({
        slot,
        streakId: streak.id,
        streakName: streak.name,
        count,
      });
      planned.push({
        sub,
        streakId: streak.id,
        slot,
        payload: JSON.stringify(payload),
      });
    }
  }

  if (dry) {
    return NextResponse.json({
      ok: true,
      subs: subs.length,
      planned: planned.length,
      preview: planned.slice(0, 10).map((p) => ({
        endpoint: p.sub.endpoint.slice(0, 60) + "…",
        timezone: p.sub.timezone,
        slot: p.slot,
        streak_id: p.streakId,
        payload: JSON.parse(p.payload),
      })),
    });
  }

  const dead = new Set<string>();
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    planned.map(async (p) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: p.sub.endpoint,
            keys: { p256dh: p.sub.p256dh, auth: p.sub.auth },
          },
          p.payload,
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          dead.add(p.sub.endpoint);
        } else {
          console.error("[cron] send failed", {
            status,
            endpoint: p.sub.endpoint.slice(0, 60),
            err: (err as Error)?.message,
          });
        }
      }
    }),
  );

  let pruned = 0;
  if (dead.size > 0) {
    const { error: delErr, count } = await supabase
      .from("push_subscriptions")
      .delete({ count: "exact" })
      .in("endpoint", Array.from(dead));
    if (delErr) console.error("[cron] prune failed", delErr);
    pruned = count ?? dead.size;
  }

  return NextResponse.json({
    ok: true,
    subs: subs.length,
    streaks: streaks.length,
    planned: planned.length,
    sent,
    failed,
    pruned,
  });
}
