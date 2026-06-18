import { calendarMonth, toDateKey } from "@/lib/streak";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({
  year,
  monthIdx,
  logs,
  virtuallyFrozenDates,
}: {
  year: number;
  monthIdx: number;
  logs: { log_date: string }[];
  // Past gap days the freeze budget absorbed. Rendered in the soft-lavender
  // style so the user can see where their budget went.
  virtuallyFrozenDates?: Set<string>;
}) {
  const loggedDays = new Set(logs.map((l) => l.log_date));
  const cells = calendarMonth(year, monthIdx);
  const todayKey = toDateKey(new Date());

  return (
    <div>
      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs text-muted">
        {DOW.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map(({ date, inMonth }, i) => {
          const key = toDateKey(date);
          const isLogged = loggedDays.has(key);
          const isVirtualFreeze =
            !isLogged && (virtuallyFrozenDates?.has(key) ?? false);
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={[
                "flex aspect-square items-center justify-center rounded-lg text-sm transition",
                !inMonth ? "text-muted/30" : "",
                inMonth && !isLogged && !isVirtualFreeze ? "text-muted" : "",
                isLogged ? "bg-accent text-accent-foreground" : "",
                isVirtualFreeze ? "bg-accent-soft text-accent" : "",
                isToday && !isLogged && !isVirtualFreeze
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-card"
                  : "",
              ].join(" ")}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
