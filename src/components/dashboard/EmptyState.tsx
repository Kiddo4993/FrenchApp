import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EmptyState({
  message,
  icon: Icon = Sparkles,
}: {
  message: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
