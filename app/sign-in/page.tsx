import { signInWithEmail } from "./actions";

type ErrorCode =
  | "missing_email"
  | "send_failed"
  | "callback_pkce"
  | "callback_otp"
  | "callback_missing"
  | string;

function errorMessage(code: ErrorCode | null, reason: string | null) {
  if (!code) return null;
  switch (code) {
    case "missing_email":
      return "please enter your email.";
    case "send_failed":
      return "couldn't send the link. try again in a moment.";
    case "callback_pkce":
      return "this link only works on the device that requested it. open it on the same phone/laptop, or tap below to send a new one from here.";
    case "callback_otp":
      return "this link looks expired or already used. send a fresh one below.";
    case "callback_missing":
      return "the link was missing its token. send a new one.";
    default:
      return reason ? `something went wrong: ${reason}` : "something went wrong.";
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = params.error ?? null;
  const reason = params.reason ?? null;
  const errMsg = errorMessage(error, reason);

  return (
    <main className="flex flex-1 flex-col justify-center">
      <div className="mb-12">
        <h1 className="serif text-5xl tracking-tight">strik</h1>
        <p className="mt-2 text-muted">show up. tap once. keep the chain.</p>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="serif text-2xl">check your email</p>
          <p className="mt-2 text-sm text-muted">
            we sent you a sign-in link.
          </p>
          <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-xs text-foreground/70">
            important: open the link on <span className="font-medium">this same device</span>.
            magic links don&apos;t work across devices.
          </p>
        </div>
      ) : (
        <form action={signInWithEmail} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-muted"
            >
              email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@somewhere.com"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none transition focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-foreground px-4 py-3 text-base font-medium text-background transition hover:opacity-90 active:scale-[.99]"
          >
            send me a link
          </button>
          {errMsg && (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
              {errMsg}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
