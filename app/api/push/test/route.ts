import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { webpush } from "@/lib/web-push";

// web-push uses node:crypto + https — must run on the node runtime, not edge.
export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, pruned: 0, hint: "no subscriptions on this account yet" });
  }

  const payload = JSON.stringify({
    title: "strik",
    body: "test notification — push is working ✓",
    url: "/",
    tag: "strik-test",
  });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      ),
    ),
  );

  // Endpoints that the push service has retired — clean them up.
  const dead: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const status = (r.reason as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) dead.push(subs[i].endpoint);
      else console.error("[push/test] send failed", r.reason);
    }
  });
  if (dead.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .in("endpoint", dead);
  }

  return NextResponse.json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    pruned: dead.length,
  });
}
