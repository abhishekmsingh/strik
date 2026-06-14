export default function HomeLoading() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mb-10 flex items-baseline justify-between">
        <div>
          <div className="skeleton h-9 w-20 rounded" />
          <div className="skeleton mt-2 h-3 w-24 rounded" />
        </div>
      </header>
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <StreakCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

function StreakCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="mt-6 flex items-baseline gap-3">
        <div className="skeleton h-16 w-20 rounded" />
        <div className="skeleton h-3 w-10 rounded" />
      </div>
      <div className="skeleton mt-6 h-12 w-full rounded-xl" />
    </div>
  );
}
