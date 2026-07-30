CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`criteria` text NOT NULL,
	`tier` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_slug_unique` ON `achievements` (`slug`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`vocab_id` text,
	`grammar_point_id` text,
	`track` text NOT NULL,
	`state` text DEFAULT 'new' NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`retrievability` real DEFAULT 1 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`last_review` integer,
	`due_date` integer NOT NULL,
	`is_leech` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`vocab_id`) REFERENCES `vocab_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`grammar_point_id`) REFERENCES `grammar_points`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cards_vocab_track_idx` ON `cards` (`vocab_id`,`track`) WHERE "cards"."vocab_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `cards_grammar_track_idx` ON `cards` (`grammar_point_id`,`track`) WHERE "cards"."grammar_point_id" is not null;--> statement-breakpoint
CREATE TABLE `grammar_points` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`explanation_en` text NOT NULL,
	`examples` text NOT NULL,
	`common_mistakes` text NOT NULL,
	`why_it_trips` text NOT NULL,
	`search_tags` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grammar_points_slug_unique` ON `grammar_points` (`slug`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'locked' NOT NULL,
	`crown_level` integer DEFAULT 0 NOT NULL,
	`best_accuracy` real,
	`last_completed_at` integer,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_lesson_id_unique` ON `lesson_progress` (`lesson_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`order` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`skill_focus` text NOT NULL,
	`topic_slug` text,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `levels` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `placement_result` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`score` real NOT NULL,
	`recommended_unit_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	`answers` text NOT NULL,
	FOREIGN KEY (`recommended_unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`current_unit_id` text,
	`placement_done` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`current_unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reading_passages` (
	`id` text PRIMARY KEY NOT NULL,
	`cefr` text NOT NULL,
	`topic` text NOT NULL,
	`title` text NOT NULL,
	`body_fr` text NOT NULL,
	`questions` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`ts` integer NOT NULL,
	`grade` text NOT NULL,
	`correct` integer NOT NULL,
	`latency_ms` integer NOT NULL,
	`hint_used` integer DEFAULT false NOT NULL,
	`stability_before` real NOT NULL,
	`stability_after` real NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`cefr` text NOT NULL,
	`fr` text NOT NULL,
	`en` text NOT NULL,
	`audio_text` text NOT NULL,
	`used_for` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`minutes_studied` real DEFAULT 0 NOT NULL,
	`exercises_completed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_logs_date_unique` ON `session_logs` (`date`);--> statement-breakpoint
CREATE TABLE `settings` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`daily_goal_xp` integer DEFAULT 50 NOT NULL,
	`hearts_enabled` integer DEFAULT false NOT NULL,
	`target_retention` real DEFAULT 0.9 NOT NULL,
	`new_cards_per_day` integer DEFAULT 15 NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`reduced_motion` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unit_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`status` text DEFAULT 'locked' NOT NULL,
	`boss_score` real,
	`mastered_at` integer,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unit_progress_unit_id_unique` ON `unit_progress` (`unit_id`);--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`order` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`focus` text NOT NULL,
	`topics` text NOT NULL,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `units_slug_unique` ON `units` (`slug`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievements_achievement_id_unique` ON `user_achievements` (`achievement_id`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`freezes_available` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`weekend_amulet_active` integer DEFAULT false NOT NULL,
	`hearts` integer DEFAULT 5 NOT NULL,
	`hearts_refill_at` integer
);
--> statement-breakpoint
CREATE TABLE `verb_conjugations` (
	`id` text PRIMARY KEY NOT NULL,
	`verb_id` text NOT NULL,
	`tense` text NOT NULL,
	`person` text NOT NULL,
	`form` text NOT NULL,
	`is_irregular` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`verb_id`) REFERENCES `verbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verb_tense_person_idx` ON `verb_conjugations` (`verb_id`,`tense`,`person`);--> statement-breakpoint
CREATE TABLE `verbs` (
	`id` text PRIMARY KEY NOT NULL,
	`infinitive` text NOT NULL,
	`group` text NOT NULL,
	`auxiliary` text NOT NULL,
	`past_participle` text NOT NULL,
	`frequency_rank` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verbs_infinitive_unique` ON `verbs` (`infinitive`);--> statement-breakpoint
CREATE TABLE `vocab_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`fr` text NOT NULL,
	`en` text NOT NULL,
	`lemma` text NOT NULL,
	`pos` text NOT NULL,
	`gender` text,
	`plural` text,
	`ipa` text NOT NULL,
	`cefr` text NOT NULL,
	`topic` text NOT NULL,
	`register` text NOT NULL,
	`example_fr` text NOT NULL,
	`example_en` text NOT NULL,
	`collocations` text,
	`faux_ami` text,
	`mnemonic` text,
	`audio_text` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vocab_lemma_topic_idx` ON `vocab_entries` (`lemma`,`topic`);--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`ts` integer NOT NULL,
	`amount` integer NOT NULL,
	`source` text NOT NULL
);
