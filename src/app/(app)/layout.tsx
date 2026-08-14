import { AppShell } from "@/components/nav/AppShell";
import { xpProgress } from "@/lib/progression/xp";
import { ensureBootstrapProgress } from "@/server/actions";
import { getDueCardCount, getProfileBundle } from "@/server/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureBootstrapProgress();
  const [{ userStats, settings }, dueCount] = await Promise.all([getProfileBundle(), getDueCardCount()]);

  const progress = xpProgress(userStats?.totalXp ?? 0);

  return (
    <AppShell
      header={{
        level: progress.level,
        xpIntoLevel: progress.xpIntoLevel,
        xpNeededForLevel: progress.xpNeededForLevel,
        currentStreak: userStats?.currentStreak ?? 0,
        dueCount,
        reducedMotion: settings?.reducedMotion ?? false,
      }}
    >
      {children}
    </AppShell>
  );
}
