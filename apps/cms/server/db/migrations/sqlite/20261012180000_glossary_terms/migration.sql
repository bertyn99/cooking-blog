-- Idempotent glossary migration.
-- Local D1 / Alchemy retries may already have `glossary_terms` (or the
-- ingredient/seo columns) from a previous apply. SQLite/D1 has no
-- `ADD COLUMN IF NOT EXISTS`, so optional columns are padded via
-- `NATURAL LEFT JOIN` then tables are rebuilt.
CREATE TABLE IF NOT EXISTS `glossary_terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`content` text,
	`cover_blob_pathname` text,
	`cover_alt_text` text,
	`cover_description` text,
	`icon_key` text,
	`utensil_category` text,
	`brand` text,
	`amazon_asin` text,
	`partner_url` text,
	`partner_name` text,
	`related_article_id` integer,
	`sort_key` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`created_by_user_id` integer,
	`updated_by_user_id` integer,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `glossary_terms_cover_blob_pathname_blobs_pathname_fk` FOREIGN KEY (`cover_blob_pathname`) REFERENCES `blobs`(`pathname`),
	CONSTRAINT `glossary_terms_related_article_id_articles_id_fk` FOREIGN KEY (`related_article_id`) REFERENCES `articles`(`id`) ON DELETE SET NULL,
	CONSTRAINT `glossary_terms_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `glossary_terms_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `glossary_terms_slug_locale_active_idx` ON `glossary_terms` (`slug`, `locale`) WHERE `deleted_at` IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `glossary_terms_kind_locale_sort_key_idx` ON `glossary_terms` (`kind`, `locale`, `sort_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `glossary_terms_status_idx` ON `glossary_terms` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `glossary_terms_deleted_at_idx` ON `glossary_terms` (`deleted_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `glossary_terms_related_article_id_idx` ON `glossary_terms` (`related_article_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `glossary_aliases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`glossary_term_id` integer NOT NULL,
	`alias` text NOT NULL,
	`alias_normalized` text NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `glossary_aliases_glossary_term_id_glossary_terms_id_fk` FOREIGN KEY (`glossary_term_id`) REFERENCES `glossary_terms`(`id`) ON DELETE CASCADE
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `glossary_aliases_alias_locale_idx` ON `glossary_aliases` (`alias_normalized`, `locale`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `glossary_aliases_term_id_idx` ON `glossary_aliases` (`glossary_term_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `__seo_add_glossary_term_id`;--> statement-breakpoint
CREATE TABLE `__seo_add_glossary_term_id` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer,
	`recipe_id` integer,
	`page_id` integer,
	`glossary_term_id` integer,
	`description` text,
	`keywords` text,
	`canonical_url` text,
	`meta_robots` text DEFAULT 'index, follow',
	CONSTRAINT `fk_seo_article_id_articles_id_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_seo_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_seo_page_id_pages_id_fk` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE,
	CONSTRAINT `seo_glossary_term_id_glossary_terms_id_fk` FOREIGN KEY (`glossary_term_id`) REFERENCES `glossary_terms`(`id`) ON DELETE CASCADE
);--> statement-breakpoint
INSERT INTO `__seo_add_glossary_term_id` (
	`id`, `article_id`, `recipe_id`, `page_id`, `glossary_term_id`,
	`description`, `keywords`, `canonical_url`, `meta_robots`
)
SELECT
	`id`, `article_id`, `recipe_id`, `page_id`, `glossary_term_id`,
	`description`, `keywords`, `canonical_url`, `meta_robots`
