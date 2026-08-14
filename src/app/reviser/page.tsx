import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ReviewRunner } from "@/components/lesson/ReviewRunner";
import { composeReviewSession } from "@/server/review-composer";

// Builds the due/new-card queue fresh from the DB every visit — must never be statically cached.
export const dynamic = "force-dynamic";

export default async function ReviserPage() {
  const { prompts, wordCount } = await composeReviewSession();

  if (prompts.length === 0) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Sparkles className="size-10 text-primary" aria-hidden />
        <p className="fr-text text-xl">Rien à réviser pour le moment !</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Reviens plus tard, ou continue une leçon pour apprendre de nouveaux mots.
        </p>
        <Link href="/" className="text-primary underline underline-offset-4">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <ReviewRunner initialPrompts={prompts} />
      <p className="sr-only">{wordCount} mots à réviser</p>
    </div>
  );
}
