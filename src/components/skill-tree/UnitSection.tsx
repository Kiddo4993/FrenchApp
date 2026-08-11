"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonNode, type LessonNodeData } from "./LessonNode";

export interface UnitSectionData {
  id: string;
  slug: string;
  title: string;
  focus: string;
  level: string;
  status: "locked" | "available" | "in_progress" | "complete" | "gold" | "cracked";
  isCracked: boolean;
  lessons: LessonNodeData[];
}

const OFFSETS = [0, 44, 0, -44];

export function UnitSection({ unit, defaultOpen }: { unit: UnitSectionData; defaultOpen: boolean }) {
  const locked = unit.status === "locked";
  const mastered = unit.status === "gold";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border px-6 py-8",
        locked && "opacity-60",
        mastered && !unit.isCracked && "border-gold/50 bg-[color-mix(in_oklch,var(--gold),transparent_95%)]",
        unit.isCracked && "border-gold/30 bg-[color-mix(in_oklch,var(--gold),transparent_97%)]",
      )}
      aria-expanded={defaultOpen}
    >
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{unit.level}</p>
          <h2 className="fr-text text-xl font-medium">{unit.title}</h2>
          <p className="text-sm text-muted-foreground">{unit.focus}</p>
        </div>
        {mastered && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              unit.isCracked ? "bg-gold/20 text-gold-foreground" : "bg-gold text-gold-foreground",
            )}
            title={unit.isCracked ? "La mémorisation faiblit — une révision est recommandée" : "Unité maîtrisée"}
          >
            <Sparkles className="size-3.5" aria-hidden />
            {unit.isCracked ? "Fissurée" : "En or"}
          </span>
        )}
      </header>

      <div className="flex flex-col items-center gap-6">
        {unit.lessons.map((lesson, i) => (
          <LessonNode key={lesson.id} node={lesson} offsetPx={OFFSETS[i % OFFSETS.length]} />
        ))}
      </div>
    </motion.section>
  );
}
