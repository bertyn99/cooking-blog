CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_locale_idx` ON `articles` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `articles_status_idx` ON `articles` (`status`);--> statement-breakpoint
CREATE INDEX `articles_locale_idx` ON `articles` (`locale`);--> statement-breakpoint
CREATE INDEX `articles_locale_group_idx` ON `articles` (`locale_group_id`);--> statement-breakpoint
CREATE INDEX `articles_published_at_idx` ON `articles` (`published_at`);--> statement-breakpoint
CREATE TABLE `blobs` (
	`pathname` text PRIMARY KEY NOT NULL,
	`original_name` text,
	`mime_type` text,
	`size` integer,
	`width` integer,
	`height` integer,
	`alt_text` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`desc` text,
	`slug` text NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` text,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_locale_idx` ON `categories` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `categories_status_idx` ON `categories` (`status`);--> statement-breakpoint
CREATE INDEX `categories_locale_idx` ON `categories` (`locale`);--> statement-breakpoint
CREATE INDEX `categories_locale_group_idx` ON `categories` (`locale_group_id`);--> statement-breakpoint
CREATE TABLE `category_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` text,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_articles_slug_locale_idx` ON `category_articles` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `category_articles_status_idx` ON `category_articles` (`status`);--> statement-breakpoint
CREATE INDEX `category_articles_locale_idx` ON `category_articles` (`locale`);--> statement-breakpoint
CREATE INDEX `category_articles_locale_group_idx` ON `category_articles` (`locale_group_id`);--> statement-breakpoint
CREATE TABLE `category_blobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`blob_pathname` text NOT NULL,
	`sort_order` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `category_blobs_category_id_idx` ON `category_blobs` (`category_id`);--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`name` text NOT NULL,
	`qty` real,
	`unit` text DEFAULT 'none',
	`sort_order` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `nutrition` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`lipides` text,
	`proteine` text,
	`sucre` text,
	`calories` text,
	`glucides` text,
	`sodium` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nutrition_recipe_id_unique` ON `nutrition` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`slug` text NOT NULL,
	`content` text,
	`parent_id` integer,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` text,
	`scheduled_at` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`locale_group_id` text,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_locale_idx` ON `pages` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `pages_status_idx` ON `pages` (`status`);--> statement-breakpoint
CREATE INDEX `pages_locale_idx` ON `pages` (`locale`);--> statement-breakpoint
CREATE INDEX `pages_locale_group_idx` ON `pages` (`locale_group_id`);--> statement-breakpoint
CREATE INDEX `pages_parent_id_idx` ON `pages` (`parent_id`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_locale_idx` ON `recipes` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `recipes_status_idx` ON `recipes` (`status`);--> statement-breakpoint
CREATE INDEX `recipes_locale_idx` ON `recipes` (`locale`);--> statement-breakpoint
CREATE INDEX `recipes_locale_group_idx` ON `recipes` (`locale_group_id`);--> statement-breakpoint
CREATE INDEX `recipes_published_at_idx` ON `recipes` (`published_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`star` integer,
	`content` text,
	`author_name` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_recipe_id` ON `reviews` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `seo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer,
	`recipe_id` integer,
	`page_id` integer,
	`description` text,
	`keywords` text,
	`meta_robots` text DEFAULT 'index, follow'
);
--> statement-breakpoint
CREATE TABLE `social_meta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seo_id` integer NOT NULL,
	`social_network` text,
	`title` text,
	`description` text,
	`image_blob_pathname` text,
	FOREIGN KEY (`seo_id`) REFERENCES `seo`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_social_meta_seo_id` ON `social_meta` (`seo_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);