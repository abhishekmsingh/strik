import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip static assets, Next-generated icons/manifest, and the SW.
     * These must be reachable without auth so the PWA can install and
     * the browser can fetch its favicon / apple-touch-icon.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js)$).*)",
  ],
};
