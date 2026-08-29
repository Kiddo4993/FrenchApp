"use client";

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
const MS_PER_DAY = 86_400_000;

// sessionLogs.date is a UTC calendar-day string (see actions.ts's todayStr()). date-fns's
// startOfWeek/addDays/format all read a Date's *local* calendar fields, so building/labeling the
// grid with them silently reinterprets each UTC day boundary in the browser's timezone — a
// session just before/after local midnight can render on the wrong day, or as "future" and be
// hidden entirely, for any non-UTC user. Do all grid math and labeling in UTC instead. Caught by
// code review; not exercised by any test since it only shows up off-UTC.
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
const frUtcDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const frUtcMonth = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

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
    const today = utcMidnight(new Date());
    const mondayOffset = (today.getUTCDay() + 6) % 7; // 0 = today is already Monday
    const currentWeekStart = addUtcDays(today, -mondayOffset);
    const gridStart = addUtcDays(currentWeekStart, -7 * (WEEKS - 1));
    const weeksArr: Date[][] = [];
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const weekStart = addUtcDays(gridStart, w * 7);
      const days = Array.from({ length: 7 }, (_, d) => addUtcDays(weekStart, d));
      weeksArr.push(days);
      const month = weekStart.getUTCMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex: w, label: frUtcMonth.format(weekStart) });
        lastMonth = month;
      }
    }
    return { weeks: weeksArr, monthLabels: labels };
  }, []);

  if (sessions.length === 0) {
    return <EmptyState message="Commence à étudier pour remplir ton calendrier d'assiduité." />;
  }

  const today = utcMidnight(new Date());
  const labelColWidth = 20;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {Math.round(totalMinutes)} minute{Math.round(totalMinutes) >= 2 ? "s" : ""} étudiées sur les {WEEKS} dernières semaines
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
                  const key = isoDate(day);
                  const isFuture = day.getTime() > today.getTime();
                  const session = byDate.get(key);
                  const minutes = session?.minutesStudied ?? 0;
                  const bucket = isFuture ? null : bucketFor(minutes);
                  const dateLabel = frUtcDate.format(day);
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
