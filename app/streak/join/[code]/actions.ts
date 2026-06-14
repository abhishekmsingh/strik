"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function joinSharedStreak(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Find the streak template via the SECURITY DEFINER RPC — needed because
  // a not-yet-enrolled user can't see the row through RLS.
  const { data: templateRows } = await supabase.rpc(
    "get_shared_streak_template",
    { code },
  );
  const template = (templateRows ?? [])[0] as
    | { name: string; freezes_per_month: number; reminder_hour: number }
    | undefined;

  if (!template) redirect(`/streak/join/${code}?error=not_found`);

  // Already enrolled? Send to your existing copy.
  const { data: mine } = await supabase
    .from("streaks")
    .select("id")
    .eq("shared_streak_id", code)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (mine) redirect(`/streak/${mine.id}`);

  const newId = randomUUID();
  const { error } = await supabase.from("streaks").insert({
    id: newId,
    owner_id: user.id,
    name: template.name,
    freezes_per_month: template.freezes_per_month,
    reminder_hour: template.reminder_hour,
    shared_streak_id: code,
  });
  if (error) {
    console.error("joinSharedStreak", error);
    redirect(`/streak/join/${code}?error=join_failed`);
  }

  revalidatePath("/");
  redirect(`/streak/${newId}`);
}
