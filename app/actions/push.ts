"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(
  sub: SubscriptionJSON,
  timezone: string,
) {
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    throw new Error("malformed subscription");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const safeTz = String(timezone || "UTC").slice(0, 64);

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      timezone: safeTz,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) throw error;

  revalidatePath("/");
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  revalidatePath("/");
}
