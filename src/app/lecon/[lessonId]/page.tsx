import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonRunner } from "@/components/lesson/LessonRunner";
import { composeLessonSession } from "@/server/lesson-composer";
import { getLessonProgress } from "@/server/queries";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const progress = await getLessonProgress(lessonId);
  const composition = await composeLessonSession(lessonId, progress?.crownLevel ?? 0);

  if (!composition) notFound();

  if (composition.prompts.length === 0) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="fr-text text-xl">Cette leçon n&apos;a pas encore de contenu.</p>
        <Link href="/" className="text-primary underline underline-offset-4">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <LessonRunner
        lessonId={lessonId}
        crownLevelAttempted={composition.crownLevelAttempted}
        initialPrompts={composition.prompts}
      />
    </div>
  );
}
