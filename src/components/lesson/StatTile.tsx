import type { LucideIcon } from "lucide-react";

/** Small icon/value/label tile used on both the lesson and review results screens. Previously
 * defined identically in each; consolidated after code review flagged the duplication as a risk
 * (a visual tweak had to be applied in two places, and the screens had already begun drifting). */
export function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
