/** Canonical topic list. Slugs are the filenames under /content/vocab/{slug}.json and
 * /content/sentences/{slug}.json. Order matches PLAN.md §3. */
export const TOPICS = [
  { slug: "salutations", label: "Salutations & introductions" },
  { slug: "famille", label: "Family & relationships" },
  { slug: "nombres-temps", label: "Numbers, dates & time" },
  { slug: "couleurs-formes", label: "Colours & shapes" },
  { slug: "nourriture-boissons", label: "Food & drink" },
  { slug: "restaurant", label: "Restaurants & ordering" },
  { slug: "maison", label: "The house & furniture" },
  { slug: "vetements-mode", label: "Clothing & fashion" },
  { slug: "corps-sante", label: "Body & health" },
  { slug: "routine-quotidienne", label: "Daily routine" },
  { slug: "ecole-education", label: "School & education" },
  { slug: "travail-metiers", label: "Work & professions" },
  { slug: "shopping-argent", label: "Shopping & money" },
  { slug: "transport-directions", label: "Transport & directions" },
  { slug: "voyages-vacances", label: "Travel & holidays" },
  { slug: "meteo-saisons", label: "Weather & seasons" },
  { slug: "nature-animaux", label: "Nature & animals" },
  { slug: "ville-batiments", label: "City & buildings" },
  { slug: "technologie-internet", label: "Technology & internet" },
  { slug: "sport-fitness", label: "Sports & fitness" },
  { slug: "musique-art-cinema", label: "Music, art & film" },
  { slug: "livres-litterature", label: "Books & literature" },
  { slug: "emotions-personnalite", label: "Emotions & personality" },
  { slug: "loisirs", label: "Hobbies & free time" },
  { slug: "amitie-amour", label: "Friendship & love" },
  { slug: "telephone-communication", label: "Phone & communication" },
  { slug: "banque-administration", label: "Banking & admin (la paperasse)" },
  { slug: "politique-societe", label: "Politics & society" },
  { slug: "environnement-climat", label: "Environment & climate" },
  { slug: "science-innovation", label: "Science & innovation" },
  { slug: "droit-justice", label: "Law & justice" },
  { slug: "affaires-economie", label: "Business & economics" },
  { slug: "medias-journalisme", label: "Media & journalism" },
  { slug: "philosophie-idees-abstraites", label: "Philosophy & abstract ideas" },
  { slug: "histoire-culture", label: "History & culture française" },
  { slug: "idiomes-expressions", label: "Idioms & expressions" },
  { slug: "argot-verlan", label: "Slang & verlan" },
  { slug: "connecteurs-discours", label: "Connectors & discourse markers" },
  { slug: "faux-amis", label: "Faux amis" },
  { slug: "correspondance-formelle", label: "Formal writing & correspondence" },
] as const;

export type TopicSlug = (typeof TOPICS)[number]["slug"];

export const TOPIC_SLUGS: readonly string[] = TOPICS.map((t) => t.slug);

export const MIN_ENTRIES_PER_TOPIC = 80;
export const MIN_TOTAL_ENTRIES = 4000;
