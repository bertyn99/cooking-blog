CREATE TABLE `recipe_utensils` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`affiliate_url` text,
	`sort_order` integer DEFAULT 0
);
