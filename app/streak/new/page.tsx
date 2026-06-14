import Link from "next/link";
import { createStreak } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export default function NewStreakPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← home
      </Link>

      <div className="mt-10">
        <h1 className="serif text-4xl tracking-tight">new streak</h1>
        <p className="mt-2 text-muted">one thing. one tap a day.</p>
      </div>

      <form action={createStreak} className="mt-10 space-y-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-muted">
            what are you committing to?
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={64}
            placeholder="no junk food"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="freezes_per_month"
            className="mb-2 block text-sm text-muted"
          >
            freezes per month
          </label>
          <input
            id="freezes_per_month"
            name="freezes_per_month"
            type="number"
            min={0}
            max={10}
            defaultValue={0}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent"
          />
          <p className="mt-1.5 text-xs text-muted">
            allowed misses that don&apos;t break the chain. resets every month.
          </p>
        </div>

        <div>
          <label
            htmlFor="reminder_hour"
            className="mb-2 block text-sm text-muted"
          >
            daily reminder
          </label>
          <select
            id="reminder_hour"
            name="reminder_hour"
            defaultValue={20}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">
            we&apos;ll nudge you once a day at this hour.
          </p>
        </div>

        <SubmitButton className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-medium text-background transition hover:opacity-90 active:scale-[.99]">
          start the streak
        </SubmitButton>
      </form>
    </main>
  );
}

function formatHour(h: number) {
  const period = h < 12 ? "am" : "pm";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}
