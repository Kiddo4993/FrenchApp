import { BookOpen } from "lucide-react";
import { EmptyState } from "./EmptyState";

/**
 * `cards.grammarPointId` exists in the schema, but no grammar-drill exercise flow writes to it
 * yet (grammar isn't wired into the SRS in this pass — see DECISIONS.md / PLAN.md §6, §9 Phase 8).
 * There is no real per-concept accuracy data to show, so this renders an honest empty state
 * instead of fabricating numbers.
 */
export function GrammarAccuracyPanel() {
  return (
    <EmptyState
      icon={BookOpen}
      message="Pratiquez des exercices de grammaire pour voir vos statistiques ici."
    />
  );
}
