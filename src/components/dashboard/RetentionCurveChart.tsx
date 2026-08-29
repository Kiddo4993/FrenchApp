"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { RetentionPoint } from "@/server/dashboard-queries";
import { EmptyState } from "./EmptyState";

// `date` is a UTC calendar-day string (see actions.ts's todayStr()). date-fns's format() reads a
// Date's *local* calendar fields, so `new Date("2026-08-15")` (UTC midnight) can render as "14
// août" for negative-UTC-offset users. Format in UTC explicitly instead.
const frUtcDateShort = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const frUtcDateLong = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as RetentionPoint;
  if (point.meanRetrievability === null) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{frUtcDateLong.format(new Date(point.date))}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: "var(--chart-1)" }} />
          Rétention moyenne
        </span>
        <span className="font-medium tabular-nums">{Math.round(point.meanRetrievability * 100)}%</span>
      </p>
      <p className="text-muted-foreground">{point.sampleSize} carte{point.sampleSize > 1 ? "s" : ""}</p>
    </div>
  );
}

export function RetentionCurveChart({
  data,
  targetRetention,
}: {
  data: RetentionPoint[];
  targetRetention: number;
}) {
  const hasData = data.some((d) => d.meanRetrievability !== null);

  if (!hasData) {
    return (
      <EmptyState message="Fais quelques révisions pour voir ta courbe de rétention se dessiner ici." />
    );
  }

  const chartData = data.map((d) => ({ ...d, pct: d.meanRetrievability !== null ? d.meanRetrievability * 100 : null }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
        <defs>
          <linearGradient id="retentionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => frUtcDateShort.format(new Date(v))}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <ReferenceLine
          y={targetRetention * 100}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{
            value: `Objectif ${Math.round(targetRetention * 100)}%`,
            position: "insideTopRight",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="pct"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#retentionFill)"
          dot={{ r: 3, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
          connectNulls
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
