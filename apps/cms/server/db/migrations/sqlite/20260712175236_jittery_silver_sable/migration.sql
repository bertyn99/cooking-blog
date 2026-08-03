CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`actor_user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`correlation_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_audit_events_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_by_user_id` integer,
	`reason` text NOT NULL,
	CONSTRAINT `fk_content_revisions_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `legacy_strapi_map` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`dest_table` text NOT NULL,
	`dest_id` text NOT NULL,
	`migrated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`user_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_used_at` text,
	`revoked_at` text,
	`user_agent` text,
	`ip_hash` text,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `scheduled_at` text;--> statement-breakpoint
ALTER TABLE `category_articles` ADD `scheduled_at` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `deactivated_at` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`title` text NOT NULL,
	`content` text,
	`slug` text NOT NULL,
	`cover_blob_pathname` text,
	`category_id` integer,
	`first_published_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`scheduled_at` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_articles_cover_blob_pathname_blobs_pathname_fk` FOREIGN KEY (`cover_blob_pathname`) REFERENCES `blobs`(`pathname`),
	CONSTRAINT `fk_articles_category_id_category_articles_id_fk` FOREIGN KEY (`category_id`) REFERENCES `category_articles`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_articles`(`id`, `title`, `content`, `slug`, `cover_blob_pathname`, `category_id`, `first_published_at`, `status`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`, `deleted_at`, `created_at`, `updated_at`) SELECT `id`, `title`, `content`, `slug`, `cover_blob_pathname`, `category_id`, `first_published_at`, `status`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`, `deleted_at`, `created_at`, `updated_at` FROM `articles`;--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_category_blobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`category_id` integer NOT NULL,
	`blob_pathname` text NOT NULL,
	`sort_order` integer,
	CONSTRAINT `category_blobs_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_category_blobs_blob_pathname_blobs_pathname_fk` FOREIGN KEY (`blob_pathname`) REFERENCES `blobs`(`pathname`)
);
--> statement-breakpoint
INSERT INTO `__new_category_blobs`(`id`, `category_id`, `blob_pathname`, `sort_order`) SELECT `id`, `category_id`, `blob_pathname`, `sort_order` FROM `category_blobs`;--> statement-breakpoint
DROP TABLE `category_blobs`;--> statement-breakpoint
ALTER TABLE `__new_category_blobs` RENAME TO `category_blobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`title` text NOT NULL,
	`intro` text,
	`slug` text NOT NULL,
	`cover_blob_pathname` text,
	`category_id` integer,
	`step` text,
	`difficulty` text DEFAULT 'easy',
	`time` integer,
	`first_published_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`scheduled_at` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_recipes_cover_blob_pathname_blobs_pathname_fk` FOREIGN KEY (`cover_blob_pathname`) REFERENCES `blobs`(`pathname`),
	CONSTRAINT `fk_recipes_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_recipes`(`id`, `title`, `intro`, `slug`, `cover_blob_pathname`, `category_id`, `step`, `difficulty`, `time`, `first_published_at`, `status`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`, `deleted_at`, `created_at`, `updated_at`) SELECT `id`, `title`, `intro`, `slug`, `cover_blob_pathname`, `category_id`, `step`, `difficulty`, `time`, `first_published_at`, `status`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`, `deleted_at`, `created_at`, `updated_at` FROM `recipes`;--> statement-breakpoint
DROP TABLE `recipes`;--> statement-breakpoint
ALTER TABLE `__new_recipes` RENAME TO `recipes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`recipe_id` integer NOT NULL,
	`star` integer,
	`content` text,
	`author_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_reviews_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_reviews`(`id`, `recipe_id`, `star`, `content`, `author_name`, `created_at`) SELECT `id`, `recipe_id`, `star`, `content`, `author_name`, `created_at` FROM `reviews`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_social_meta` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`seo_id` integer NOT NULL,
	`social_network` text,
	`title` text,
	`description` text,
	`image_blob_pathname` text,
	CONSTRAINT `social_meta_seo_id_seo_id_fk` FOREIGN KEY (`seo_id`) REFERENCES `seo`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_social_meta_image_blob_pathname_blobs_pathname_fk` FOREIGN KEY (`image_blob_pathname`) REFERENCES `blobs`(`pathname`)
);
--> statement-breakpoint
INSERT INTO `__new_social_meta`(`id`, `seo_id`, `social_network`, `title`, `description`, `image_blob_pathname`) SELECT `id`, `seo_id`, `social_network`, `title`, `description`, `image_blob_pathname` FROM `social_meta`;--> statement-breakpoint
DROP TABLE `social_meta`;--> statement-breakpoint
ALTER TABLE `__new_social_meta` RENAME TO `social_meta`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_locale_idx` ON `articles` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `articles_status_idx` ON `articles` (`status`);--> statement-breakpoint
CREATE INDEX `articles_locale_idx` ON `articles` (`locale`);--> statement-breakpoint
CREATE INDEX `articles_locale_group_idx` ON `articles` (`locale_group_id`);--> statement-breakpoint
CREATE INDEX `articles_published_at_idx` ON `articles` (`published_at`);--> statement-breakpoint
CREATE INDEX `category_blobs_category_id_idx` ON `category_blobs` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_locale_idx` ON `recipes` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `recipes_status_idx` ON `recipes` (`status`);--> statement-breakpoint
CREATE INDEX `recipes_locale_idx` ON `recipes` (`locale`);--> statement-breakpoint
CREATE INDEX `recipes_locale_group_idx` ON `recipes` (`locale_group_id`);--> statement-breakpoint
CREATE INDEX `recipes_published_at_idx` ON `recipes` (`published_at`);--> statement-breakpoint
CREATE INDEX `idx_reviews_recipe_id` ON `reviews` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_status` ON `reviews` (`status`);--> statement-breakpoint
CREATE INDEX `idx_social_meta_seo_id` ON `social_meta` (`seo_id`);--> statement-breakpoint
CREATE INDEX `audit_events_entity_idx` ON `audit_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_events_created_at_idx` ON `audit_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `content_revisions_entity_idx` ON `content_revisions` (`content_type`,`content_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_strapi_map_source_idx` ON `legacy_strapi_map` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);