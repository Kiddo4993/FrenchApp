"use client";

import { motion } from "framer-motion";
import { Award, Crown, Flame, PartyPopper, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LessonSessionSummary } from "@/server/actions";
import { StatTile } from "./StatTile";

export function LessonResults({ summary, lessonId }: { summary: LessonSessionSummary; lessonId: string }) {
  const isPerfect = summary.correctCount === summary.totalCount;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.35 }}
        className={cn(
          "flex size-24 items-center justify-center rounded-full",
          isPerfect ? "bg-gold text-gold-foreground" : "bg-[var(--chart-3)] text-white",
        )}
      >
        {isPerfect ? <PartyPopper className="size-11" aria-hidden /> : <Star className="size-11" aria-hidden />}
      </motion.div>

      <div>
        <h1 className="fr-text text-2xl font-medium">
          {isPerfect ? "Leçon parfaite !" : "Leçon terminée"}
        </h1>
        <p className="text-muted-foreground">
          {summary.correctCount} / {summary.totalCount} correctes ({Math.round(summary.accuracy * 100)}%)
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        <StatTile icon={Sparkles} label="XP" value={`+${summary.xpEarned}`} />
        <StatTile icon={Flame} label="Streak" value={String(summary.currentStreak)} />
        <StatTile icon={Crown} label="Couronne" value={String(summary.crownLevel)} />
      </div>

      {summary.leveledUp && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full rounded-xl border border-primary/30 bg-accent px-4 py-3 text-accent-foreground"
        >
          <p className="font-medium">Niveau {summary.newLevel} atteint !</p>
        </motion.div>
      )}

      {summary.unitUnlocked && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full rounded-xl border border-gold/40 bg-[color-mix(in_oklch,var(--gold),transparent_92%)] px-4 py-3"
        >
          <p className="font-medium text-gold-foreground">Nouvelle unité débloquée !</p>
        </motion.div>
      )}

      {summary.newlyUnlockedAchievements.length > 0 && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex w-full flex-col gap-2"
        >
          {summary.newlyUnlockedAchievements.map((a) => (
            <div key={a.slug} className="flex items-center gap-3 rounded-xl border border-gold/40 bg-background px-4 py-3 text-left">
              <Award className="size-6 shrink-0 text-gold" aria-hidden />
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="flex w-full gap-3">
        <Button render={<Link href="/" />} nativeButton={false} className="flex-1" size="lg">
          Continuer
        </Button>
        <Button render={<Link href={`/lecon/${lessonId}`} />} nativeButton={false} variant="outline" size="lg">
          Refaire
        </Button>
      </div>
    </div>
  );
}
