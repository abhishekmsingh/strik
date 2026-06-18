import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StreakCard, type PeerProgress } from "@/components/streak-card";
import { PushBanner } from "@/components/push-banner";
import { signOut } from "./sign-in/actions";
import { computeStreakState, toDateKey, type StreakLog } from "@/lib/streak";

type StreakRow = {
  id: string;
  name: string;
  freezes_per_month: number;
  shared_streak_id: string;
  owner_id: string;
  created_at: string;
};

type LogRow = StreakLog & { streak_id: string };

type ProfileRow = { id: string; display_name: string };

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // middleware guarantees user, but TS doesn't know that.
  if (!user) return null;

  // All streaks visible to me (own + co-enrolled, per RLS).
  const { data: streaksData } = await supabase
    .from("streaks")
    .select("id, name, freezes_per_month, shared_streak_id, owner_id, created_at")
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  const allStreaks = (streaksData ?? []) as StreakRow[];

  const myStreaks = allStreaks.filter((s) => s.owner_id === user.id);

  if (myStreaks.length === 0) {
    return <EmptyState displayName={null} />;
  }

  // Fetch all logs for visible streaks (RLS filters automatically).
  const streakIds = allStreaks.map((s) => s.id);
  const { data: logsData } = await supabase
    .from("streak_logs")
    .select("streak_id, log_date")
    .in("streak_id", streakIds);
  const allLogs = (logsData ?? []) as LogRow[];

  // Profiles for peer display names.
  const ownerIds = Array.from(new Set(allStreaks.map((s) => s.owner_id)));
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ownerIds);
  const profiles = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((p) => [p.id, p.display_name]),
  );

  const { data: pushSubs } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", user.id);
  const pushEndpoints = (pushSubs ?? []).map((s) => s.endpoint);

  return (
    <main className="flex flex-1 flex-col">
      <header className="mb-10 flex items-baseline justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">strik</h1>
          <p className="mt-1 text-sm text-muted">
            {profiles.get(user.id) ?? "you"}
          </p>
        </div>
        <form action={signOut}>
          <button className="text-xs text-muted hover:text-foreground">
            sign out
          </button>
        </form>
      </header>

      <PushBanner subscribedEndpoints={pushEndpoints} />

      <div className="flex flex-col gap-4">
        {myStreaks.map((s) => {
          const myLogs = allLogs.filter((l) => l.streak_id === s.id);
          const peers = buildPeers(s, allStreaks, allLogs, profiles, user.id);
          return (
            <StreakCard key={s.id} streak={s} logs={myLogs} peers={peers} />
          );
        })}

        <Link
          href="/streak/new"
          className="mt-2 flex h-14 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted transition hover:border-foreground/30 hover:text-foreground"
        >
          + new streak
        </Link>
      </div>
    </main>
  );
}

function buildPeers(
  myStreak: StreakRow,
  allStreaks: StreakRow[],
  allLogs: LogRow[],
  profiles: Map<string, string>,
  selfId: string,
): PeerProgress[] {
  const peerStreaks = allStreaks.filter(
    (s) => s.shared_streak_id === myStreak.shared_streak_id,
  );
  if (peerStreaks.length <= 1) return [];
  return peerStreaks.map((s) => {
    const logs = allLogs.filter((l) => l.streak_id === s.id);
    const start = toDateKey(new Date(s.created_at));
    return {
      display_name: profiles.get(s.owner_id) ?? "?",
      count: computeStreakState(logs, s.freezes_per_month, start).count,
      is_self: s.owner_id === selfId,
    };
  });
}

function EmptyState({ displayName }: { displayName: string | null }) {
  return (
    <main className="flex flex-1 flex-col justify-center">
      <h1 className="text-4xl font-semibold tracking-tight">strik</h1>
      <p className="mt-2 text-muted">
        {displayName ? `hi ${displayName}.` : "welcome."} no streaks yet.
      </p>
      <Link
        href="/streak/new"
        className="mt-10 flex h-14 items-center justify-center rounded-2xl bg-foreground text-base font-medium text-background transition hover:opacity-90"
      >
        start your first streak
      </Link>
      <form action={signOut} className="mt-6 text-center">
        <button className="text-xs text-muted hover:text-foreground">
          sign out
        </button>
      </form>
    </main>
  );
}
