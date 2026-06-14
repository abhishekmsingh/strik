import Link from "next/link";
import { currentStreak, loggedToday, type StreakLog } from "@/lib/streak";
import { LogTodayButton } from "./log-today-button";

export type PeerProgress = {
  display_name: string;
  count: number;
  is_self: boolean;
};

export function StreakCard({
  streak,
  logs,
  peers,
}: {
  streak: { id: string; name: string; freezes_per_month: number };
  logs: StreakLog[];
  peers: PeerProgress[];
}) {
  const count = currentStreak(logs);
  const checkedIn = loggedToday(logs);

  return (
    <article className="rounded-3xl border border-border bg-card p-6 transition hover:border-foreground/20">
      <Link href={`/streak/${streak.id}`} className="block">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-medium">{streak.name}</h2>
          {checkedIn && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
              today ✓
            </span>
          )}
        </div>

        <div className="mt-6 flex items-baseline gap-3">
          <span
            className={`text-7xl font-medium leading-none tracking-tight tabular-nums ${
              checkedIn ? "text-accent" : "text-foreground"
            }`}
          >
            {count}
          </span>
          <span className="text-sm text-muted">
            {count === 1 ? "day" : "days"}
          </span>
        </div>
      </Link>

      <div className="mt-6">
        <LogTodayButton streakId={streak.id} disabled={checkedIn} />
      </div>

      {peers.length > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
          {peers.map((p) => (
            <span
              key={p.display_name + p.count}
              className={p.is_self ? "text-foreground" : "text-muted"}
            >
              {p.display_name}{" "}
              <span className="font-semibold tabular-nums">{p.count}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
