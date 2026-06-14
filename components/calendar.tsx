import { calendarMonth, toDateKey, type LogStatus } from "@/lib/streak";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({
  year,
  monthIdx,
  logs,
}: {
  year: number;
  monthIdx: number;
  logs: { log_date: string; status: LogStatus }[];
}) {
  const byDate = new Map(logs.map((l) => [l.log_date, l.status]));
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
          const status = byDate.get(key);
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={[
                "flex aspect-square items-center justify-center rounded-lg text-sm transition",
                !inMonth ? "text-muted/30" : "",
                inMonth && !status ? "text-muted" : "",
                status === "done"
                  ? "bg-accent text-accent-foreground"
                  : "",
                status === "freeze"
                  ? "bg-accent-soft text-accent"
                  : "",
                status === "missed" ? "bg-subtle text-muted line-through" : "",
                isToday && !status
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
