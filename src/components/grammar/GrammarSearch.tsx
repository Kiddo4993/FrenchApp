"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface GrammarPointListItem {
  slug: string;
  title: string;
  level: string;
  unitTitle: string;
  searchTags: string[];
}

const LEVEL_LABELS: Record<string, string> = {
  A1: "A1 — Débutant",
  A2: "A2 — Élémentaire",
  B1: "B1 — Intermédiaire",
  B2: "B2 — Avancé",
  C1: "C1 — Maîtrise",
};

const LEVEL_SEQUENCE = ["A1", "A2", "B1", "B2", "C1"];

/** Client-side filter over the full grammar reference — title + searchTags, grouped by CEFR level. */
export function GrammarSearch({ points }: { points: GrammarPointListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return points;
    return points.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.unitTitle.toLowerCase().includes(q) ||
        p.searchTags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [points, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, GrammarPointListItem[]>();
    for (const p of filtered) {
      const arr = map.get(p.level) ?? [];
      arr.push(p);
      map.set(p.level, arr);
    }
    return map;
  }, [filtered]);

  const levels = LEVEL_SEQUENCE.filter((level) => grouped.has(level));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (ex. subjonctif, articles, passé composé…)"
          aria-label="Rechercher un point de grammaire"
          className="h-10 pl-9"
        />
      </div>

      {levels.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun résultat pour « {query} ».
        </p>
      )}

      {levels.map((level) => (
        <section key={level} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {LEVEL_LABELS[level] ?? level}
          </h2>
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border">
            {grouped.get(level)!.map((p) => (
              <Link
                key={p.slug}
                href={`/grammaire/${p.slug}`}
                className="flex items-center justify-between gap-3 bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="fr-text truncate text-base font-medium">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.unitTitle}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {level}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