FROM (
	SELECT * FROM `seo`
	NATURAL LEFT JOIN (SELECT CAST(NULL AS INTEGER) AS `glossary_term_id` WHERE 0)
);--> statement-breakpoint
DROP TABLE `seo`;--> statement-breakpoint
ALTER TABLE `__seo_add_glossary_term_id` RENAME TO `seo`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `seo_article_id_idx` ON `seo` (`article_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `seo_recipe_id_idx` ON `seo` (`recipe_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `seo_page_id_idx` ON `seo` (`page_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `seo_glossary_term_id_idx` ON `seo` (`glossary_term_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP TABLE IF EXISTS `__ingredient_name_map`;--> statement-breakpoint
DROP TABLE IF EXISTS `__ingredients_wide`;--> statement-breakpoint
CREATE TABLE `__ingredients_wide` AS
SELECT * FROM `ingredients`
NATURAL LEFT JOIN (SELECT CAST(NULL AS TEXT) AS `name` WHERE 0)
NATURAL LEFT JOIN (SELECT CAST(NULL AS INTEGER) AS `glossary_term_id` WHERE 0)
NATURAL LEFT JOIN (SELECT CAST(NULL AS TEXT) AS `note` WHERE 0);--> statement-breakpoint
CREATE TABLE `__ingredient_name_map` (
	`ingredient_id` integer PRIMARY KEY NOT NULL,
	`recipe_id` integer NOT NULL,
	`qty` real,
	`unit` text,
	`sort_order` integer,
	`display_name` text NOT NULL,
	`note` text,
	`sort_key` text NOT NULL
);--> statement-breakpoint
INSERT INTO `__ingredient_name_map` (
	`ingredient_id`, `recipe_id`, `qty`, `unit`, `sort_order`, `display_name`, `note`, `sort_key`
)
SELECT
	`id`,
	`recipe_id`,
	`qty`,
	`unit`,
	`sort_order`,
	CASE
		WHEN trim(`name`) LIKE '%)' AND instr(trim(`name`), '(') > 0
			THEN trim(substr(trim(`name`), 1, instr(trim(`name`), '(') - 1))
		ELSE trim(`name`)
	END,
	CASE
		WHEN trim(`name`) LIKE '%)' AND instr(trim(`name`), '(') > 0
			THEN trim(substr(trim(`name`), instr(trim(`name`), '(') + 1, length(trim(`name`)) - instr(trim(`name`), '(') - 1))
		ELSE NULL
	END,
	lower(trim(
		CASE
			WHEN trim(`name`) LIKE '%)' AND instr(trim(`name`), '(') > 0
				THEN trim(substr(trim(`name`), 1, instr(trim(`name`), '(') - 1))
			ELSE trim(`name`)
		END
	))
FROM `__ingredients_wide`
WHERE trim(COALESCE(`name`, '')) != '';--> statement-breakpoint
UPDATE `__ingredient_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(replace(replace(`sort_key`, 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 'É', 'e'), 'È', 'e'), 'Ê', 'e'), 'Ë', 'e');--> statement-breakpoint
UPDATE `__ingredient_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(`sort_key`, 'à', 'a'), 'â', 'a'), 'ä', 'a'), 'À', 'a'), 'Â', 'a'), 'Ä', 'a');--> statement-breakpoint
UPDATE `__ingredient_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(`sort_key`, 'ù', 'u'), 'û', 'u'), 'ü', 'u'), 'Ù', 'u'), 'Û', 'u'), 'Ü', 'u');--> statement-breakpoint
UPDATE `__ingredient_name_map` SET `sort_key` = replace(replace(replace(replace(`sort_key`, 'ô', 'o'), 'ö', 'o'), 'Ô', 'o'), 'Ö', 'o');--> statement-breakpoint
UPDATE `__ingredient_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(replace(replace(`sort_key`, 'î', 'i'), 'ï', 'i'), 'Î', 'i'), 'Ï', 'i'), 'ç', 'c'), 'Ç', 'c'), 'œ', 'oe'), 'Œ', 'oe');--> statement-breakpoint
UPDATE `__ingredient_name_map` SET `sort_key` = replace(replace(`sort_key`, 'æ', 'ae'), 'Æ', 'ae');--> statement-breakpoint
INSERT INTO `glossary_terms` (
	`kind`, `name`, `slug`, `sort_key`, `status`, `locale`, `created_at`, `updated_at`
)
SELECT
	'ingredient',
	mapped.`display_name`,
	CASE WHEN mapped.`rn` = 1 THEN mapped.`slug` ELSE mapped.`slug` || '-' || mapped.`rn` END,
	mapped.`sort_key`,
	'draft',
	'fr',
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM (
	SELECT
		`display_name`,
		`sort_key`,
		`slug`,
		row_number() OVER (PARTITION BY `slug` ORDER BY `sort_key`) AS `rn`
	FROM (
		SELECT
			min(`display_name`) AS `display_name`,
			`sort_key`,
			trim(replace(replace(replace(replace(replace(replace(`sort_key`, ' ', '-'), '''', ''), '’', ''), '.', ''), ',', ''), '/', '-'), '-') AS `slug`
		FROM `__ingredient_name_map`
		WHERE `sort_key` != ''
		GROUP BY `sort_key`
	)
) mapped
WHERE mapped.`slug` != ''
AND NOT EXISTS (
	SELECT 1 FROM `glossary_terms` existing
	WHERE existing.`kind` = 'ingredient'
		AND existing.`locale` = 'fr'
		AND existing.`deleted_at` IS NULL
		AND existing.`sort_key` = mapped.`sort_key`
);--> statement-breakpoint
INSERT INTO `seo` (`glossary_term_id`, `meta_robots`)
SELECT `id`, 'noindex,follow'
FROM `glossary_terms`
WHERE `kind` = 'ingredient'
AND NOT EXISTS (
	SELECT 1 FROM `seo` existing WHERE existing.`glossary_term_id` = `glossary_terms`.`id`
);--> statement-breakpoint
DROP TABLE IF EXISTS `__ingredients_glossary`;--> statement-breakpoint
CREATE TABLE `__ingredients_glossary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`glossary_term_id` integer NOT NULL,
	`qty` real,
	`unit` text DEFAULT 'none',
	`note` text,
	`sort_order` integer DEFAULT 0,
	CONSTRAINT `ingredients_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
	CONSTRAINT `ingredients_glossary_term_id_glossary_terms_id_fk` FOREIGN KEY (`glossary_term_id`) REFERENCES `glossary_terms`(`id`) ON DELETE RESTRICT
);--> statement-breakpoint
INSERT INTO `__ingredients_glossary` (
	`id`, `recipe_id`, `glossary_term_id`, `qty`, `unit`, `note`, `sort_order`
)
SELECT
	w.`id`,
	w.`recipe_id`,
	COALESCE(w.`glossary_term_id`, t.`id`),
	w.`qty`,
	w.`unit`,
	COALESCE(nullif(w.`note`, ''), nullif(m.`note`, '')),
	w.`sort_order`
FROM `__ingredients_wide` w
LEFT JOIN `__ingredient_name_map` m
	ON m.`ingredient_id` = w.`id`
LEFT JOIN `glossary_terms` t
	ON t.`kind` = 'ingredient'
	AND t.`locale` = 'fr'
	AND t.`deleted_at` IS NULL
	AND t.`sort_key` = m.`sort_key`
WHERE COALESCE(w.`glossary_term_id`, t.`id`) IS NOT NULL;--> statement-breakpoint
DROP TABLE `ingredients`;--> statement-breakpoint
ALTER TABLE `__ingredients_glossary` RENAME TO `ingredients`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ingredients_recipe_id_idx` ON `ingredients` (`recipe_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ingredients_glossary_term_id_idx` ON `ingredients` (`glossary_term_id`);--> statement-breakpoint
DROP TABLE `__ingredient_name_map`;--> statement-breakpoint
DROP TABLE `__ingredients_wide`;--> statement-breakpoint
DROP TABLE IF EXISTS `__utensil_name_map`;--> statement-breakpoint
DROP TABLE IF EXISTS `__utensils_wide`;--> statement-breakpoint
CREATE TABLE `__utensils_wide` AS
SELECT * FROM `recipe_utensils`
NATURAL LEFT JOIN (SELECT CAST(NULL AS TEXT) AS `name` WHERE 0)
NATURAL LEFT JOIN (SELECT CAST(NULL AS INTEGER) AS `glossary_term_id` WHERE 0)
NATURAL LEFT JOIN (SELECT CAST(NULL AS TEXT) AS `note` WHERE 0)
NATURAL LEFT JOIN (SELECT CAST(NULL AS TEXT) AS `affiliate_url` WHERE 0);--> statement-breakpoint
CREATE TABLE `__utensil_name_map` (
	`utensil_id` integer PRIMARY KEY NOT NULL,
	`recipe_id` integer NOT NULL,
	`note` text,
	`affiliate_url` text,
	`sort_order` integer,
	`display_name` text NOT NULL,
	`sort_key` text NOT NULL
);--> statement-breakpoint
INSERT INTO `__utensil_name_map` (
	`utensil_id`, `recipe_id`, `note`, `affiliate_url`, `sort_order`, `display_name`, `sort_key`
)
SELECT
	`id`,
	`recipe_id`,
	`note`,
	`affiliate_url`,
	`sort_order`,
	CASE
		WHEN trim(`name`) LIKE '%)' AND instr(trim(`name`), '(') > 0
			THEN trim(substr(trim(`name`), 1, instr(trim(`name`), '(') - 1))
		ELSE trim(`name`)
	END,
	lower(trim(
		CASE
			WHEN trim(`name`) LIKE '%)' AND instr(trim(`name`), '(') > 0
				THEN trim(substr(trim(`name`), 1, instr(trim(`name`), '(') - 1))
			ELSE trim(`name`)
		END
	))
FROM `__utensils_wide`
WHERE trim(COALESCE(`name`, '')) != '';--> statement-breakpoint
UPDATE `__utensil_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(replace(replace(`sort_key`, 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 'É', 'e'), 'È', 'e'), 'Ê', 'e'), 'Ë', 'e');--> statement-breakpoint
UPDATE `__utensil_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(`sort_key`, 'à', 'a'), 'â', 'a'), 'ä', 'a'), 'À', 'a'), 'Â', 'a'), 'Ä', 'a');--> statement-breakpoint
UPDATE `__utensil_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(`sort_key`, 'ù', 'u'), 'û', 'u'), 'ü', 'u'), 'Ù', 'u'), 'Û', 'u'), 'Ü', 'u');--> statement-breakpoint
UPDATE `__utensil_name_map` SET `sort_key` = replace(replace(replace(replace(`sort_key`, 'ô', 'o'), 'ö', 'o'), 'Ô', 'o'), 'Ö', 'o');--> statement-breakpoint
UPDATE `__utensil_name_map` SET `sort_key` = replace(replace(replace(replace(replace(replace(replace(replace(`sort_key`, 'î', 'i'), 'ï', 'i'), 'Î', 'i'), 'Ï', 'i'), 'ç', 'c'), 'Ç', 'c'), 'œ', 'oe'), 'Œ', 'oe');--> statement-breakpoint
UPDATE `__utensil_name_map` SET `sort_key` = replace(replace(`sort_key`, 'æ', 'ae'), 'Æ', 'ae');--> statement-breakpoint
INSERT INTO `glossary_terms` (
	`kind`, `name`, `slug`, `sort_key`, `status`, `locale`, `partner_url`, `created_at`, `updated_at`
)
SELECT
	'ustensile',
	mapped.`display_name`,
	CASE WHEN mapped.`rn` = 1 THEN mapped.`slug` ELSE mapped.`slug` || '-' || mapped.`rn` END,
	mapped.`sort_key`,
	'draft',
	'fr',
	mapped.`partner_url`,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM (
	SELECT
		`display_name`,
		`sort_key`,
		`slug`,
		`partner_url`,
		row_number() OVER (PARTITION BY `slug` ORDER BY `sort_key`) AS `rn`
	FROM (
		SELECT
			min(`display_name`) AS `display_name`,
			`sort_key`,
			trim(replace(replace(replace(replace(replace(replace(`sort_key`, ' ', '-'), '''', ''), '’', ''), '.', ''), ',', ''), '/', '-'), '-') AS `slug`,
			max(nullif(trim(`affiliate_url`), '')) AS `partner_url`
		FROM `__utensil_name_map`
		WHERE `sort_key` != ''
		GROUP BY `sort_key`
	)
) mapped
WHERE mapped.`slug` != ''
AND NOT EXISTS (
	SELECT 1 FROM `glossary_terms` existing
	WHERE existing.`kind` = 'ustensile'
		AND existing.`locale` = 'fr'
		AND existing.`deleted_at` IS NULL
		AND existing.`sort_key` = mapped.`sort_key`
);--> statement-breakpoint
INSERT INTO `seo` (`glossary_term_id`, `meta_robots`)
SELECT `id`, 'noindex,follow'
FROM `glossary_terms`
WHERE `kind` = 'ustensile'
AND NOT EXISTS (
	SELECT 1 FROM `seo` existing WHERE existing.`glossary_term_id` = `glossary_terms`.`id`
);--> statement-breakpoint
DROP TABLE IF EXISTS `__utensils_glossary`;--> statement-breakpoint
CREATE TABLE `__utensils_glossary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`glossary_term_id` integer NOT NULL,
	`note` text,
	`sort_order` integer DEFAULT 0,
	CONSTRAINT `recipe_utensils_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
	CONSTRAINT `recipe_utensils_glossary_term_id_glossary_terms_id_fk` FOREIGN KEY (`glossary_term_id`) REFERENCES `glossary_terms`(`id`) ON DELETE RESTRICT
);--> statement-breakpoint
INSERT INTO `__utensils_glossary` (
	`id`, `recipe_id`, `glossary_term_id`, `note`, `sort_order`
)
SELECT
	w.`id`,
	w.`recipe_id`,
	COALESCE(w.`glossary_term_id`, t.`id`),
	COALESCE(nullif(w.`note`, ''), m.`note`),
	w.`sort_order`
FROM `__utensils_wide` w
LEFT JOIN `__utensil_name_map` m
	ON m.`utensil_id` = w.`id`
LEFT JOIN `glossary_terms` t
	ON t.`kind` = 'ustensile'
	AND t.`locale` = 'fr'
	AND t.`deleted_at` IS NULL
	AND t.`sort_key` = m.`sort_key`
WHERE COALESCE(w.`glossary_term_id`, t.`id`) IS NOT NULL;--> statement-breakpoint
DROP TABLE `recipe_utensils`;--> statement-breakpoint
ALTER TABLE `__utensils_glossary` RENAME TO `recipe_utensils`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `recipe_utensils_recipe_id_idx` ON `recipe_utensils` (`recipe_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `recipe_utensils_glossary_term_id_idx` ON `recipe_utensils` (`glossary_term_id`);--> statement-breakpoint
DROP TABLE `__utensil_name_map`;--> statement-breakpoint
DROP TABLE `__utensils_wide`;
