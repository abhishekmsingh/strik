"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/actions/push";
import { Dots } from "./dots";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State =
  | "checking" // still figuring out the situation
  | "prompt" // can subscribe — show the enable button
  | "denied" // permission blocked, can't subscribe from here
  | "ready" // this device is registered and permission is granted
  | "unsupported"; // browser can't do web push

type TestState = "idle" | "sending" | "sent" | "error";

export function PushBanner({
  subscribedEndpoints,
}: {
  subscribedEndpoints: string[];
}) {
  const [state, setState] = useState<State>("checking");
  const [pending, setPending] = useState(false);
  const [test, setTest] = useState<TestState>("idle");

  // Decide which UI to show based on three signals:
  //   1. browser support
  //   2. push permission (preferring pushManager.permissionState which is
  //      more reliable on Android than Notification.permission alone)
  //   3. whether this device's push endpoint matches a saved DB row
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setState("unsupported");
        return;
      }

      let reg: ServiceWorkerRegistration;
      try {
        reg = await navigator.serviceWorker.ready;
      } catch {
        if (!cancelled) setState("prompt");
        return;
      }

      // permissionState is push-specific and reflects OS-level disables more
      // reliably than Notification.permission on Chrome Android.
      let permission: PermissionState = "prompt";
      try {
        permission = await reg.pushManager.permissionState({
          userVisibleOnly: true,
        });
      } catch {
        permission =
          Notification.permission === "granted"
            ? "granted"
            : Notification.permission === "denied"
              ? "denied"
              : "prompt";
      }

      if (permission === "denied") {
        // If the DB still thinks we're subscribed, clear that out so the cron
        // doesn't keep targeting a dead endpoint.
        const sub = await reg.pushManager.getSubscription();
        if (sub && subscribedEndpoints.includes(sub.endpoint)) {
          await removePushSubscription(sub.endpoint).catch(() => {});
        }
        if (!cancelled) setState("denied");
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      if (
        permission === "granted" &&
        sub &&
        subscribedEndpoints.includes(sub.endpoint)
      ) {
        if (!cancelled) setState("ready");
        return;
      }

      if (!cancelled) setState("prompt");
    })();
    return () => {
      cancelled = true;
    };
  }, [subscribedEndpoints]);

  async function enable() {
    setPending(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "prompt");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
        ),
      });
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await savePushSubscription(json, tz);
      setState("ready");
    } catch (e) {
      console.error("subscribe failed", e);
    } finally {
      setPending(false);
    }
  }

  async function sendTest() {
    setTest("sending");
    try {
      const r = await fetch("/api/push/test", { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      setTest("sent");
      setTimeout(() => setTest("idle"), 1500);
    } catch (e) {
      console.error(e);
      setTest("error");
      setTimeout(() => setTest("idle"), 2000);
    }
  }

  if (state === "checking" || state === "unsupported") return null;

  if (state === "denied") {
    return (
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        notifications are blocked for strik. open your browser or system
        settings and re-allow them to get streak reminders.
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm">
        <span className="text-muted">reminders are on for this device.</span>
        <button
          type="button"
          onClick={sendTest}
          disabled={test === "sending"}
          className="text-xs text-muted hover:text-foreground disabled:opacity-60"
        >
          {test === "sending"
            ? "sending…"
            : test === "sent"
              ? "sent ✓"
              : test === "error"
                ? "failed"
                : "send test"}
        </button>
      </div>
    );
  }

  // state === "prompt"
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
