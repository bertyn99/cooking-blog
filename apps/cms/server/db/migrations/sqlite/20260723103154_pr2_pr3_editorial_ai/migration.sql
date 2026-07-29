CREATE TABLE `content_generation_runs` (
	`id` text PRIMARY KEY,
	`target_type` text NOT NULL,
	`article_id` integer,
	`recipe_id` integer,
	`artifact_prefix` text NOT NULL,
	`requested_by_user_id` integer,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`next_attempt_at` text,
	`last_error` text,
	`lease_token` text,
	`lease_expires_at` text,
	`heartbeat_at` text,
	`reviewed_at` text,
	`reviewed_by_user_id` integer,
	`reviewed_article_version` integer,
	`reviewed_recipe_version` integer,
	`review_note` text,
	`started_at` text,
	`finished_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_content_generation_runs_article_id_articles_id_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_content_generation_runs_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_content_generation_runs_requested_by_user_id_users_id_fk` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_content_generation_runs_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `content_generation_run_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`run_id` text NOT NULL,
	`step_key` text NOT NULL,
	`ordinal` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`idempotency_key` text NOT NULL,
	`artifact_key` text,
	`last_error` text,
	`started_at` text,
	`finished_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_content_generation_run_steps_run_id_content_generation_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `content_generation_runs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `content_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`blob_pathname` text NOT NULL,
	`role` text DEFAULT 'gallery' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`path_prefix` text NOT NULL,
	`parent_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`parent_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recipe_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`recipe_id` integer NOT NULL,
	`title` text,
	`instruction` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_recipe_steps_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`status_code` integer DEFAULT 301 NOT NULL,
	`locale` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_content_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `excerpt` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `requires_human_review` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` ADD `excerpt` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `prep_time_minutes` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `cook_time_minutes` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `servings` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `excerpt` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `recipes` ADD `requires_human_review` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `seo` ADD `canonical_url` text;--> statement-breakpoint
CREATE UNIQUE INDEX `generation_steps_run_key_idx` ON `content_generation_run_steps` (`run_id`,`step_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `generation_steps_idempotency_idx` ON `content_generation_run_steps` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `generation_steps_run_ordinal_idx` ON `content_generation_run_steps` (`run_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `generation_runs_dispatch_idx` ON `content_generation_runs` (`status`,`next_attempt_at`,`lease_expires_at`);--> statement-breakpoint
CREATE INDEX `generation_runs_article_idx` ON `content_generation_runs` (`article_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `generation_runs_recipe_idx` ON `content_generation_runs` (`recipe_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `content_media_content_idx` ON `content_media` (`content_type`,`content_id`);--> statement-breakpoint
CREATE INDEX `content_media_blob_pathname_idx` ON `content_media` (`blob_pathname`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_folders_path_prefix_idx` ON `media_folders` (`path_prefix`);--> statement-breakpoint
CREATE INDEX `media_folders_parent_id_idx` ON `media_folders` (`parent_id`);--> statement-breakpoint
CREATE INDEX `navigation_items_parent_id_idx` ON `navigation_items` (`parent_id`);--> statement-breakpoint
CREATE INDEX `navigation_items_locale_idx` ON `navigation_items` (`locale`);--> statement-breakpoint
CREATE INDEX `recipe_steps_recipe_id_idx` ON `recipe_steps` (`recipe_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `redirects_from_path_locale_idx` ON `redirects` (`from_path`,`locale`);--> statement-breakpoint
CREATE INDEX `redirects_from_path_idx` ON `redirects` (`from_path`);--> statement-breakpoint
CREATE UNIQUE INDEX `content_tags_unique_idx` ON `content_tags` (`content_type`,`content_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `content_tags_content_idx` ON `content_tags` (`content_type`,`content_id`);--> statement-breakpoint
CREATE INDEX `content_tags_tag_id_idx` ON `content_tags` (`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_locale_active_idx` ON `tags` (`slug`,`locale`) WHERE ("tags"."deleted_at" is null);--> statement-breakpoint
CREATE INDEX `tags_deleted_at_idx` ON `tags` (`deleted_at`);