CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"tier" text NOT NULL,
	CONSTRAINT "achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"vocab_id" text,
	"grammar_point_id" text,
	"track" text NOT NULL,
	"state" text DEFAULT 'new' NOT NULL,
	"stability" double precision DEFAULT 0 NOT NULL,
	"difficulty" double precision DEFAULT 0 NOT NULL,
	"retrievability" double precision DEFAULT 1 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"last_review" timestamp,
	"due_date" timestamp NOT NULL,
	"is_leech" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_events" (
	"id" text PRIMARY KEY NOT NULL,
	"ts" timestamp NOT NULL,
	"kind" text NOT NULL,
	"correct" boolean NOT NULL,
	"vocab_id" text,
	"lesson_id" text
);
--> statement-breakpoint
CREATE TABLE "grammar_points" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"explanation_en" text NOT NULL,
	"examples" jsonb NOT NULL,
	"common_mistakes" jsonb NOT NULL,
	"why_it_trips" jsonb NOT NULL,
	"search_tags" jsonb NOT NULL,
	CONSTRAINT "grammar_points_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"status" text DEFAULT 'locked' NOT NULL,
	"crown_level" integer DEFAULT 0 NOT NULL,
	"best_accuracy" double precision,
	"last_completed_at" timestamp,
	CONSTRAINT "lesson_progress_lesson_id_unique" UNIQUE("lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"order" integer NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"skill_focus" jsonb NOT NULL,
	"topic_slug" text
);
--> statement-breakpoint
CREATE TABLE "levels" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_result" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"score" double precision NOT NULL,
	"recommended_unit_id" text NOT NULL,
	"completed_at" timestamp NOT NULL,
	"answers" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"current_unit_id" text,
	"placement_done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_passages" (
	"id" text PRIMARY KEY NOT NULL,
	"cefr" text NOT NULL,
	"topic" text NOT NULL,
	"title" text NOT NULL,
	"body_fr" text NOT NULL,
	"questions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"ts" timestamp NOT NULL,
	"grade" text NOT NULL,
	"correct" boolean NOT NULL,
	"latency_ms" integer NOT NULL,
	"hint_used" boolean DEFAULT false NOT NULL,
	"stability_before" double precision NOT NULL,
	"stability_after" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentences" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"cefr" text NOT NULL,
	"fr" text NOT NULL,
	"en" text NOT NULL,
	"audio_text" text NOT NULL,
	"used_for" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"minutes_studied" double precision DEFAULT 0 NOT NULL,
	"exercises_completed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "session_logs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"profile_id" text PRIMARY KEY NOT NULL,
	"daily_goal_xp" integer DEFAULT 50 NOT NULL,
	"hearts_enabled" boolean DEFAULT false NOT NULL,
	"target_retention" double precision DEFAULT 0.9 NOT NULL,
	"new_cards_per_day" integer DEFAULT 15 NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"status" text DEFAULT 'locked' NOT NULL,
	"boss_score" double precision,
	"mastered_at" timestamp,
	CONSTRAINT "unit_progress_unit_id_unique" UNIQUE("unit_id")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"level_id" text NOT NULL,
	"order" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"focus" text NOT NULL,
	"topics" jsonb NOT NULL,
	CONSTRAINT "units_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp NOT NULL,
	CONSTRAINT "user_achievements_achievement_id_unique" UNIQUE("achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"freezes_available" integer DEFAULT 0 NOT NULL,
	"last_active_date" text,
	"weekend_amulet_active" boolean DEFAULT false NOT NULL,
	"hearts" integer DEFAULT 5 NOT NULL,
	"hearts_refill_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verb_conjugations" (
	"id" text PRIMARY KEY NOT NULL,
	"verb_id" text NOT NULL,
	"tense" text NOT NULL,
	"person" text NOT NULL,
	"form" text NOT NULL,
	"is_irregular" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verbs" (
	"id" text PRIMARY KEY NOT NULL,
	"infinitive" text NOT NULL,
	"group" text NOT NULL,
	"auxiliary" text NOT NULL,
	"past_participle" text NOT NULL,
	"frequency_rank" integer NOT NULL,
	CONSTRAINT "verbs_infinitive_unique" UNIQUE("infinitive")
);
--> statement-breakpoint
CREATE TABLE "vocab_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"fr" text NOT NULL,
	"en" text NOT NULL,
	"lemma" text NOT NULL,
	"pos" text NOT NULL,
	"gender" text,
	"plural" text,
	"ipa" text NOT NULL,
	"cefr" text NOT NULL,
	"topic" text NOT NULL,
	"register" text NOT NULL,
	"example_fr" text NOT NULL,
	"example_en" text NOT NULL,
	"collocations" jsonb,
	"faux_ami" text,
	"mnemonic" text,
	"audio_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" text PRIMARY KEY NOT NULL,
	"ts" timestamp NOT NULL,
	"amount" integer NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_vocab_id_vocab_entries_id_fk" FOREIGN KEY ("vocab_id") REFERENCES "public"."vocab_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_grammar_point_id_grammar_points_id_fk" FOREIGN KEY ("grammar_point_id") REFERENCES "public"."grammar_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_events" ADD CONSTRAINT "exercise_events_vocab_id_vocab_entries_id_fk" FOREIGN KEY ("vocab_id") REFERENCES "public"."vocab_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_events" ADD CONSTRAINT "exercise_events_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_points" ADD CONSTRAINT "grammar_points_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_result" ADD CONSTRAINT "placement_result_recommended_unit_id_units_id_fk" FOREIGN KEY ("recommended_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_current_unit_id_units_id_fk" FOREIGN KEY ("current_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verb_conjugations" ADD CONSTRAINT "verb_conjugations_verb_id_verbs_id_fk" FOREIGN KEY ("verb_id") REFERENCES "public"."verbs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cards_vocab_track_idx" ON "cards" USING btree ("vocab_id","track") WHERE "cards"."vocab_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "cards_grammar_track_idx" ON "cards" USING btree ("grammar_point_id","track") WHERE "cards"."grammar_point_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "verb_tense_person_idx" ON "verb_conjugations" USING btree ("verb_id","tense","person");--> statement-breakpoint
CREATE UNIQUE INDEX "vocab_lemma_topic_idx" ON "vocab_entries" USING btree ("lemma","topic");