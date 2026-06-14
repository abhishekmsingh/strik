"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/streak";

export async function logToday(streakId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const today = todayKey();

  // upsert — if a 'missed' or 'freeze' row exists for today, replace with 'done'.
  const { error } = await supabase.from("streak_logs").upsert(
    {
      streak_id: streakId,
      log_date: today,
      status: "done",
    },
    { onConflict: "streak_id,log_date" },
  );

  if (error) throw error;

  revalidatePath("/");
  revalidatePath(`/streak/${streakId}`);
}

export async function unlogToday(streakId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const today = todayKey();

  // Drop today's row entirely — the user is in the "I didn't actually do it"
  // state. RLS limits delete to streaks they own.
  const { error } = await supabase
    .from("streak_logs")
    .delete()
    .eq("streak_id", streakId)
    .eq("log_date", today);

  if (error) throw error;

  revalidatePath("/");
  revalidatePath(`/streak/${streakId}`);
}
