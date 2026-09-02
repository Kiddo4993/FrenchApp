"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, PartyPopper, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewSessionSummary } from "@/server/actions";
import { StatTile } from "./StatTile";

export function ReviewResults({ summary }: { summary: ReviewSessionSummary }) {
  const isPerfect = summary.totalCount > 0 && summary.correctCount === summary.totalCount;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center"
    >
      <div className="relative flex items-center justify-center">
        {isPerfect && !reduceMotion && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
            className="absolute inset-0 rounded-full bg-gold"
            aria-hidden
          />
        )}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={cn(
            "relative flex size-24 items-center justify-center rounded-full",
            isPerfect ? "bg-gold text-gold-foreground" : "bg-[var(--chart-3)] text-white",
          )}
        >
          {isPerfect ? <PartyPopper className="size-11" aria-hidden /> : <Star className="size-11" aria-hidden />}
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h1 className="fr-text text-2xl font-medium">Révision terminée</h1>
        <p className="text-muted-foreground">
          {summary.correctCount} / {summary.totalCount} correctes ({Math.round(summary.accuracy * 100)}%)
        </p>
      </motion.div>

      <div className="grid w-full grid-cols-2 gap-3">
        <StatTile icon={Sparkles} label="XP" value={`+${summary.xpEarned}`} numericValue={summary.xpEarned} prefix="+" index={0} />
        <StatTile icon={Flame} label="Streak" value={String(summary.currentStreak)} numericValue={summary.currentStreak} index={1} />
      </div>

      {summary.leveledUp && (
        <motion.div
          initial={{ y: 10, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.4 }}
          className="w-full rounded-xl border border-primary/30 bg-accent px-4 py-3 text-accent-foreground"
        >
          <p className="font-medium">Niveau {summary.newLevel} atteint !</p>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex w-full gap-3"
      >
        <Button render={<Link href="/" />} nativeButton={false} className="flex-1" size="lg">
          Continuer
        </Button>
        <Button render={<Link href="/reviser" />} nativeButton={false} variant="outline" size="lg">
          Encore
        </Button>
      </motion.div>
    </motion.div>
  );
}
