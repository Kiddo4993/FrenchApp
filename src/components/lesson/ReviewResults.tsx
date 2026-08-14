"use client";

import { motion } from "framer-motion";
import { Flame, PartyPopper, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewSessionSummary } from "@/server/actions";

export function ReviewResults({ summary }: { summary: ReviewSessionSummary }) {
  const isPerfect = summary.totalCount > 0 && summary.correctCount === summary.totalCount;

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
        <h1 className="fr-text text-2xl font-medium">Révision terminée</h1>
        <p className="text-muted-foreground">
          {summary.correctCount} / {summary.totalCount} correctes ({Math.round(summary.accuracy * 100)}%)
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <StatTile icon={Sparkles} label="XP" value={`+${summary.xpEarned}`} />
        <StatTile icon={Flame} label="Streak" value={String(summary.currentStreak)} />
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

      <div className="flex w-full gap-3">
        <Button render={<Link href="/" />} className="flex-1" size="lg">
          Continuer
        </Button>
        <Button render={<Link href="/reviser" />} variant="outline" size="lg">
          Encore
        </Button>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
