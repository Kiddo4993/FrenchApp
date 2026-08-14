import { SettingsForm } from "@/components/settings/SettingsForm";
import { canRepairStreak } from "@/lib/progression/streaks";
import { getProfileBundle } from "@/server/queries";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function SettingsPage() {
  const { settings, userStats } = await getProfileBundle();

  const canRepair = userStats
    ? canRepairStreak(
        {
          currentStreak: userStats.currentStreak,
          longestStreak: userStats.longestStreak,
          freezesAvailable: userStats.freezesAvailable,
          lastActiveDate: userStats.lastActiveDate,
          weekendAmuletActive: userStats.weekendAmuletActive,
        },
        todayStr(),
      )
    : false;

  if (!settings) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-muted-foreground">
        Réglages indisponibles.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 pb-16">
      <div>
        <h1 className="fr-text text-2xl font-medium">Réglages</h1>
        <p className="text-sm text-muted-foreground">Personnalise ton expérience d&apos;apprentissage.</p>
      </div>
      <SettingsForm
        settings={{
          dailyGoalXp: settings.dailyGoalXp,
          heartsEnabled: settings.heartsEnabled,
          targetRetention: settings.targetRetention,
          newCardsPerDay: settings.newCardsPerDay,
          theme: settings.theme,
          reducedMotion: settings.reducedMotion,
        }}
        currentStreak={userStats?.currentStreak ?? 0}
        freezesAvailable={userStats?.freezesAvailable ?? 0}
        canRepair={canRepair}
      />
    </div>
  );
}
