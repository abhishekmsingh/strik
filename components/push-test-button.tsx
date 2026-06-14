"use client";

import { useState } from "react";

export function PushTestButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function send() {
    setState("sending");
    try {
      const r = await fetch("/api/push/test", { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      setState("sent");
      setTimeout(() => setState("idle"), 1500);
    } catch (e) {
      console.error(e);
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  const label =
    state === "sending"
      ? "sending…"
      : state === "sent"
        ? "sent ✓"
        : state === "error"
          ? "failed"
          : "send test push";

  return (
    <button
      type="button"
      onClick={send}
      disabled={state === "sending"}
      className="text-xs text-muted hover:text-foreground disabled:opacity-60"
    >
      {label}
    </button>
  );
}
