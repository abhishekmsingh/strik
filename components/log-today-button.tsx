"use client";

import { useState, useTransition } from "react";
import { logToday, unlogToday } from "@/app/actions/log";
import { Dots } from "./dots";

export function LogTodayButton({
  streakId,
  disabled,
}: {
  streakId: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingUndo, setConfirmingUndo] = useState(false);

  // Checked-in state → show a strong undo button (with a one-step confirm so
  // a stray tap doesn't nuke the streak).
  if (disabled) {
    if (confirmingUndo) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await unlogToday(streakId);
                setConfirmingUndo(false);
              })
            }
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#b91c1c] text-base font-medium text-white transition hover:opacity-90 active:scale-[.99] disabled:opacity-80 ${
              pending ? "cursor-progress" : ""
            }`}
          >
            {pending ? <Dots /> : "yes, undo today"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingUndo(false)}
            disabled={pending}
            className="flex h-12 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm text-muted transition hover:text-foreground"
          >
            cancel
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setConfirmingUndo(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#b91c1c]/30 bg-card text-base font-medium text-[#b91c1c] transition hover:bg-[#b91c1c]/5"
      >
        undo today&apos;s check-in
      </button>
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
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-medium text-accent-foreground transition hover:opacity-95 active:scale-[.99] disabled:opacity-80 ${
        pending ? "cursor-progress" : ""
      }`}
    >
      {pending ? (
        <Dots />
      ) : (
        <>
          <span className="text-lg leading-none">✓</span>
          did it today
        </>
      )}
    </button>
  );
}
