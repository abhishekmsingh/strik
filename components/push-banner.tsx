"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/actions/push";
import { Dots } from "./dots";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw =
    typeof window === "undefined"
      ? Buffer.from(b64, "base64").toString("binary")
      : atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "checking" | "show" | "denied" | "unsupported" | "done";

export function PushBanner({
  subscribedEndpoints,
}: {
  subscribedEndpoints: string[];
}) {
  const [state, setState] = useState<State>("checking");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (
          sub &&
          subscribedEndpoints.includes(sub.endpoint) &&
          Notification.permission === "granted"
        ) {
          setState("done");
          return;
        }
        setState("show");
      } catch {
        setState("show");
      }
    })();
  }, [subscribedEndpoints]);

  async function enable() {
    setPending(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "show");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
        ),
      });
      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await savePushSubscription(json, tz);
      setState("done");
    } catch (e) {
      console.error("subscribe failed", e);
    } finally {
      setPending(false);
    }
  }

  if (state === "checking" || state === "done" || state === "unsupported") {
    return null;
  }

  if (state === "denied") {
    return (
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        notifications are blocked for strik. open your browser or system
        settings and re-allow them to get streak reminders.
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-accent-soft bg-accent-soft/40 p-4">
      <p className="text-sm text-foreground">
        turn on reminders so your streaks don&apos;t slip.
      </p>
      <button
        type="button"
        onClick={enable}
        disabled={pending}
        className="flex h-9 min-w-[5rem] items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-80"
      >
        {pending ? <Dots /> : "enable"}
      </button>
    </div>
  );
}
