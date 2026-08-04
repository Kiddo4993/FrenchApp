CREATE TABLE `exercise_events` (
	`id` text PRIMARY KEY NOT NULL,
	`ts` integer NOT NULL,
	`kind` text NOT NULL,
	`correct` integer NOT NULL,
	`vocab_id` text,
	`lesson_id` text,
	FOREIGN KEY (`vocab_id`) REFERENCES `vocab_entries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null
);
