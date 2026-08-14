import type { VocabProjection } from "@/server/dashboard-queries";

export function VocabProjectionPanel({ projection }: { projection: VocabProjection }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {projection.projections.map(({ days, projected }) => (
          <div key={days} className="rounded-lg border px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">Dans {days} jours</p>
            <p className="text-2xl font-medium tabular-nums">{projected.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted-foreground">mots connus</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Projection simple, non un vrai modèle prédictif : {projection.currentKnown.toLocaleString("fr-FR")} mots
        connus aujourd&apos;hui (sur {projection.totalVocab.toLocaleString("fr-FR")} au programme), extrapolés
        linéairement au rythme observé récemment
        {projection.hasHistory
          ? ` (~${projection.pacePerDay.toFixed(1)} mot(s)/jour, sur les ${projection.historyDays} derniers jours).`
          : " — pas encore assez d'historique de révision pour estimer un rythme, ces chiffres supposent donc 0 mot/jour pour l'instant."}
      </p>
    </div>
  );
}
