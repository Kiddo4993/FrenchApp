import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentRetrievability } from "@/lib/srs";
import type { CardSnapshot } from "@/lib/srs/types";
import type { getWeakestCards } from "@/server/queries";
import { EmptyState } from "./EmptyState";

type WeakestRow = Awaited<ReturnType<typeof getWeakestCards>>[number];

const TRACK_LABEL: Record<string, string> = {
  recognition: "Reconnaissance",
  production: "Production",
  listening: "Écoute",
  spelling: "Orthographe",
};

export function WeakestWordsPanel({ rows, now = new Date() }: { rows: WeakestRow[]; now?: Date }) {
  if (rows.length === 0) {
    return <EmptyState message="Termine quelques leçons pour voir tes mots les plus fragiles ici." />;
  }

  // getWeakestCards() already ranks by live retrievability computed server-side; recompute the
  // same value here purely for display (the percentage badge), not to re-sort — `rows` arrives
  // in the correct order already.
  const ranked = rows
    .filter((r): r is WeakestRow & { vocab: NonNullable<WeakestRow["vocab"]> } => r.vocab !== null)
    .map((r) => ({ ...r, r: currentRetrievability(r.card as CardSnapshot, now) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Les mots les plus susceptibles d&apos;être oubliés en ce moment.</p>
        <Button render={<Link href="/reviser" />} nativeButton={false} size="sm">
          Réviser ces mots
        </Button>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border">
        {ranked.map(({ card, vocab, r }) => (
          <li key={card.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="fr-text truncate font-medium">{vocab.fr}</p>
              <p className="truncate text-xs text-muted-foreground">{vocab.en}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline">{vocab.cefr}</Badge>
              <Badge variant="secondary">{TRACK_LABEL[card.track] ?? card.track}</Badge>
              <span className="w-12 text-right text-xs font-medium tabular-nums text-muted-foreground">
                {Math.round(r * 100)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Pas encore de parcours dédié à cette liste — le bouton ci-dessus t&apos;emmène vers la révision
        générale (mots dus, tous thèmes confondus) en attendant.
      </p>
    </div>
  );
}
