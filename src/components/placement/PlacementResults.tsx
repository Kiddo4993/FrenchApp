"use client";

import { motion } from "framer-motion";
import { Compass, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Cefr } from "@/lib/placement/adaptive";

export function PlacementResults({
  correctCount,
  totalCount,
  finalLevel,
  recommendedUnitTitle,
  saveFailed,
}: {
  correctCount: number;
  totalCount: number;
  finalLevel: Cefr;
  recommendedUnitTitle: string;
  saveFailed: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.35 }}
        className="flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Compass className="size-11" aria-hidden />
      </motion.div>

      <div>
        <h1 className="fr-text text-2xl font-medium">Test terminé !</h1>
        <p className="text-muted-foreground">
          {correctCount} / {totalCount} réponses correctes
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 rounded-xl border border-primary/30 bg-accent px-5 py-4 text-left text-accent-foreground">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
          <Target className="size-4" aria-hidden />
          Niveau estimé : {finalLevel}
        </p>
        <p className="fr-text text-lg">{recommendedUnitTitle}</p>
        <p className="text-sm opacity-80">C&apos;est ici que ton parcours va commencer.</p>
      </div>

      {saveFailed && (
        <p className="text-sm text-destructive">
          Le résultat n&apos;a pas pu être enregistré. Réessaie depuis l&apos;accueil.
        </p>
      )}

      <Button render={<Link href="/" />} className="w-full" size="lg">
        Continuer
      </Button>
    </div>
  );
}
