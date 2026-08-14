"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TooltipProps } from "recharts";
import { EXERCISE_KIND_LABELS } from "@/lib/dashboard/labels";
import type { KindAccuracy } from "@/server/dashboard-queries";
import { EmptyState } from "./EmptyState";

interface RadarRow {
  kind: string;
  label: string;
  accuracy: number;
  total: number;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as RadarRow;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{row.label}</p>
      {row.total > 0 ? (
        <>
          <p className="flex items-center justify-between gap-4">
            <span>Précision</span>
            <span className="font-medium tabular-nums">{Math.round(row.accuracy)}%</span>
          </p>
          <p className="text-muted-foreground">
            {row.total} exercice{row.total > 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">Pas encore pratiqué</p>
      )}
    </div>
  );
}

export function AccuracyRadarChart({ data }: { data: KindAccuracy[] }) {
  const attempted = data.filter((d) => d.total > 0);
  const unattempted = data.filter((d) => d.total === 0);

  if (attempted.length === 0) {
    return <EmptyState message="Complète des exercices pour voir ta précision par type d'exercice ici." />;
  }

  const chartData: RadarRow[] = data.map((d) => ({
    kind: d.kind,
    label: EXERCISE_KIND_LABELS[d.kind],
    accuracy: d.accuracyPct ?? 0,
    total: d.total,
  }));

  return (
    <div className="flex flex-col gap-2">
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickCount={5}
          />
          <Tooltip content={<ChartTooltip />} />
          <Radar
            name="Précision"
            dataKey="accuracy"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.15}
            dot={{ r: 3, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
      {unattempted.length > 0 && (
        <p className="px-2 text-center text-xs text-muted-foreground">
          Pas encore pratiqué (affiché à 0 %) : {unattempted.map((d) => EXERCISE_KIND_LABELS[d.kind]).join(", ")}
        </p>
      )}
    </div>
  );
}
