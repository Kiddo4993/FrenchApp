import { sql } from "drizzle-orm";
import { boolean, doublePrecision, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date());

// ---------------------------------------------------------------------------
// Content tables — seeded from /content, read-mostly, versioned in git.
// ---------------------------------------------------------------------------

export const vocabEntries = pgTable(
  "vocab_entries",
  {
    id: id(),
    fr: text("fr").notNull(),
    en: text("en").notNull(),
    lemma: text("lemma").notNull(),
    pos: text("pos", {
      enum: ["noun", "verb", "adj", "adv", "prep", "conj", "phrase", "pronoun"],
    }).notNull(),
    gender: text("gender", { enum: ["m", "f", "both"] }),
    plural: text("plural"),
    ipa: text("ipa").notNull(),
    cefr: text("cefr", { enum: ["A1", "A2", "B1", "B2", "C1"] }).notNull(),
    topic: text("topic").notNull(),
    register: text("register", {
      enum: ["neutre", "familier", "soutenu", "argot"],
    }).notNull(),
    exampleFr: text("example_fr").notNull(),
    exampleEn: text("example_en").notNull(),
    collocations: jsonb("collocations").$type<string[]>(),
    fauxAmi: text("faux_ami"),
    mnemonic: text("mnemonic"),
    audioText: text("audio_text").notNull(),
  },
  (t) => [uniqueIndex("vocab_lemma_topic_idx").on(t.lemma, t.topic)],
);

export const verbs = pgTable("verbs", {
  id: id(),
  infinitive: text("infinitive").notNull().unique(),
  group: text("group", { enum: ["er", "ir", "re", "irregular"] }).notNull(),
  auxiliary: text("auxiliary", { enum: ["avoir", "etre", "both"] }).notNull(),
  pastParticiple: text("past_participle").notNull(),
  frequencyRank: integer("frequency_rank").notNull(),
});

export const verbConjugations = pgTable(
  "verb_conjugations",
  {
    id: id(),
    verbId: text("verb_id")
      .notNull()
      .references(() => verbs.id, { onDelete: "cascade" }),
    tense: text("tense", {
      enum: [
        "present",
        "passe_compose",
        "imparfait",
        "futur_simple",
        "conditionnel_present",
        "subjonctif_present",
        "plus_que_parfait",
        "imperatif",
      ],
    }).notNull(),
    person: text("person", { enum: ["1s", "2s", "3s", "1p", "2p", "3p"] }).notNull(),
    form: text("form").notNull(),
    isIrregular: boolean("is_irregular").notNull().default(false),
  },
  (t) => [uniqueIndex("verb_tense_person_idx").on(t.verbId, t.tense, t.person)],
);

export const grammarPoints = pgTable("grammar_points", {
  id: id(),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  explanationEn: text("explanation_en").notNull(),
  examples: jsonb("examples").$type<{ fr: string; en: string; note?: string }[]>().notNull(),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().notNull(),
  whyItTrips: jsonb("why_it_trips").$type<string[]>().notNull(),
  searchTags: jsonb("search_tags").$type<string[]>().notNull(),
});

export const sentences = pgTable("sentences", {
  id: id(),
  topic: text("topic").notNull(),
  cefr: text("cefr", { enum: ["A1", "A2", "B1", "B2", "C1"] }).notNull(),
  fr: text("fr").notNull(),
  en: text("en").notNull(),
  audioText: text("audio_text").notNull(),
  usedFor: text("used_for", {
    enum: ["reading", "dictation", "ordering", "cloze"],
  }).notNull(),
});

export const readingPassages = pgTable("reading_passages", {
  id: id(),
  cefr: text("cefr", { enum: ["A1", "A2", "B1", "B2", "C1"] }).notNull(),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  bodyFr: text("body_fr").notNull(),
  questions: jsonb("questions").$type<{ q: string; options: string[]; answer: number }[]>().notNull(),
});

