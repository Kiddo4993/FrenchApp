import { GrammarSearch, type GrammarPointListItem } from "@/components/grammar/GrammarSearch";
import { getAllGrammarPointsWithUnits } from "@/server/grammar-queries";

const CEFR_ORDER: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };

/**
 * Full searchable grammar reference — every grammar point across all 44 units, grouped by CEFR
 * level. Reachable and useful regardless of the learner's unlocked progress; not gated by
 * unit_progress.
 */
export default async function GrammairePage() {
  const rows = await getAllGrammarPointsWithUnits();

  const points: GrammarPointListItem[] = rows
    .map(({ grammarPoint, unit }) => ({
      slug: grammarPoint.slug,
      title: grammarPoint.title,
      level: unit.levelId,
      unitTitle: unit.title,
      unitOrder: unit.order,
      searchTags: grammarPoint.searchTags,
    }))
    .sort((a, b) => {
      const levelDiff = (CEFR_ORDER[a.level] ?? 0) - (CEFR_ORDER[b.level] ?? 0);
      if (levelDiff !== 0) return levelDiff;
      const unitDiff = a.unitOrder - b.unitOrder;
      if (unitDiff !== 0) return unitDiff;
      return a.title.localeCompare(b.title, "fr");
    });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 pb-10">
      <div>
        <h1 className="fr-text text-2xl font-medium">Grammaire</h1>
        <p className="text-sm text-muted-foreground">
          Référence complète — {points.length} point{points.length > 1 ? "s" : ""} de grammaire, de
          A1 à C1
        </p>
      </div>

      <GrammarSearch points={points} />
    </div>
  );
}
