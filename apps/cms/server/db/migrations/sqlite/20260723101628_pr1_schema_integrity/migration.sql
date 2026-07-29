PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_recipe_utensils` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`affiliate_url` text,
	`sort_order` integer DEFAULT 0,
	CONSTRAINT `fk_recipe_utensils_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_recipe_utensils`(`id`, `recipe_id`, `name`, `note`, `affiliate_url`, `sort_order`) SELECT `id`, `recipe_id`, `name`, `note`, `affiliate_url`, `sort_order` FROM `recipe_utensils`;
--> statement-breakpoint
DROP TABLE `recipe_utensils`;
--> statement-breakpoint
ALTER TABLE `__new_recipe_utensils` RENAME TO `recipe_utensils`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
ALTER TABLE `articles` ADD `created_by_user_id` integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `articles` ADD `updated_by_user_id` integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `pages` ADD `first_published_at` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `version` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `pages` ADD `created_by_user_id` integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `pages` ADD `updated_by_user_id` integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `recipes` ADD `created_by_user_id` integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `recipes` ADD `updated_by_user_id` integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`recipe_id` integer NOT NULL,
	`name` text NOT NULL,
	`qty` real,
	`unit` text DEFAULT 'none',
	`sort_order` integer DEFAULT 0,
	CONSTRAINT `fk_ingredients_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_ingredients`(`id`, `recipe_id`, `name`, `qty`, `unit`, `sort_order`) SELECT `id`, `recipe_id`, `name`, `qty`, `unit`, `sort_order` FROM `ingredients`;
--> statement-breakpoint
DROP TABLE `ingredients`;
--> statement-breakpoint
ALTER TABLE `__new_ingredients` RENAME TO `ingredients`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_nutrition` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`recipe_id` integer NOT NULL UNIQUE,
	`lipides` text,
	`proteine` text,
	`sucre` text,
	`calories` text,
	`glucides` text,
	`sodium` text,
	CONSTRAINT `fk_nutrition_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_nutrition`(`id`, `recipe_id`, `lipides`, `proteine`, `sucre`, `calories`, `glucides`, `sodium`) SELECT `id`, `recipe_id`, `lipides`, `proteine`, `sucre`, `calories`, `glucides`, `sodium` FROM `nutrition`;
--> statement-breakpoint
DROP TABLE `nutrition`;
--> statement-breakpoint
ALTER TABLE `__new_nutrition` RENAME TO `nutrition`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_seo` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`article_id` integer,
	`recipe_id` integer,
	`page_id` integer,
	`description` text,
	`keywords` text,
	`meta_robots` text DEFAULT 'index, follow',
	CONSTRAINT `fk_seo_article_id_articles_id_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_seo_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_seo_page_id_pages_id_fk` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_seo`(`id`, `article_id`, `recipe_id`, `page_id`, `description`, `keywords`, `meta_robots`) SELECT `id`, `article_id`, `recipe_id`, `page_id`, `description`, `keywords`, `meta_robots` FROM `seo`;
--> statement-breakpoint
DROP TABLE `seo`;
--> statement-breakpoint
ALTER TABLE `__new_seo` RENAME TO `seo`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`title` text,
	`slug` text NOT NULL,
	`content` text,
	`parent_id` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`first_published_at` text,
	`published_at` text,
	`scheduled_at` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_user_id` integer,
	`updated_by_user_id` integer,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `pages_parent_id_pages_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_pages_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_pages_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_pages`(`id`, `name`, `title`, `slug`, `content`, `parent_id`, `status`, `first_published_at`, `published_at`, `scheduled_at`, `locale`, `locale_group_id`, `version`, `created_by_user_id`, `updated_by_user_id`, `deleted_at`, `created_at`, `updated_at`) SELECT `id`, `name`, `title`, `slug`, `content`, `parent_id`, `status`, NULL, `published_at`, `scheduled_at`, `locale`, `locale_group_id`, 1, NULL, NULL, `deleted_at`, `created_at`, `updated_at` FROM `pages`;
--> statement-breakpoint
DROP TABLE `pages`;
--> statement-breakpoint
ALTER TABLE `__new_pages` RENAME TO `pages`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
DROP INDEX IF EXISTS `articles_slug_locale_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `categories_slug_locale_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `category_articles_slug_locale_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `pages_slug_locale_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `recipes_slug_locale_idx`;
--> statement-breakpoint
CREATE INDEX `ingredients_recipe_id_idx` ON `ingredients` (`recipe_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_article_id_idx` ON `seo` (`article_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_recipe_id_idx` ON `seo` (`recipe_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_page_id_idx` ON `seo` (`page_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_locale_active_idx` ON `pages` (`slug`,`locale`) WHERE ("pages"."deleted_at" is null);
--> statement-breakpoint
CREATE INDEX `pages_deleted_at_idx` ON `pages` (`deleted_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_locale_active_idx` ON `articles` (`slug`,`locale`) WHERE ("articles"."deleted_at" is null);
--> statement-breakpoint
CREATE INDEX `articles_deleted_at_idx` ON `articles` (`deleted_at`);
--> statement-breakpoint
CREATE INDEX `articles_category_id_idx` ON `articles` (`category_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_locale_active_idx` ON `categories` (`slug`,`locale`) WHERE ("categories"."deleted_at" is null);
--> statement-breakpoint
CREATE INDEX `categories_deleted_at_idx` ON `categories` (`deleted_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_articles_slug_locale_active_idx` ON `category_articles` (`slug`,`locale`) WHERE ("category_articles"."deleted_at" is null);
--> statement-breakpoint
CREATE INDEX `category_articles_deleted_at_idx` ON `category_articles` (`deleted_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_revisions_version_idx` ON `content_revisions` (`content_type`,`content_id`,`version`);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_locale_active_idx` ON `recipes` (`slug`,`locale`) WHERE ("recipes"."deleted_at" is null);
--> statement-breakpoint
CREATE INDEX `recipes_deleted_at_idx` ON `recipes` (`deleted_at`);
--> statement-breakpoint
CREATE INDEX `recipes_category_id_idx` ON `recipes` (`category_id`);
--> statement-breakpoint
CREATE INDEX `recipe_utensils_recipe_id_idx` ON `recipe_utensils` (`recipe_id`);
