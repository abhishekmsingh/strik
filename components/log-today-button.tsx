"use client";

import { useTransition } from "react";
import { logToday } from "@/app/actions/log";

export function LogTodayButton({
  streakId,
  disabled,
}: {
  streakId: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return (
      <div className="flex h-12 w-full items-center justify-center rounded-xl border border-border bg-subtle text-sm text-muted">
        checked in for today
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logToday(streakId);
        })
      }
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-medium text-accent-foreground transition hover:opacity-95 active:scale-[.99] disabled:opacity-60"
    >
      <span className="text-lg leading-none">✓</span>
      {pending ? "saving…" : "did it today"}
    </button>
  );
}
