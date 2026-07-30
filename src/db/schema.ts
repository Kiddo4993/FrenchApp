import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

// ---------------------------------------------------------------------------
// Content tables — seeded from /content, read-mostly, versioned in git.
// ---------------------------------------------------------------------------

export const vocabEntries = sqliteTable(
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
    collocations: text("collocations", { mode: "json" }).$type<string[]>(),
    fauxAmi: text("faux_ami"),
    mnemonic: text("mnemonic"),
    audioText: text("audio_text").notNull(),
  },
  (t) => [uniqueIndex("vocab_lemma_topic_idx").on(t.lemma, t.topic)],
);

export const verbs = sqliteTable("verbs", {
  id: id(),
  infinitive: text("infinitive").notNull().unique(),
  group: text("group", { enum: ["er", "ir", "re", "irregular"] }).notNull(),
  auxiliary: text("auxiliary", { enum: ["avoir", "etre", "both"] }).notNull(),
  pastParticiple: text("past_participle").notNull(),
  frequencyRank: integer("frequency_rank").notNull(),
});

export const verbConjugations = sqliteTable(
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
    isIrregular: integer("is_irregular", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [uniqueIndex("verb_tense_person_idx").on(t.verbId, t.tense, t.person)],
);

export const grammarPoints = sqliteTable(
  "grammar_points",
  {
    id: id(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    explanationEn: text("explanation_en").notNull(),
    examples: text("examples", { mode: "json" })
      .$type<{ fr: string; en: string; note?: string }[]>()
      .notNull(),
    commonMistakes: text("common_mistakes", { mode: "json" }).$type<string[]>().notNull(),
    whyItTrips: text("why_it_trips", { mode: "json" }).$type<string[]>().notNull(),
    searchTags: text("search_tags", { mode: "json" }).$type<string[]>().notNull(),
  },
);

export const sentences = sqliteTable("sentences", {
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

export const readingPassages = sqliteTable("reading_passages", {
  id: id(),
  cefr: text("cefr", { enum: ["A1", "A2", "B1", "B2", "C1"] }).notNull(),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  bodyFr: text("body_fr").notNull(),
  questions: text("questions", { mode: "json" })
    .$type<{ q: string; options: string[]; answer: number }[]>()
    .notNull(),
});

export const levels = sqliteTable("levels", {
  id: text("id", { enum: ["A1", "A2", "B1", "B2", "C1"] }).primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const units = sqliteTable("units", {
  id: id(),
  levelId: text("level_id")
    .notNull()
    .references(() => levels.id),
  order: integer("order").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  focus: text("focus").notNull(),
  topics: text("topics", { mode: "json" }).$type<string[]>().notNull(),
});

export const lessons = sqliteTable("lessons", {
  id: id(),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  kind: text("kind", { enum: ["lesson", "review", "boss"] }).notNull(),
  title: text("title").notNull(),
  skillFocus: text("skill_focus", { mode: "json" }).$type<string[]>().notNull(),
  topicSlug: text("topic_slug"),
});

export const achievements = sqliteTable("achievements", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  criteria: text("criteria", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  tier: text("tier", { enum: ["bronze", "silver", "gold", "platinum"] }).notNull(),
});

// ---------------------------------------------------------------------------
// User-state tables — mutable, all local to the single profile.
// ---------------------------------------------------------------------------

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey().default("singleton"),
  name: text("name").notNull(),
  createdAt: createdAt(),
  currentUnitId: text("current_unit_id").references(() => units.id),
  placementDone: integer("placement_done", { mode: "boolean" }).notNull().default(false),
});

export const settings = sqliteTable("settings", {
  profileId: text("profile_id")
    .primaryKey()
    .references(() => profile.id, { onDelete: "cascade" }),
  dailyGoalXp: integer("daily_goal_xp").notNull().default(50),
  heartsEnabled: integer("hearts_enabled", { mode: "boolean" }).notNull().default(false),
  targetRetention: real("target_retention").notNull().default(0.9),
  newCardsPerDay: integer("new_cards_per_day").notNull().default(15),
  theme: text("theme", { enum: ["light", "dark", "system"] }).notNull().default("system"),
  reducedMotion: integer("reduced_motion", { mode: "boolean" }).notNull().default(false),
});

export const cards = sqliteTable(
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
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    retrievability: real("retrievability").notNull().default(1),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    lastReview: integer("last_review", { mode: "timestamp_ms" }),
    dueDate: integer("due_date", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    isLeech: integer("is_leech", { mode: "boolean" }).notNull().default(false),
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

export const reviewLogs = sqliteTable("review_logs", {
  id: id(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  ts: integer("ts", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  grade: text("grade", { enum: ["again", "hard", "good", "easy"] }).notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  latencyMs: integer("latency_ms").notNull(),
  hintUsed: integer("hint_used", { mode: "boolean" }).notNull().default(false),
  stabilityBefore: real("stability_before").notNull(),
  stabilityAfter: real("stability_after").notNull(),
});

export const lessonProgress = sqliteTable("lesson_progress", {
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
  bestAccuracy: real("best_accuracy"),
  lastCompletedAt: integer("last_completed_at", { mode: "timestamp_ms" }),
});

export const unitProgress = sqliteTable("unit_progress", {
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
  bossScore: real("boss_score"),
  masteredAt: integer("mastered_at", { mode: "timestamp_ms" }),
});

export const xpEvents = sqliteTable("xp_events", {
  id: id(),
  ts: integer("ts", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  amount: integer("amount").notNull(),
  source: text("source", {
    enum: ["exercise", "perfect_lesson", "boss", "achievement"],
  }).notNull(),
});

export const userStats = sqliteTable("user_stats", {
  id: text("id").primaryKey().default("singleton"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  freezesAvailable: integer("freezes_available").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  weekendAmuletActive: integer("weekend_amulet_active", { mode: "boolean" })
    .notNull()
    .default(false),
  hearts: integer("hearts").notNull().default(5),
  heartsRefillAt: integer("hearts_refill_at", { mode: "timestamp_ms" }),
});

export const userAchievements = sqliteTable("user_achievements", {
  id: id(),
  achievementId: text("achievement_id")
    .notNull()
    .unique()
    .references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: integer("unlocked_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessionLogs = sqliteTable("session_logs", {
  id: id(),
  date: text("date").notNull().unique(),
  minutesStudied: real("minutes_studied").notNull().default(0),
  exercisesCompleted: integer("exercises_completed").notNull().default(0),
});

export const placementResult = sqliteTable("placement_result", {
  id: text("id").primaryKey().default("singleton"),
  score: real("score").notNull(),
  recommendedUnitId: text("recommended_unit_id")
    .notNull()
    .references(() => units.id),
  completedAt: integer("completed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  answers: text("answers", { mode: "json" }).$type<
    { questionId: string; correct: boolean }[]
  >().notNull(),
});