export const levels = pgTable("levels", {
  id: text("id", { enum: ["A1", "A2", "B1", "B2", "C1"] }).primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const units = pgTable("units", {
  id: id(),
  levelId: text("level_id")
    .notNull()
    .references(() => levels.id),
  order: integer("order").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  focus: text("focus").notNull(),
  topics: jsonb("topics").$type<string[]>().notNull(),
});

export const lessons = pgTable("lessons", {
  id: id(),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  kind: text("kind", { enum: ["lesson", "review", "boss"] }).notNull(),
  title: text("title").notNull(),
  skillFocus: jsonb("skill_focus").$type<string[]>().notNull(),
  topicSlug: text("topic_slug"),
});

export const achievements = pgTable("achievements", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull(),
  tier: text("tier", { enum: ["bronze", "silver", "gold", "platinum"] }).notNull(),
});

// ---------------------------------------------------------------------------
// User-state tables — mutable, all local to the single profile.
// ---------------------------------------------------------------------------

export const profile = pgTable("profile", {
  id: text("id").primaryKey().default("singleton"),
  name: text("name").notNull(),
  createdAt: createdAt(),
  currentUnitId: text("current_unit_id").references(() => units.id),
  placementDone: boolean("placement_done").notNull().default(false),
});

export const settings = pgTable("settings", {
  profileId: text("profile_id")
    .primaryKey()
    .references(() => profile.id, { onDelete: "cascade" }),
  dailyGoalXp: integer("daily_goal_xp").notNull().default(50),
  heartsEnabled: boolean("hearts_enabled").notNull().default(false),
  targetRetention: doublePrecision("target_retention").notNull().default(0.9),
  newCardsPerDay: integer("new_cards_per_day").notNull().default(15),
  theme: text("theme", { enum: ["light", "dark", "system"] }).notNull().default("system"),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
});

export const cards = pgTable(
  "cards",
  {
    id: id(),
    vocabId: text("vocab_id").references(() => vocabEntries.id, { onDelete: "cascade" }),
    grammarPointId: text("grammar_point_id").references(() => grammarPoints.id, {
      onDelete: "cascade",
    }),
    track: text("track", {
      enum: ["recognition", "production", "listening", "spelling"],
    }).notNull(),
    state: text("state", { enum: ["new", "learning", "review", "relearning"] })
      .notNull()
      .default("new"),
    stability: doublePrecision("stability").notNull().default(0),
    difficulty: doublePrecision("difficulty").notNull().default(0),
    retrievability: doublePrecision("retrievability").notNull().default(1),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    lastReview: timestamp("last_review"),
    dueDate: timestamp("due_date")
      .notNull()
      .$defaultFn(() => new Date()),
    isLeech: boolean("is_leech").notNull().default(false),
  },
  (t) => [
    uniqueIndex("cards_vocab_track_idx")
      .on(t.vocabId, t.track)
      .where(sql`${t.vocabId} is not null`),
    uniqueIndex("cards_grammar_track_idx")
      .on(t.grammarPointId, t.track)
      .where(sql`${t.grammarPointId} is not null`),
  ],
);

/**
 * One row per completed exercise, regardless of exercise kind. `cards`/`reviewLogs` only cover
 * the kinds that map to an SRS track (see src/lib/exercises/grading.ts); batch/curated kinds
 * (matching_pairs, conjugation_drill, reading_comprehension, odd_one_out, register_swap) have no
 * SRS card to attach to, but still need to be counted for achievements ("1,000 verb drills") and
 * the dashboard's accuracy-by-exercise-type breakdown — this table is the single source for both.
 */
export const exerciseEvents = pgTable("exercise_events", {
  id: id(),
  ts: timestamp("ts")
    .notNull()
    .$defaultFn(() => new Date()),
  kind: text("kind", {
    enum: [
      "mcq_recognition",
      "mcq_production",
      "listening",
      "dictation",
      "word_bank",
      "free_translation",
      "cloze",
      "gender_drill",
      "conjugation_drill",
      "matching_pairs",
      "speaking",
      "sentence_ordering",
      "reading_comprehension",
      "odd_one_out",
      "register_swap",
    ],
  }).notNull(),
  correct: boolean("correct").notNull(),
  // `ExercisePrompt.cardId` (src/types/exercise.ts) is the vocab entry's id, not a `cards` row id
  // — the SRS card for that word/track may not exist yet at exercise-completion time. See
  // DECISIONS.md.
  vocabId: text("vocab_id").references(() => vocabEntries.id, { onDelete: "set null" }),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
});

export const reviewLogs = pgTable("review_logs", {
  id: id(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  ts: timestamp("ts")
    .notNull()
    .$defaultFn(() => new Date()),
  grade: text("grade", { enum: ["again", "hard", "good", "easy"] }).notNull(),
  correct: boolean("correct").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  hintUsed: boolean("hint_used").notNull().default(false),
  stabilityBefore: doublePrecision("stability_before").notNull(),
  stabilityAfter: doublePrecision("stability_after").notNull(),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: id(),
  lessonId: text("lesson_id")
    .notNull()
    .unique()
    .references(() => lessons.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["locked", "available", "in_progress", "complete"],
  })
    .notNull()
    .default("locked"),
  crownLevel: integer("crown_level").notNull().default(0),
  bestAccuracy: doublePrecision("best_accuracy"),
  lastCompletedAt: timestamp("last_completed_at"),
});

export const unitProgress = pgTable("unit_progress", {
  id: id(),
  unitId: text("unit_id")
    .notNull()
    .unique()
    .references(() => units.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["locked", "available", "in_progress", "complete", "gold", "cracked"],
  })
    .notNull()
    .default("locked"),
  bossScore: doublePrecision("boss_score"),
  masteredAt: timestamp("mastered_at"),
});

export const xpEvents = pgTable("xp_events", {
  id: id(),
  ts: timestamp("ts")
    .notNull()
    .$defaultFn(() => new Date()),
  amount: integer("amount").notNull(),
  source: text("source", {
    enum: ["exercise", "perfect_lesson", "boss", "achievement"],
  }).notNull(),
});

export const userStats = pgTable("user_stats", {
  id: text("id").primaryKey().default("singleton"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  freezesAvailable: integer("freezes_available").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  weekendAmuletActive: boolean("weekend_amulet_active").notNull().default(false),
  hearts: integer("hearts").notNull().default(5),
  heartsRefillAt: timestamp("hearts_refill_at"),
});

export const userAchievements = pgTable("user_achievements", {
  id: id(),
  achievementId: text("achievement_id")
    .notNull()
    .unique()
    .references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessionLogs = pgTable("session_logs", {
  id: id(),
  date: text("date").notNull().unique(),
  minutesStudied: doublePrecision("minutes_studied").notNull().default(0),
  exercisesCompleted: integer("exercises_completed").notNull().default(0),
});

export const placementResult = pgTable("placement_result", {
  id: text("id").primaryKey().default("singleton"),
  score: doublePrecision("score").notNull(),
  recommendedUnitId: text("recommended_unit_id")
    .notNull()
    .references(() => units.id),
  completedAt: timestamp("completed_at")
    .notNull()
    .$defaultFn(() => new Date()),
  answers: jsonb("answers").$type<{ questionId: string; correct: boolean }[]>().notNull(),
});
