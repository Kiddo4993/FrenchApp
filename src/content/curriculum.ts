import type { TopicSlug } from "./topics";

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1";

export interface UnitDef {
  slug: string;
  level: Cefr;
  order: number;
  title: string;
  /** Grammar/skill focus shown on the unit's grammar lesson page. */
  focus: string;
  topics: TopicSlug[];
}

export interface LessonDef {
  slug: string;
  unitSlug: string;
  order: number;
  kind: "lesson" | "review" | "boss";
  title: string;
  skillFocus: string[];
  topicSlug: TopicSlug | null;
}

const LEVEL_ORDER: Record<Cefr, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };

/** PLAN.md §2 — 44 units across A1→C1. */
export const UNITS: UnitDef[] = [
  // A1 — Débutant
  u("A1", 1, "premiers-pas", "Premiers pas", "Salutations, se présenter, alphabet, être (présent)", ["salutations"]),
  u("A1", 2, "qui-etes-vous", "Qui êtes-vous ?", "Famille, pronoms sujets, avoir (présent)", ["famille"]),
  u("A1", 3, "nombres-dates-heure", "Nombres, dates et heure", "Chiffres 0–100, jours, mois, l'heure", ["nombres-temps"]),
  u("A1", 4, "couleurs-descriptions", "Couleurs et descriptions", "Couleurs, formes, accord des adjectifs, articles", ["couleurs-formes"]),
  u("A1", 5, "a-table", "À table", "Nourriture, boissons, articles partitifs, verbes -er", ["nourriture-boissons", "restaurant"]),
  u("A1", 6, "chez-moi", "Chez moi", "La maison, meubles, prépositions de lieu, il y a", ["maison"]),
  u("A1", 7, "ma-journee", "Ma journée", "Routine quotidienne, verbes pronominaux (intro), présent régulier", ["routine-quotidienne"]),
  u("A1", 8, "a-lecole", "À l'école", "Matières scolaires, verbes -ir réguliers, questions", ["ecole-education"]),
  u("A1", 9, "les-courses", "Les courses", "Argent, nombres 70–1000, adjectifs démonstratifs", ["shopping-argent"]),
  u("A1", 10, "en-ville", "En ville", "Transports, directions, aller + destination, impératif", ["transport-directions", "ville-batiments"]),

  // A2 — Élémentaire
  u("A2", 1, "hier", "Hier", "Passé composé (avoir)", ["routine-quotidienne"]),
  u("A2", 2, "cetait-comment", "C'était comment ?", "Passé composé (être), verbes pronominaux au passé", ["famille"]),
  u("A2", 3, "autrefois", "Autrefois", "Imparfait", ["loisirs"]),
  u("A2", 4, "bientot", "Bientôt", "Futur proche, projets", ["telephone-communication"]),
  u("A2", 5, "corps-et-sante", "Le corps et la santé", "Corps, chez le médecin, pronoms COD", ["corps-sante"]),
  u("A2", 6, "vetements-et-mode", "Vêtements et mode", "Habillement, pronoms COI", ["vetements-mode"]),
  u("A2", 7, "voyages-et-vacances", "Voyages et vacances", "Voyages, comparatifs", ["voyages-vacances"]),
  u("A2", 8, "le-travail", "Le travail", "Métiers, superlatifs", ["travail-metiers"]),
  u("A2", 9, "meteo-et-saisons", "Météo et saisons", "Météo, saisons, pronoms y et en", ["meteo-saisons"]),
  u("A2", 10, "nature-et-animaux", "Nature et animaux", "Faune/flore, révision + boss renforcé", ["nature-animaux"]),

  // B1 — Intermédiaire
  u("B1", 1, "lavenir", "L'avenir", "Futur simple", ["science-innovation"]),
  u("B1", 2, "si-javais", "Si j'avais...", "Conditionnel présent", ["loisirs"]),
  u("B1", 3, "il-faut-que", "Il faut que", "Subjonctif présent (introduction)", ["ecole-education"]),
  u("B1", 4, "opinions-et-arguments", "Opinions et arguments", "Subjonctif (opinion), relatifs qui/que", ["politique-societe"]),
  u("B1", 5, "technologie", "Technologie", "Relatifs dont/où, internet et réseaux", ["technologie-internet"]),
  u("B1", 6, "sport-et-forme", "Sport et forme", "Comparatifs/superlatifs avancés", ["sport-fitness"]),
  u("B1", 7, "musique-art-cinema", "Musique, art et cinéma", "Révision des temps du passé", ["musique-art-cinema"]),
  u("B1", 8, "livres-et-litterature", "Livres et littérature", "Discours indirect (intro)", ["livres-litterature"]),
  u("B1", 9, "emotions-et-personnalite", "Émotions et personnalité", "Verbes pronominaux avancés", ["emotions-personnalite"]),
  u("B1", 10, "amitie-et-amour", "Amitié et amour", "Subjonctif (révision), boss d'unité", ["amitie-amour"]),

  // B2 — Avancé
  u("B2", 1, "le-plus-que-parfait", "Le plus-que-parfait", "Plus-que-parfait", ["histoire-culture"]),
  u("B2", 2, "subjonctif-passe", "Subjonctif passé", "Subjonctif passé", ["emotions-personnalite"]),
  u("B2", 3, "la-voix-passive", "La voix passive", "Voix passive", ["medias-journalisme"]),
  u("B2", 4, "discours-indirect", "Discours indirect", "Concordance des temps", ["connecteurs-discours"]),
  u("B2", 5, "administration-et-banque", "Administration et banque", "La paperasse, registre soutenu", ["banque-administration"]),
  u("B2", 6, "politique-et-societe", "Politique et société", "Débat, nuance", ["politique-societe"]),
  u("B2", 7, "environnement-et-science", "Environnement et science", "Argumentation", ["environnement-climat"]),
  u("B2", 8, "droit-et-economie", "Droit et économie", "Registre soutenu (révision), boss d'unité", ["droit-justice", "affaires-economie"]),

  // C1 — Maîtrise
  u("C1", 1, "temps-litteraires", "Temps littéraires", "Passé simple, subjonctif imparfait (reconnaissance)", ["livres-litterature"]),
  u("C1", 2, "idiomes-et-expressions", "Idiomes et expressions", "Expressions idiomatiques", ["idiomes-expressions"]),
  u("C1", 3, "ecriture-formelle", "Écriture formelle", "Correspondance formelle", ["correspondance-formelle"]),
  u("C1", 4, "debat-abstrait", "Débat abstrait", "Philosophie, médias, journalisme", ["philosophie-idees-abstraites", "medias-journalisme"]),
  u("C1", 5, "registre-familier-et-argot", "Registre familier et argot", "Familier, verlan", ["argot-verlan"]),
  u("C1", 6, "maitrise-totale", "Maîtrise totale", "Synthèse, histoire et culture, boss final", ["histoire-culture", "faux-amis"]),
];

