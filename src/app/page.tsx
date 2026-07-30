export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="fr-text text-5xl font-medium tracking-tight text-primary">Maîtrise</h1>
      <p className="max-w-md text-muted-foreground">
        Un parcours complet du français, de A1 à C1. L&apos;application est en cours de
        construction — voir <code className="font-mono text-sm">PLAN.md</code> pour l&apos;état
        d&apos;avancement.
      </p>
    </main>
  );
}
