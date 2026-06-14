"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStreak(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const freezes = Number(formData.get("freezes_per_month") ?? 0);
  const reminder = Number(formData.get("reminder_hour") ?? 20);

  if (!name) redirect("/streak/new?error=missing_name");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Generate the id upfront so we can self-reference shared_streak_id.
  // A freshly-created streak is its own shared group of size 1.
  const streakId = randomUUID();

  const { error } = await supabase.from("streaks").insert({
    id: streakId,
    owner_id: user.id,
    name,
    freezes_per_month: Math.min(10, Math.max(0, freezes)),
    reminder_hour: Math.min(23, Math.max(0, reminder)),
    shared_streak_id: streakId,
  });

  if (error) {
    console.error("createStreak failed", error);
    redirect("/streak/new?error=db");
  }

  revalidatePath("/");
  redirect("/");
}
