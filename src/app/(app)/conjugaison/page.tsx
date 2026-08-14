import { ConjugationTrainer } from "@/components/conjugaison/ConjugationTrainer";
import type { TrainerVerb } from "@/components/conjugaison/types";
import { getAllVerbsWithConjugations } from "@/server/grammar-queries";

/**
 * Conjugation trainer: verb+tense picker with a timed practice drill, plus a full 8×6 reference
 * grid per verb. All ~120 verbs' conjugations are preloaded here (2 bulk DB queries) so the rest
 * of the page is fully client-interactive with no further server round trips. Practice-only —
 * results aren't persisted to the SRS (distinct from the conjugation_drill exercise kind inside
 * real lessons, which is card-backed).
 */
export default async function ConjugaisonPage() {
  const rows = await getAllVerbsWithConjugations();

  const verbs: TrainerVerb[] = rows.map(({ verb, conjugations }) => ({
    infinitive: verb.infinitive,
    group: verb.group,
    auxiliary: verb.auxiliary,
    frequencyRank: verb.frequencyRank,
    rows: conjugations.map((c) => ({ tense: c.tense, person: c.person, form: c.form })),
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pb-10">
      <div>
        <h1 className="fr-text text-2xl font-medium">Conjugaison</h1>
        <p className="text-sm text-muted-foreground">
          Entraîne-toi sur {verbs.length} verbes, tous les temps, toutes les personnes.
        </p>
      </div>

      {verbs.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun verbe n&apos;est encore chargé —{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run seed</code> pour charger le
          contenu.
        </p>
      ) : (
        <ConjugationTrainer verbs={verbs} />
      )}
    </div>
  );
}
