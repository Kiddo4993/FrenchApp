import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { AchievementCriteria } from "@/content/achievements";
import type { AchievementStats } from "@/lib/achievements/evaluate";
import { computeAchievementStats } from "@/server/achievement-stats";
import { getAchievementsWithStatus } from "@/server/queries";

const TIER_ORDER = ["bronze", "silver", "gold", "platinum"] as const;
const TIER_LABELS: Record<(typeof TIER_ORDER)[number], string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
};

/** Numeric progress hint for locked achievements with a count-style criteria; null when the
 * criteria is a one-off/boolean condition (nothing meaningful to show a fraction for). */
function progressFor(
  criteria: AchievementCriteria,
  stats: AchievementStats,
): { current: number; target: number } | null {
  switch (criteria.type) {
    case "words_known":
      return { current: stats.wordsKnown, target: criteria.count };
    case "verb_drills":
      return { current: stats.verbDrillsCompleted, target: criteria.count };
    case "perfect_lessons":
      return { current: stats.perfectLessons, target: criteria.count };
    case "streak_days":
      return { current: stats.currentStreak, target: criteria.count };
    case "units_mastered":
      return { current: stats.unitsMastered, target: criteria.count };
    case "reviews_completed":
      return { current: stats.reviewsCompleted, target: criteria.count };
    case "leeches_cleared":
      return { current: stats.leechesCleared, target: criteria.count };
    case "levels_reached":
      return { current: stats.level, target: criteria.level };
    case "speaking_exercises":
      return { current: stats.speakingExercises, target: criteria.count };
    case "dictation_exercises":
      return { current: stats.dictationExercises, target: criteria.count };
    case "register_swaps":
      return { current: stats.registerSwaps, target: criteria.count };
    case "weekend_sessions":
      return { current: stats.consecutiveWeekendSessions, target: criteria.count };
    default:
      return null;
  }
}

export default async function AchievementsPage() {
  const [entries, stats] = await Promise.all([getAchievementsWithStatus(), computeAchievementStats()]);

  const unlockedCount = entries.filter((e) => e.unlockedAt).length;
  const byTier = new Map<string, typeof entries>();
  for (const entry of entries) {
    const arr = byTier.get(entry.achievement.tier) ?? [];
    arr.push(entry);
    byTier.set(entry.achievement.tier, arr);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 pb-16">
      <div>
        <h1 className="fr-text text-2xl font-medium">Mes succès</h1>
        <p className="text-sm text-muted-foreground">
          {unlockedCount} / {entries.length} débloqués
        </p>
      </div>

      {TIER_ORDER.map((tier) => {
        const tierEntries = byTier.get(tier) ?? [];
        if (tierEntries.length === 0) return null;
        return (
          <section key={tier} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {TIER_LABELS[tier]}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tierEntries.map(({ achievement, unlockedAt }) => (
                <AchievementCard
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  tier={achievement.tier}
                  unlockedAt={unlockedAt}
                  progress={unlockedAt ? null : progressFor(achievement.criteria as AchievementCriteria, stats)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
