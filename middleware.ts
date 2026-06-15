import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip static assets, Next-generated icons/manifest, the SW, and the
     * API surface. API routes do their own auth (cookies for user routes,
     * CRON_SECRET for the cron), so the catch-all sign-in redirect would
     * just get in the way.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js)$).*)",
  ],
};
