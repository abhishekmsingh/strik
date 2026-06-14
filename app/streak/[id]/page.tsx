import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  currentStreak,
  freezesUsedThisMonth,
  loggedToday,
  type StreakLog,
} from "@/lib/streak";
import { LogTodayButton } from "@/components/log-today-button";
import { MonthCalendar } from "@/components/calendar";
import { ShareButton } from "@/components/share-button";
import { DeleteStreakButton } from "@/components/delete-streak-button";

type PageProps = { params: Promise<{ id: string }> };

export default async function StreakDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: streak } = await supabase
    .from("streaks")
    .select("id, name, freezes_per_month, reminder_hour, shared_streak_id, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!streak) notFound();

  const isOwner = streak.owner_id === user.id;

  const { data: logsData } = await supabase
    .from("streak_logs")
    .select("log_date, status")
    .eq("streak_id", id)
    .order("log_date", { ascending: false });
  const logs = (logsData ?? []) as StreakLog[];

  const count = currentStreak(logs);
  const checkedIn = loggedToday(logs);
  const freezesUsed = freezesUsedThisMonth(logs);

  // peers on the shared streak
  const { data: peerStreaks } = await supabase
    .from("streaks")
    .select("id, owner_id")
    .eq("shared_streak_id", streak.shared_streak_id)
    .neq("owner_id", user.id);
  const peerIds = (peerStreaks ?? []).map((s) => s.owner_id);
  const peerStreakIds = (peerStreaks ?? []).map((s) => s.id);

  const peerLogsPromise =
    peerStreakIds.length > 0
      ? supabase
          .from("streak_logs")
          .select("streak_id, log_date, status")
          .in("streak_id", peerStreakIds)
      : Promise.resolve({ data: [] as { streak_id: string; log_date: string; status: StreakLog["status"] }[] });
  const peerProfilesPromise =
    peerIds.length > 0
      ? supabase.from("profiles").select("id, display_name").in("id", peerIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] });

  const [{ data: peerLogs }, { data: peerProfiles }] = await Promise.all([
    peerLogsPromise,
    peerProfilesPromise,
  ]);

  const peers = (peerStreaks ?? []).map((s) => {
    const ownerName =
      (peerProfiles ?? []).find((p) => p.id === s.owner_id)?.display_name ?? "?";
    const sLogs = (peerLogs ?? []).filter((l) => l.streak_id === s.id);
    return { name: ownerName, count: currentStreak(sLogs) };
  });

  const now = new Date();
  const monthName = now.toLocaleString("en", { month: "long" });

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← home
        </Link>
        {isOwner && <ShareButton code={streak.shared_streak_id} />}
      </div>

      <div className="mt-8">
        <h1 className="text-base text-muted">{streak.name}</h1>
        <div className="mt-2 flex items-baseline gap-3">
          <span
            className={`serif text-8xl leading-none ${
              checkedIn ? "text-accent" : "text-foreground"
            }`}
          >
            {count}
          </span>
          <span className="text-base text-muted">
            {count === 1 ? "day" : "days"}
          </span>
        </div>
        {streak.freezes_per_month > 0 && (
          <p className="mt-3 text-xs text-muted">
            freezes this month:{" "}
            <span className="text-foreground">
              {freezesUsed} / {streak.freezes_per_month}
            </span>
          </p>
        )}
      </div>

      {isOwner && (
        <div className="mt-8">
          <LogTodayButton streakId={streak.id} disabled={checkedIn} />
        </div>
      )}

      <div className="mt-10 rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="serif text-2xl">{monthName}</h3>
          <span className="text-xs text-muted">{now.getFullYear()}</span>
        </div>
        <MonthCalendar
          year={now.getFullYear()}
          monthIdx={now.getMonth()}
          logs={logs}
        />
      </div>

      {peers.length > 0 && (
        <div className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h3 className="text-sm text-muted">also on this streak</h3>
          <ul className="mt-3 space-y-2">
            {peers.map((p) => (
              <li
                key={p.name}
                className="flex items-baseline justify-between"
              >
                <span>{p.name}</span>
                <span className="serif text-2xl text-foreground">
                  {p.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOwner && (
        <div className="mt-10 flex justify-end pb-4">
          <DeleteStreakButton streakId={streak.id} />
        </div>
      )}
    </main>
  );
}
