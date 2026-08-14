import { AccuracyRadarChart } from "@/components/dashboard/AccuracyRadarChart";
import { GrammarAccuracyPanel } from "@/components/dashboard/GrammarAccuracyPanel";
import { RetentionCurveChart } from "@/components/dashboard/RetentionCurveChart";
import { StudyHeatmap } from "@/components/dashboard/StudyHeatmap";
import { VocabProjectionPanel } from "@/components/dashboard/VocabProjectionPanel";
import { WeakestWordsPanel } from "@/components/dashboard/WeakestWordsPanel";
import { WordsKnownChart } from "@/components/dashboard/WordsKnownChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAccuracyByExerciseKind,
  getRetentionCurve,
  getVocabProjection,
  getWordsKnownByTopic,
} from "@/server/dashboard-queries";
import { getProfileBundle, getSessionLogs, getWeakestCards } from "@/server/queries";

export default async function ProgressPage() {
  const [wordsKnown, retention, accuracyByKind, sessions, weakest, projection, { settings }] = await Promise.all([
    getWordsKnownByTopic(),
    getRetentionCurve(),
    getAccuracyByExerciseKind(),
    getSessionLogs(),
    getWeakestCards(20),
    getVocabProjection(),
    getProfileBundle(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 pb-10">
      <div>
        <h1 className="fr-text text-2xl font-medium">Progrès</h1>
        <p className="text-sm text-muted-foreground">Ton apprentissage en chiffres, calculé à partir de tes données locales.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mots connus par thème et par niveau</CardTitle>
          <CardDescription>
            &laquo; Connu &raquo; = au moins une carte SRS de ce mot a quitté l&apos;état &laquo; nouveau &raquo;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WordsKnownChart data={wordsKnown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courbe de rétention</CardTitle>
          <CardDescription>
            Rétrievabilité FSRS moyenne des cartes en révision, estimée à partir de l&apos;historique réel des
            révisions sur les 30 derniers jours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionCurveChart data={retention} targetRetention={settings?.targetRetention ?? 0.9} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Précision par type d&apos;exercice</CardTitle>
          <CardDescription>Calculée à partir de chaque exercice complété (correct / total), par type.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccuracyRadarChart data={accuracyByKind} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Précision par notion de grammaire</CardTitle>
          <CardDescription>Les exercices de grammaire ne sont pas encore reliés au système de révision (SRS).</CardDescription>
        </CardHeader>
        <CardContent>
          <GrammarAccuracyPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assiduité</CardTitle>
          <CardDescription>Minutes étudiées par jour, sur les 26 dernières semaines.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudyHeatmap sessions={sessions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>20 mots les plus fragiles</CardTitle>
          <CardDescription>Les mots dont la mémorisation est la plus faible en ce moment.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeakestWordsPanel rows={weakest} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulaire projeté</CardTitle>
          <CardDescription>Estimation à 30 / 90 / 365 jours d&apos;après ton rythme récent.</CardDescription>
        </CardHeader>
        <CardContent>
          <VocabProjectionPanel projection={projection} />
        </CardContent>
      </Card>
    </div>
  );
}
