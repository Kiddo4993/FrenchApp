"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "./CountUp";

/** Small icon/value/label tile used on both the lesson and review results screens. Previously
 * defined identically in each; consolidated after code review flagged the duplication as a risk
 * (a visual tweak had to be applied in two places, and the screens had already begun drifting).
 * `numericValue` (optional) drives a count-up animation on entrance; pass `value` alone for a
 * plain string (e.g. a crown-level display that isn't a counting metric). */
export function StatTile({
  icon: Icon,
  label,
  value,
  numericValue,
  prefix = "",
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  numericValue?: number;
  prefix?: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.15 + index * 0.08 }}
      className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4"
    >
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="text-lg font-semibold">
        {numericValue !== undefined ? <CountUp value={numericValue} prefix={prefix} /> : value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
