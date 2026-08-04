export type AchievementCriteria =
  | { type: "words_known"; count: number }
  | { type: "verb_drills"; count: number }
  | { type: "perfect_lessons"; count: number }
  | { type: "streak_days"; count: number }
  | { type: "studied_after_midnight" }
  | { type: "studied_before_dawn" }
  | { type: "boss_passed"; unitSlug: string; minScore: number }
  | { type: "units_mastered"; count: number }
  | { type: "reviews_completed"; count: number }
  | { type: "leeches_cleared"; count: number }
  | { type: "levels_reached"; level: number }
  | { type: "topics_at_full_recall"; count: number }
  | { type: "speaking_exercises"; count: number }
  | { type: "dictation_exercises"; count: number }
  | { type: "register_swaps"; count: number }
  | { type: "weekend_sessions"; count: number }
  | { type: "placement_test_done" };

export interface AchievementDef {
  slug: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  criteria: AchievementCriteria;
}

/** PLAN.md §5 — at least 30 achievements. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { slug: "premiers-mots", title: "Premiers mots", description: "Apprends tes 10 premiers mots.", icon: "sparkles", tier: "bronze", criteria: { type: "words_known", count: 10 } },
  { slug: "cent-mots", title: "Cent mots", description: "Apprends 100 mots.", icon: "sparkles", tier: "bronze", criteria: { type: "words_known", count: 100 } },
  { slug: "bilingue-en-herbe", title: "Bilingue en herbe", description: "Apprends 500 mots.", icon: "sprout", tier: "silver", criteria: { type: "words_known", count: 500 } },
  { slug: "millier-de-mots", title: "Mille mots", description: "Apprends 1 000 mots.", icon: "book-open", tier: "gold", criteria: { type: "words_known", count: 1000 } },
  { slug: "polyglotte", title: "Polyglotte en devenir", description: "Apprends 2 500 mots.", icon: "book-open", tier: "gold", criteria: { type: "words_known", count: 2500 } },
  { slug: "maitre-du-vocabulaire", title: "Maître du vocabulaire", description: "Apprends 4 000 mots.", icon: "crown", tier: "platinum", criteria: { type: "words_known", count: 4000 } },

  { slug: "premier-verbe", title: "Premier verbe", description: "Réussis ton premier exercice de conjugaison.", icon: "check", tier: "bronze", criteria: { type: "verb_drills", count: 1 } },
  { slug: "conjugueur-debutant", title: "Conjugueur débutant", description: "Réussis 100 exercices de conjugaison.", icon: "check", tier: "bronze", criteria: { type: "verb_drills", count: 100 } },
  { slug: "conjugueur", title: "Conjugueur", description: "Réussis 1 000 exercices de conjugaison.", icon: "check-circle", tier: "gold", criteria: { type: "verb_drills", count: 1000 } },
  { slug: "conjugueur-chevronne", title: "Conjugueur chevronné", description: "Réussis 2 500 exercices de conjugaison.", icon: "check-circle", tier: "platinum", criteria: { type: "verb_drills", count: 2500 } },

  { slug: "sans-faute", title: "Sans faute", description: "Termine 10 leçons parfaites (sans aucune erreur).", icon: "star", tier: "silver", criteria: { type: "perfect_lessons", count: 10 } },
  { slug: "perfectionniste", title: "Perfectionniste", description: "Termine 50 leçons parfaites.", icon: "star", tier: "gold", criteria: { type: "perfect_lessons", count: 50 } },
  { slug: "impeccable", title: "Impeccable", description: "Termine 100 leçons parfaites.", icon: "star", tier: "platinum", criteria: { type: "perfect_lessons", count: 100 } },

  { slug: "une-semaine", title: "Une semaine d'assiduité", description: "Maintiens un streak de 7 jours.", icon: "flame", tier: "bronze", criteria: { type: "streak_days", count: 7 } },
  { slug: "marathonien", title: "Marathonien", description: "Maintiens un streak de 30 jours.", icon: "flame", tier: "gold", criteria: { type: "streak_days", count: 30 } },
  { slug: "cent-jours", title: "Cent jours", description: "Maintiens un streak de 100 jours.", icon: "flame", tier: "platinum", criteria: { type: "streak_days", count: 100 } },
  { slug: "annee-complete", title: "Une année entière", description: "Maintiens un streak de 365 jours.", icon: "flame", tier: "platinum", criteria: { type: "streak_days", count: 365 } },

  { slug: "noctambule", title: "Noctambule", description: "Étudie après minuit.", icon: "moon", tier: "bronze", criteria: { type: "studied_after_midnight" } },
  { slug: "leve-tot", title: "Lève-tôt", description: "Étudie avant l'aube.", icon: "sunrise", tier: "bronze", criteria: { type: "studied_before_dawn" } },
  { slug: "guerrier-du-week-end", title: "Guerrier du week-end", description: "Étudie 10 week-ends d'affilée.", icon: "calendar", tier: "silver", criteria: { type: "weekend_sessions", count: 10 } },

  { slug: "subjonctif-survivor", title: "Subjonctif Survivor", description: "Réussis le test de fin d'unité « Il faut que » à 90 % ou plus.", icon: "medal", tier: "gold", criteria: { type: "boss_passed", unitSlug: "il-faut-que", minScore: 0.9 } },
  { slug: "passe-compose-conquis", title: "Passé composé conquis", description: "Réussis le test de fin d'unité « Hier » à 90 % ou plus.", icon: "medal", tier: "silver", criteria: { type: "boss_passed", unitSlug: "hier", minScore: 0.9 } },
  { slug: "maitre-du-subjonctif-passe", title: "Maître du subjonctif passé", description: "Réussis le test de fin d'unité « Subjonctif passé » à 90 % ou plus.", icon: "medal", tier: "gold", criteria: { type: "boss_passed", unitSlug: "subjonctif-passe", minScore: 0.9 } },
  { slug: "styliste-de-la-voix-passive", title: "Styliste de la voix passive", description: "Réussis le test de fin d'unité « La voix passive » à 90 % ou plus.", icon: "medal", tier: "gold", criteria: { type: "boss_passed", unitSlug: "la-voix-passive", minScore: 0.9 } },
  { slug: "champion-litteraire", title: "Champion littéraire", description: "Réussis le test de fin d'unité « Temps littéraires » à 90 % ou plus.", icon: "medal", tier: "platinum", criteria: { type: "boss_passed", unitSlug: "temps-litteraires", minScore: 0.9 } },
  { slug: "maitrise-absolue", title: "Maîtrise absolue", description: "Réussis le test final « Maîtrise totale » à 90 % ou plus.", icon: "trophy", tier: "platinum", criteria: { type: "boss_passed", unitSlug: "maitrise-totale", minScore: 0.9 } },

  { slug: "premiere-unite", title: "Première unité en or", description: "Fais briller ta première unité en or.", icon: "medal", tier: "bronze", criteria: { type: "units_mastered", count: 1 } },
  { slug: "dix-unites", title: "Dix unités maîtrisées", description: "Fais briller 10 unités en or.", icon: "medal", tier: "silver", criteria: { type: "units_mastered", count: 10 } },
  { slug: "toutes-les-unites", title: "Le parcours complet", description: "Fais briller les 44 unités en or.", icon: "trophy", tier: "platinum", criteria: { type: "units_mastered", count: 44 } },

  { slug: "revision-assidue", title: "Révision assidue", description: "Termine 100 révisions espacées.", icon: "refresh-cw", tier: "bronze", criteria: { type: "reviews_completed", count: 100 } },
  { slug: "memoire-de-fer", title: "Mémoire de fer", description: "Termine 1 000 révisions espacées.", icon: "refresh-cw", tier: "gold", criteria: { type: "reviews_completed", count: 1000 } },
  { slug: "memoire-infaillible", title: "Mémoire infaillible", description: "Termine 5 000 révisions espacées.", icon: "refresh-cw", tier: "platinum", criteria: { type: "reviews_completed", count: 5000 } },

  { slug: "chasseur-de-sangsues", title: "Chasseur de mots difficiles", description: "Reviens à bout de 5 mots difficiles (leeches).", icon: "target", tier: "silver", criteria: { type: "leeches_cleared", count: 5 } },
  { slug: "exterminateur", title: "Exterminateur de sangsues", description: "Reviens à bout de 20 mots difficiles (leeches).", icon: "target", tier: "gold", criteria: { type: "leeches_cleared", count: 20 } },

  { slug: "niveau-dix", title: "Niveau 10", description: "Atteins le niveau 10.", icon: "trending-up", tier: "bronze", criteria: { type: "levels_reached", level: 10 } },
  { slug: "niveau-vingt-cinq", title: "Niveau 25", description: "Atteins le niveau 25.", icon: "trending-up", tier: "silver", criteria: { type: "levels_reached", level: 25 } },
  { slug: "niveau-cinquante", title: "Niveau 50", description: "Atteins le niveau 50.", icon: "trending-up", tier: "gold", criteria: { type: "levels_reached", level: 50 } },

  { slug: "orateur-en-herbe", title: "Orateur en herbe", description: "Termine 50 exercices d'expression orale.", icon: "mic", tier: "silver", criteria: { type: "speaking_exercises", count: 50 } },
  { slug: "stenographe", title: "Sténographe", description: "Termine 100 exercices de dictée.", icon: "pen", tier: "silver", criteria: { type: "dictation_exercises", count: 100 } },
  { slug: "grand-registre", title: "Grand registre", description: "Termine 30 exercices de changement de registre.", icon: "feather", tier: "gold", criteria: { type: "register_swaps", count: 30 } },

  { slug: "placement-fait", title: "Point de départ", description: "Termine le test de positionnement initial.", icon: "map-pin", tier: "bronze", criteria: { type: "placement_test_done" } },
];
