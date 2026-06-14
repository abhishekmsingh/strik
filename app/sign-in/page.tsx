import { signInWithEmail } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = params.error;

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
            we sent you a sign-in link. tap it from this device to come back.
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
          {error && (
            <p className="text-sm text-accent">
              couldn&apos;t send link. try again.
            </p>
          )}
        </form>
      )}
    </main>
  );
}
