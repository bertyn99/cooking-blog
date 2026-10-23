CREATE TABLE `pinterest_pins` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`image_path` text NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`not_before` text NOT NULL,
	`pin_id` text,
	`board_id` text,
	`title` text,
	`description` text,
	`error` text,
	`created_at` text NOT NULL,
	`pinned_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pinterest_pins_content_image_uq` ON `pinterest_pins` (`content_type`,`content_id`,`image_path`);--> statement-breakpoint
CREATE INDEX `pinterest_pins_due_idx` ON `pinterest_pins` (`status`,`not_before`);--> statement-breakpoint
CREATE INDEX `pinterest_pins_content_idx` ON `pinterest_pins` (`content_type`,`content_id`);