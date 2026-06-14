"use client";

import { useState } from "react";

export function ShareButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = `${window.location.origin}/streak/join/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fall back to prompt
      window.prompt("copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted transition hover:border-foreground/30 hover:text-foreground"
    >
      {copied ? "copied ✓" : "share streak"}
    </button>
  );
}
