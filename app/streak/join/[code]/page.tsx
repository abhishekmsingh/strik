import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { joinSharedStreak } from "./actions";
import { SubmitButton } from "@/components/submit-button";

type PageProps = { params: Promise<{ code: string }> };

export default async function JoinStreakPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch the streak template via SECURITY DEFINER RPC — bypasses RLS so a
  // not-yet-enrolled user can see the name + settings of the invite.
  const { data: templateRows } = await supabase.rpc(
    "get_shared_streak_template",
    { code },
  );
  const streakInGroup = (templateRows ?? [])[0] as
    | { name: string; freezes_per_month: number; reminder_hour: number }
    | undefined;

  // Check if I'm already enrolled (subject to RLS — fine, I own the row).
  const { data: mine } = await supabase
    .from("streaks")
    .select("id")
    .eq("shared_streak_id", code)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (mine) {
    return (
      <main className="flex flex-1 flex-col justify-center">
        <h1 className="serif text-3xl">already in</h1>
        <p className="mt-2 text-muted">
          you&apos;re already tracking this streak.
        </p>
        <Link
          href={`/streak/${mine.id}`}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-medium text-background"
        >
          open it
        </Link>
      </main>
    );
  }

  if (!streakInGroup) {
    return (
      <main className="flex flex-1 flex-col justify-center">
        <h1 className="serif text-3xl">link not found</h1>
        <p className="mt-2 text-muted">
          this streak doesn&apos;t exist, or the owner needs to share it from
          their app first.
        </p>
        <Link
          href="/"
          className="mt-8 text-sm text-muted hover:text-foreground"
        >
          ← home
        </Link>
      </main>
    );
  }

  const joinAction = joinSharedStreak.bind(null, code);

  return (
    <main className="flex flex-1 flex-col justify-center">
      <p className="text-sm text-muted">a friend invited you to</p>
      <h1 className="serif mt-2 text-4xl tracking-tight">
        {streakInGroup.name}
      </h1>
      <p className="mt-4 text-sm text-muted">
        you&apos;ll get your own counter, starting at 0. you&apos;ll see each
        other&apos;s progress.
      </p>

      <form action={joinAction} className="mt-10">
        <SubmitButton className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-medium text-background transition hover:opacity-90">
          join the streak
        </SubmitButton>
      </form>
      <Link
        href="/"
        className="mt-4 block text-center text-xs text-muted hover:text-foreground"
      >
        no thanks
      </Link>
    </main>
  );
}
