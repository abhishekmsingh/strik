import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only paths that need to bypass RLS
 * (currently: the notification cron, which reads every user's subscriptions
 * + streaks). Never expose this client to the browser or to any code path
 * authenticated by a user-supplied token.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("missing supabase service-role env vars");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
