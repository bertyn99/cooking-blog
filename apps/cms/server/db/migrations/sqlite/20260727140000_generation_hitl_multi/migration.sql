ALTER TABLE `content_generation_runs` ADD COLUMN `parent_run_id` text;--> statement-breakpoint
ALTER TABLE `content_generation_runs` ADD COLUMN `run_kind` text DEFAULT 'unit' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_generation_runs` ADD COLUMN `review_round` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `generation_runs_parent_idx` ON `content_generation_runs` (`parent_run_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `generation_runs_review_inbox_idx` ON `content_generation_runs` (`status`,`requested_by_user_id`,`updated_at`);
