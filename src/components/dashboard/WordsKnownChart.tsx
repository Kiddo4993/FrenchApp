"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { CEFR_COLORS, CEFR_LEVELS } from "@/lib/dashboard/labels";
import type { WordsKnownByTopic } from "@/server/dashboard-queries";
import { EmptyState } from "./EmptyState";

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (typeof p.value === "number" ? p.value : 0), 0);
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {[...payload]
        .reverse()
        .filter((p) => typeof p.value === "number" && p.value > 0)
        .map((p) => (
          <p key={p.dataKey as string} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
              {p.dataKey}
            </span>
            <span className="font-medium tabular-nums">{p.value}</span>
          </p>
        ))}
      <p className="mt-1 border-t pt-1 font-medium tabular-nums">Total : {total}</p>
    </div>
  );
}

export function WordsKnownChart({ data }: { data: WordsKnownByTopic[] }) {
  const totalKnown = data.reduce((sum, d) => sum + d.total, 0);

  if (totalKnown === 0) {
    return (
      <EmptyState message="Termine quelques leçons pour voir tes mots connus apparaître ici, par thème et par niveau." />
    );
  }

  const width = Math.max(720, data.length * 52);

  return (
    <div className="overflow-x-auto">
      <div style={{ width }}>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 88 }} barCategoryGap={6}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              angle={-55}
              textAnchor="end"
              interval={0}
              height={100}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Legend
              verticalAlign="top"
              height={28}
              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
            />
            {CEFR_LEVELS.map((level, i) => (
              <Bar
                key={level}
                dataKey={level}
                stackId="level"
                name={level}
                fill={CEFR_COLORS[level]}
                stroke="var(--card)"
                strokeWidth={2}
                maxBarSize={24}
                radius={i === CEFR_LEVELS.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
