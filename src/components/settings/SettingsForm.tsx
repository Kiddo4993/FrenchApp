"use client";

import { Flame, Snowflake } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DAILY_GOAL_PRESETS } from "@/lib/progression/xp";
import { repairStreakAction, updateSettings } from "@/server/actions";

export interface SettingsData {
  dailyGoalXp: number;
  heartsEnabled: boolean;
  targetRetention: number;
  newCardsPerDay: number;
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
}

const GOAL_PRESETS: { key: string; label: string; value: number }[] = [
  { key: "casual", label: "Casual", value: DAILY_GOAL_PRESETS.casual },
  { key: "regular", label: "Regular", value: DAILY_GOAL_PRESETS.regular },
  { key: "serious", label: "Serious", value: DAILY_GOAL_PRESETS.serious },
  { key: "intense", label: "Intense", value: DAILY_GOAL_PRESETS.intense },
];

const NEW_CARDS_OPTIONS = [5, 10, 15, 20, 25, 30];

export function SettingsForm({
  settings,
  currentStreak,
  freezesAvailable,
  canRepair,
}: {
  settings: SettingsData;
  currentStreak: number;
  freezesAvailable: number;
  canRepair: boolean;
}) {
  const router = useRouter();
  const { theme: liveTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [local, setLocal] = useState(settings);
  const [repairing, setRepairing] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setLocal(settings), [settings]);

  async function persist(partial: Partial<SettingsData>, successMsg: string) {
    setLocal((prev) => ({ ...prev, ...partial }));
    try {
      await updateSettings(partial);
      toast.success(successMsg);
      router.refresh();
    } catch {
      toast.error("Impossible d'enregistrer ce réglage.");
      router.refresh();
    }
  }

  async function handleRepair() {
    setRepairing(true);
    try {
      await repairStreakAction();
      toast.success("Streak réparé !");
      router.refresh();
    } catch {
      toast.error("Impossible de réparer le streak.");
    } finally {
      setRepairing(false);
    }
  }

  const displayedTheme = mounted ? (liveTheme as SettingsData["theme"] | undefined) ?? local.theme : local.theme;

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Daily goal */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Objectif quotidien</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GOAL_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant={local.dailyGoalXp === preset.value ? "default" : "outline"}
              className="flex-col gap-0.5 py-3 h-auto"
              onClick={() => persist({ dailyGoalXp: preset.value }, "Objectif mis à jour.")}
              aria-pressed={local.dailyGoalXp === preset.value}
            >
              <span className="text-sm font-medium">{preset.label}</span>
              <span className="text-xs opacity-80">{preset.value} XP</span>
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Hearts */}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Énergie (cœurs)</h2>
          <p className="text-sm text-muted-foreground">
            Limite le nombre d&apos;erreurs autorisées par session. Désactivé par défaut.
          </p>
        </div>
        <Switch
          checked={local.heartsEnabled}
          onCheckedChange={(checked) => persist({ heartsEnabled: checked }, checked ? "Énergie activée." : "Énergie désactivée.")}
          aria-label="Activer l'énergie (cœurs)"
        />
      </section>

      <Separator />

      {/* Target retention */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Rétention cible</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {Math.round(local.targetRetention * 100)}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Plus la valeur est élevée, plus les révisions reviennent souvent.
        </p>
        <input
          type="range"
          min={0.7}
          max={0.97}
          step={0.01}
          value={local.targetRetention}
          onChange={(e) => setLocal((prev) => ({ ...prev, targetRetention: Number(e.target.value) }))}
          onPointerUp={(e) =>
            persist({ targetRetention: Number((e.target as HTMLInputElement).value) }, "Rétention cible mise à jour.")
          }
          className="h-2 w-full cursor-pointer rounded-full accent-primary"
          style={{ accentColor: "var(--primary)" }}
          aria-label="Rétention cible"
        />
      </section>

      <Separator />

      {/* New cards per day */}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Nouveaux mots par jour</h2>
          <p className="text-sm text-muted-foreground">Nombre de nouvelles cartes introduites chaque jour.</p>
        </div>
        <Select
          value={String(local.newCardsPerDay)}
          onValueChange={(value) => persist({ newCardsPerDay: Number(value) }, "Nouveaux mots par jour mis à jour.")}
        >
          <SelectTrigger aria-label="Nouveaux mots par jour">
            <SelectValue>{(value: string) => value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {NEW_CARDS_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <Separator />

      {/* Theme */}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Thème</h2>
          <p className="text-sm text-muted-foreground">Clair, sombre, ou selon le système.</p>
        </div>
        <Select
          value={displayedTheme ?? "system"}
          onValueChange={(value) => {
            const next = value as SettingsData["theme"];
            setTheme(next);
            persist({ theme: next }, "Thème mis à jour.");
          }}
        >
          <SelectTrigger aria-label="Thème">
            <SelectValue>
              {(value: string) => (value === "light" ? "Clair" : value === "dark" ? "Sombre" : "Système")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Clair</SelectItem>
            <SelectItem value="dark">Sombre</SelectItem>
            <SelectItem value="system">Système</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <Separator />

      {/* Reduced motion */}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Réduire les animations</h2>
          <p className="text-sm text-muted-foreground">
            Diminue les mouvements et transitions dans toute l&apos;application.
          </p>
        </div>
        <Switch
          checked={local.reducedMotion}
          onCheckedChange={(checked) =>
            persist({ reducedMotion: checked }, checked ? "Animations réduites." : "Animations rétablies.")
          }
          aria-label="Réduire les animations"
        />
      </section>

      <Separator />

      {/* Streak */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Streak</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4">
            <Flame className="size-5 text-orange-500" aria-hidden />
            <p className="text-lg font-semibold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Jours d&apos;affilée</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4">
            <Snowflake className="size-5 text-[var(--chart-1)]" aria-hidden />
            <p className="text-lg font-semibold">{freezesAvailable} / 2</p>
            <p className="text-xs text-muted-foreground">Gels disponibles</p>
          </div>
        </div>
        {canRepair && (
          <Button type="button" variant="outline" onClick={handleRepair} disabled={repairing}>
            {repairing ? "Réparation…" : "Réparer mon streak"}
          </Button>
        )}
      </section>

      <Separator />

      <section>
        <Button render={<Link href="/succes" />} nativeButton={false} variant="secondary" className="w-full">
          Voir mes succès
        </Button>
      </section>
    </div>
  );
}
