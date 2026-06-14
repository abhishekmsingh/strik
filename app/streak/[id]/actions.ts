"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteStreak(streakId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // RLS limits delete to rows you own. streak_logs cascades via FK.
  // If this is a shared streak with other enrolled peers, only your copy
  // is removed; the others keep theirs.
  const { error } = await supabase.from("streaks").delete().eq("id", streakId);
  if (error) {
    console.error("deleteStreak failed", error);
    redirect(`/streak/${streakId}?error=delete_failed`);
  }

  revalidatePath("/");
  redirect("/");
}
