import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "magiclink"
    | "signup"
    | "recovery"
    | "invite"
    | "email_change"
    | "email"
    | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // Path 1: PKCE flow (?code=…) — same device only.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
      code,
    });
    return NextResponse.redirect(
      `${origin}/sign-in?error=callback_pkce&reason=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  // Path 2: OTP / verify-with-hash flow (?token_hash=…&type=…) — cross-device.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/callback] verifyOtp failed", {
      message: error.message,
      status: error.status,
      type,
    });
    return NextResponse.redirect(
      `${origin}/sign-in?error=callback_otp&reason=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  console.error("[auth/callback] no code or token_hash in URL", {
    url: request.url,
  });
  return NextResponse.redirect(`${origin}/sign-in?error=callback_missing`);
}
