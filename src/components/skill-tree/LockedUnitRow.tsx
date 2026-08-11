import { Lock } from "lucide-react";

export function LockedUnitRow({ level, title }: { level: string; title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-dashed px-6 py-4 text-muted-foreground">
      <Lock className="size-5 shrink-0" aria-hidden />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide">{level}</p>
        <p className="fr-text text-sm">{title}</p>
      </div>
    </div>
  );
}
