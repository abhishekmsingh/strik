export default function StreakDetailLoading() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">← home</span>
      </div>

      <div className="mt-8">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="mt-2 flex items-baseline gap-3">
          <div className="skeleton h-20 w-28 rounded" />
          <div className="skeleton h-4 w-12 rounded" />
        </div>
      </div>

      <div className="skeleton mt-8 h-12 w-full rounded-xl" />

      <div className="mt-10 rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="skeleton h-7 w-24 rounded" />
          <div className="skeleton h-3 w-10 rounded" />
        </div>
        <div className="mb-3 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-3 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  );
}
