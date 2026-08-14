import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getGrammarPointBySlug } from "@/server/grammar-queries";

export default async function GrammarPointPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getGrammarPointBySlug(slug);
  if (!found) notFound();

  const { grammarPoint, unit } = found;
  const explanationParagraphs = grammarPoint.explanationEn.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6 pb-10">
      <div className="flex flex-col gap-3">
        <Link
          href="/grammaire"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Grammaire
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{unit.levelId}</Badge>
          <span className="text-sm text-muted-foreground">{unit.title}</span>
        </div>

        <h1 className="fr-text text-3xl font-medium">{grammarPoint.title}</h1>
      </div>

      <section className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
        {explanationParagraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Exemples
        </h2>
        <ul className="flex flex-col gap-3">
          {grammarPoint.examples.map((ex, i) => (
            <li key={i} className="rounded-xl border bg-card px-4 py-3">
              <p className="fr-text text-lg">{ex.fr}</p>
              <p className="text-sm text-muted-foreground">{ex.en}</p>
              {ex.note && (
                <p className="mt-2 border-l-2 border-primary/40 pl-2.5 text-xs text-primary">
                  {ex.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4" aria-hidden />
          Erreurs fréquentes
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-foreground/90">
          {grammarPoint.commonMistakes.map((mistake, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-destructive" aria-hidden>
                •
              </span>
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
          <Info className="size-4" aria-hidden />
          Pourquoi ça trompe les anglophones
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-foreground/90">
          {grammarPoint.whyItTrips.map((reason, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent-foreground" aria-hidden>
                •
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
