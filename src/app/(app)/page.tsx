import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedUnitRow } from "@/components/skill-tree/LockedUnitRow";
import { UnitSection, type UnitSectionData } from "@/components/skill-tree/UnitSection";
import { getDueCardCount, getProfileBundle, getSkillTree } from "@/server/queries";

export default async function HomePage() {
  const [tree, dueCount, { profile, settings }] = await Promise.all([
    getSkillTree(),
    getDueCardCount(),
    getProfileBundle(),
  ]);

  const sections: (UnitSectionData & { locked: boolean })[] = tree.map(({ unit, progress, lessons, isCracked }) => ({
    id: unit.id,
    slug: unit.slug,
    title: unit.title,
    focus: unit.focus,
    level: unit.levelId,
    status: progress?.status ?? "locked",
    isCracked,
    locked: (progress?.status ?? "locked") === "locked",
    lessons: lessons.map(({ lesson, progress: lp }) => ({
      id: lesson.id,
      title: lesson.title,
      kind: lesson.kind,
      status: lp?.status ?? "locked",
      crownLevel: lp?.crownLevel ?? 0,
    })),
  }));

  const inProgressUnit = sections.find((s) => s.status === "in_progress" || s.status === "available");

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="fr-text text-2xl font-medium">
          {profile?.name ? `Bonjour, ${profile.name}` : "Bonjour"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Objectif du jour : {settings?.dailyGoalXp ?? 50} XP
        </p>
      </div>

      {dueCount > 0 && (
        <Link
          href="/reviser"
          className="mx-auto flex w-full max-w-md items-center justify-between rounded-xl border border-primary/30 bg-accent px-5 py-4 text-accent-foreground transition-colors hover:bg-accent/80"
        >
          <span className="flex items-center gap-3">
            <RotateCcw className="size-5" aria-hidden />
            <span className="font-medium">Réviser — {dueCount} mot{dueCount > 1 ? "s" : ""} à revoir</span>
          </span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      {!inProgressUnit && dueCount === 0 && sections.every((s) => s.locked) && (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-xl border px-6 py-8 text-center">
          <p className="fr-text text-lg">Prêt à commencer ?</p>
          <p className="text-sm text-muted-foreground">
            Passe le test de positionnement pour démarrer au bon niveau, ou lance-toi directement à
            A1.
          </p>
          <Button render={<Link href="/placement" />} nativeButton={false}>Test de positionnement</Button>
        </div>
      )}

      <div className="flex flex-col gap-4 pb-8">
        {sections.map((section) =>
          section.locked ? (
            <LockedUnitRow key={section.id} level={section.level} title={section.title} />
          ) : (
            <UnitSection key={section.id} unit={section} defaultOpen={section === inProgressUnit} />
          ),
        )}
      </div>
    </div>
  );
}
