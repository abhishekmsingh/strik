"use client";

import { useState, useTransition } from "react";
import { deleteStreak } from "@/app/streak/[id]/actions";

export function DeleteStreakButton({ streakId }: { streakId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-muted transition hover:text-foreground"
      >
        delete streak
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-xs">
      <span className="text-muted">delete and lose all history?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteStreak(streakId);
          })
        }
        className="rounded-full bg-foreground px-3 py-1 text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "deleting…" : "yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="text-muted hover:text-foreground"
      >
        cancel
      </button>
    </span>
  );
}
