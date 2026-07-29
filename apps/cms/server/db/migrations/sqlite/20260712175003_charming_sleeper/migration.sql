PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_nutrition` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`recipe_id` integer NOT NULL UNIQUE,
	`lipides` text,
	`proteine` text,
	`sucre` text,
	`calories` text,
	`glucides` text,
	`sodium` text
);
--> statement-breakpoint
INSERT INTO `__new_nutrition`(`id`, `recipe_id`, `lipides`, `proteine`, `sucre`, `calories`, `glucides`, `sodium`) SELECT `id`, `recipe_id`, `lipides`, `proteine`, `sucre`, `calories`, `glucides`, `sodium` FROM `nutrition`;--> statement-breakpoint
DROP TABLE `nutrition`;--> statement-breakpoint
ALTER TABLE `__new_nutrition` RENAME TO `nutrition`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`email` text NOT NULL UNIQUE,
	`username` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `email`, `username`, `password_hash`, `role`, `created_at`, `updated_at`) SELECT `id`, `email`, `username`, `password_hash`, `role`, `created_at`, `updated_at` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `nutrition_recipe_id_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `users_email_unique`;