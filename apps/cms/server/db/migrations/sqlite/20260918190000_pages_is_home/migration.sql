-- SQLite/D1 has no `ADD COLUMN IF NOT EXISTS`. Rebuild so this is safe:
-- - prod: pages has no is_home → table is recreated with the column
-- - local retry: pages already has is_home → copy listed columns, default is_home to 0
PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `__pages_add_is_home`;--> statement-breakpoint
CREATE TABLE `__pages_add_is_home` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`title` text,
	`slug` text NOT NULL,
	`content` text,
	`excerpt` text,
	`parent_id` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`first_published_at` text,
	`published_at` text,
	`scheduled_at` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`is_home` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_user_id` integer,
	`updated_by_user_id` integer,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `pages_parent_id_pages_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_pages_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_pages_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);--> statement-breakpoint
INSERT INTO `__pages_add_is_home` (
	`id`, `name`, `title`, `slug`, `content`, `excerpt`, `parent_id`, `status`,
	`first_published_at`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`,
	`version`, `created_by_user_id`, `updated_by_user_id`, `deleted_at`, `created_at`, `updated_at`
)
SELECT
	`id`, `name`, `title`, `slug`, `content`, `excerpt`, `parent_id`, `status`,
	`first_published_at`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`,
	`version`, `created_by_user_id`, `updated_by_user_id`, `deleted_at`, `created_at`, `updated_at`
FROM `pages`;--> statement-breakpoint
DROP TABLE `pages`;--> statement-breakpoint
ALTER TABLE `__pages_add_is_home` RENAME TO `pages`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `pages_slug_locale_active_idx` ON `pages` (`slug`, `locale`) WHERE `deleted_at` IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pages_status_idx` ON `pages` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pages_locale_idx` ON `pages` (`locale`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pages_locale_group_idx` ON `pages` (`locale_group_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pages_parent_id_idx` ON `pages` (`parent_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pages_deleted_at_idx` ON `pages` (`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `pages_is_home_locale_active_idx` ON `pages` (`locale`) WHERE `is_home` = 1 AND `deleted_at` IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=ON;