function u(
  level: Cefr,
  order: number,
  slug: string,
  title: string,
  focus: string,
  topics: TopicSlug[],
): UnitDef {
  return { slug, level, order, title, focus, topics };
}

/** Global order across all levels, used for skill-tree layout and unlock sequencing. */
export function unitGlobalOrder(unit: UnitDef): number {
  return LEVEL_ORDER[unit.level] * 100 + unit.order;
}

export const UNITS_SORTED = [...UNITS].sort((a, b) => unitGlobalOrder(a) - unitGlobalOrder(b));

/**
 * Each unit gets 6 lesson nodes (vocab ×2, grammar ×2, mixed practice, production) + a review +
 * a boss test — 8 skill-tree nodes total, within the 5–8 "lessons" + review + boss spec.
 * Titles are templated from the unit's own title/focus/topics rather than hand-authored one by one
 * (~350 nodes); the template still yields distinct, real content per unit since title/focus/topic
 * vary. See DECISIONS.md.
 */
export function buildLessonsForUnit(unit: UnitDef): LessonDef[] {
  const primaryTopic = unit.topics[0] ?? null;
  const lessons: LessonDef[] = [
    {
      slug: `${unit.slug}-vocab-1`,
      unitSlug: unit.slug,
      order: 1,
      kind: "lesson",
      title: `${unit.title} — Vocabulaire essentiel`,
      skillFocus: ["vocab-new", "recognition"],
      topicSlug: primaryTopic,
    },
    {
      slug: `${unit.slug}-vocab-2`,
      unitSlug: unit.slug,
      order: 2,
      kind: "lesson",
      title: `${unit.title} — Vocabulaire élargi`,
      skillFocus: ["vocab-new", "production"],
      topicSlug: unit.topics[1] ?? primaryTopic,
    },
    {
      slug: `${unit.slug}-grammar-1`,
      unitSlug: unit.slug,
      order: 3,
      kind: "lesson",
      title: `${unit.focus} — Introduction`,
      skillFocus: ["grammar-intro"],
      topicSlug: primaryTopic,
    },
    {
      slug: `${unit.slug}-grammar-2`,
      unitSlug: unit.slug,
      order: 4,
      kind: "lesson",
      title: `${unit.focus} — Pratique`,
      skillFocus: ["grammar-practice"],
      topicSlug: primaryTopic,
    },
    {
      slug: `${unit.slug}-mixed`,
      unitSlug: unit.slug,
      order: 5,
      kind: "lesson",
      title: `${unit.title} — Mise en pratique`,
      skillFocus: ["mixed-review", "listening"],
      topicSlug: primaryTopic,
    },
    {
      slug: `${unit.slug}-production`,
      unitSlug: unit.slug,
      order: 6,
      kind: "lesson",
      title: `${unit.title} — Production`,
      skillFocus: ["free-translation", "speaking"],
      topicSlug: primaryTopic,
    },
    {
      slug: `${unit.slug}-review`,
      unitSlug: unit.slug,
      order: 7,
      kind: "review",
      title: `Révision — ${unit.title}`,
      skillFocus: ["mixed-review"],
      topicSlug: primaryTopic,
    },
    {
      slug: `${unit.slug}-boss`,
      unitSlug: unit.slug,
      order: 8,
      kind: "boss",
      title: `Test de fin d'unité — ${unit.title}`,
      skillFocus: ["boss"],
      topicSlug: primaryTopic,
    },
  ];
  return lessons;
}

export const LESSONS: LessonDef[] = UNITS_SORTED.flatMap(buildLessonsForUnit);
