export default function JoinLoading() {
  return (
    <main className="flex flex-1 flex-col justify-center">
      <div className="skeleton h-3 w-40 rounded" />
      <div className="skeleton mt-3 h-9 w-56 rounded" />
      <div className="skeleton mt-6 h-3 w-full rounded" />
      <div className="skeleton mt-2 h-3 w-2/3 rounded" />
      <div className="skeleton mt-10 h-12 w-full rounded-xl" />
    </main>
  );
}
