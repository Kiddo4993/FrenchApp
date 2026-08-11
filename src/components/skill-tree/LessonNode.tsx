"use client";

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

export function LessonNode({ node, offsetPx }: { node: LessonNodeData; offsetPx: number }) {
  const Icon = KIND_ICON[node.kind];
  const locked = node.status === "locked";
  const complete = node.status === "complete";

  const circle = (
    <div
      className={cn(
        "flex size-16 shrink-0 items-center justify-center rounded-full border-4 shadow-sm transition-transform",
        locked && "border-muted bg-muted text-muted-foreground",
        !locked && !complete && "border-primary bg-primary text-primary-foreground hover:scale-105",
        complete && node.kind !== "boss" && "border-[var(--chart-3)] bg-[var(--chart-3)] text-white hover:scale-105",
        complete && node.kind === "boss" && "border-gold bg-gold text-gold-foreground hover:scale-105",
      )}
    >
      {locked ? <Lock className="size-6" aria-hidden /> : <Icon className="size-7" aria-hidden />}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ transform: `translateX(${offsetPx}px)` }}>
      {locked ? (
        <div aria-label={`${node.title} (verrouillé)`}>{circle}</div>
      ) : (
        <Link href={`/lecon/${node.id}`} aria-label={node.title} className="focus-visible:outline-2 focus-visible:outline-ring rounded-full">
          {circle}
        </Link>
      )}
      {node.kind === "lesson" && (
        <div className="flex gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Crown key={i} className={cn("size-2.5", i < node.crownLevel ? "fill-gold text-gold" : "text-border")} />
          ))}
        </div>
      )}
      <p className="fr-text max-w-20 text-center text-xs leading-tight text-muted-foreground">{node.title}</p>
    </div>
  );
}
