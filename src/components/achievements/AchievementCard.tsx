import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconForAchievement } from "./icon-map";

const TIER_RING: Record<string, string> = {
  bronze: "ring-[#b08d57]/50",
  silver: "ring-[#9aa4ad]/50",
  gold: "ring-gold/60",
  platinum: "ring-[#8ec5d6]/60",
};

const TIER_ICON_BG: Record<string, string> = {
  bronze: "bg-[#b08d57]/15 text-[#8a6a3d]",
  silver: "bg-[#9aa4ad]/15 text-[#5c6b7a]",
  gold: "bg-gold/15 text-gold-foreground",
  platinum: "bg-[#8ec5d6]/15 text-[#3f7f92]",
};

export function AchievementCard({
  title,
  description,
  icon,
  tier,
  unlockedAt,
  progress,
}: {
  title: string;
  description: string;
  icon: string;
  tier: string;
  unlockedAt: Date | null;
  progress: { current: number; target: number } | null;
}) {
  const Icon = iconForAchievement(icon);
  const unlocked = Boolean(unlockedAt);
  const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-5 text-center ring-1",
        unlocked ? TIER_RING[tier] : "ring-transparent opacity-60",
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          unlocked ? TIER_ICON_BG[tier] : "bg-muted text-muted-foreground",
        )}
      >
        {unlocked ? <Icon className="size-6" aria-hidden /> : <Lock className="size-5" aria-hidden />}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {unlocked && unlockedAt && (
        <p className="text-[0.7rem] text-muted-foreground">
          Débloqué le {unlockedAt.toLocaleDateString("fr-FR")}
        </p>
      )}
      {!unlocked && pct !== null && (
        <div className="mt-1 flex w-full flex-col gap-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[0.7rem] tabular-nums text-muted-foreground">
            {progress!.current} / {progress!.target}
          </p>
        </div>
      )}
    </div>
  );
}
