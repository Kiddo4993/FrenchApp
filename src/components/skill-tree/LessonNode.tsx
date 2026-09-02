"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Crown, Lock, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LessonNodeData {
  id: string;
  title: string;
  kind: "lesson" | "review" | "boss";
  status: "locked" | "available" | "in_progress" | "complete";
  crownLevel: number;
}

const KIND_ICON = { lesson: BookOpen, review: RotateCcw, boss: Trophy };

export function LessonNode({ node, offsetPx, index = 0 }: { node: LessonNodeData; offsetPx: number; index?: number }) {
  const Icon = KIND_ICON[node.kind];
  const locked = node.status === "locked";
  const complete = node.status === "complete";
  const isNextUp = node.status === "available";
  const reduceMotion = useReducedMotion();

  const circle = (
    <div className="relative flex size-16 shrink-0 items-center justify-center">
      {/* "Start here" affordance — a soft breathing ring on the next actionable node only. */}
      {isNextUp && !reduceMotion && (
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/40"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center rounded-full border-4 shadow-sm",
          locked && "border-muted bg-muted text-muted-foreground",
          !locked && !complete && "border-primary bg-primary text-primary-foreground",
          complete && node.kind !== "boss" && "border-[var(--chart-3)] bg-[var(--chart-3)] text-white",
          complete && node.kind === "boss" && "border-gold bg-gold text-gold-foreground",
        )}
      >
        {locked ? <Lock className="size-6" aria-hidden /> : <Icon className="size-7" aria-hidden />}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22, delay: index * 0.05 }}
      className="flex flex-col items-center gap-1.5"
      style={{ transform: `translateX(${offsetPx}px)` }}
    >
      {locked ? (
        <div aria-label={`${node.title} (verrouillé)`}>{circle}</div>
      ) : (
        <motion.div whileHover={reduceMotion ? undefined : { scale: 1.08 }} whileTap={reduceMotion ? undefined : { scale: 0.94 }}>
          <Link
            href={`/lecon/${node.id}`}
            aria-label={node.title}
            className="block rounded-full focus-visible:outline-2 focus-visible:outline-ring"
          >
            {circle}
          </Link>
        </motion.div>
      )}
      {node.kind === "lesson" && (
        <div className="flex gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Crown key={i} className={cn("size-2.5", i < node.crownLevel ? "fill-gold text-gold" : "text-border")} />
          ))}
        </div>
      )}
      <p className="fr-text max-w-20 text-center text-xs leading-tight text-muted-foreground">{node.title}</p>
    </motion.div>
  );
}
