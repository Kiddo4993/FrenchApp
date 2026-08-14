"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { EmptyState } from "./EmptyState";

export interface SessionLogRow {
  date: string;
  minutesStudied: number;
  exercisesCompleted: number;
}

const WEEKS = 26;
const CELL = 13;
const GAP = 3;
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function bucketFor(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

const BUCKET_BG: Record<number, string> = {
  0: "color-mix(in oklch, var(--muted-foreground) 12%, transparent)",
  1: "color-mix(in oklch, var(--chart-1) 25%, var(--card))",
  2: "color-mix(in oklch, var(--chart-1) 50%, var(--card))",
  3: "color-mix(in oklch, var(--chart-1) 75%, var(--card))",
  4: "var(--chart-1)",
};

export function StudyHeatmap({ sessions }: { sessions: SessionLogRow[] }) {
  const byDate = useMemo(() => new Map(sessions.map((s) => [s.date, s])), [sessions]);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutesStudied, 0);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const gridStart = addDays(currentWeekStart, -7 * (WEEKS - 1));
    const weeksArr: Date[][] = [];
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const weekStart = addDays(gridStart, w * 7);
      const days = Array.from({ length: 7 }, (_, d) => addDays(weekStart, d));
      weeksArr.push(days);
      const month = weekStart.getMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex: w, label: format(weekStart, "MMM", { locale: fr }) });
        lastMonth = month;
      }
    }
    return { weeks: weeksArr, monthLabels: labels };
  }, []);

  if (sessions.length === 0) {
    return <EmptyState message="Commence à étudier pour remplir ton calendrier d'assiduité." />;
  }

  const today = new Date();
  const labelColWidth = 20;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {Math.round(totalMinutes)} minute{totalMinutes >= 2 ? "s" : ""} étudiées sur les {WEEKS} dernières semaines
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1" style={{ minWidth: labelColWidth + WEEKS * (CELL + GAP) }}>
          <div className="relative h-3.5" style={{ marginLeft: labelColWidth }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={weekIndex}
                className="absolute text-[10px] capitalize text-muted-foreground"
                style={{ left: weekIndex * (CELL + GAP) }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex" style={{ gap: GAP }}>
            <div className="flex flex-col shrink-0" style={{ width: labelColWidth, gap: GAP }}>
              {DAY_LABELS.map((d, i) => (
                <span key={i} className="text-[9px] leading-none text-muted-foreground" style={{ height: CELL }}>
                  {i % 2 === 1 ? d : ""}
                </span>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col shrink-0" style={{ gap: GAP }}>
                {week.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const isFuture = day.getTime() > today.getTime();
                  const session = byDate.get(key);
                  const minutes = session?.minutesStudied ?? 0;
                  const bucket = isFuture ? null : bucketFor(minutes);
                  const dateLabel = format(day, "d MMMM yyyy", { locale: fr });
                  const detail = isFuture
                    ? dateLabel
                    : minutes > 0
                      ? `${dateLabel} — ${Math.round(minutes)} min, ${session?.exercisesCompleted ?? 0} exercice${(session?.exercisesCompleted ?? 0) > 1 ? "s" : ""}`
                      : `${dateLabel} — aucune session`;
                  return (
                    <div
                      key={key}
                      role="img"
                      aria-label={detail}
                      title={detail}
                      tabIndex={isFuture ? -1 : 0}
                      className="rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        width: CELL,
                        height: CELL,
                        background: isFuture ? "transparent" : BUCKET_BG[bucket ?? 0],
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Moins</span>
        {[0, 1, 2, 3, 4].map((b) => (
          <span key={b} className="rounded-[3px]" style={{ width: CELL, height: CELL, background: BUCKET_BG[b] }} />
        ))}
        <span>Plus</span>
      </div>
    </div>
  );
}
