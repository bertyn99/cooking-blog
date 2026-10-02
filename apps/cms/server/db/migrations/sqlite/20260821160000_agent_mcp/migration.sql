ALTER TABLE `audit_events` ADD COLUMN `actor_api_key_id` integer REFERENCES `api_keys`(`id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_events_actor_api_key_idx` ON `audit_events` (`actor_api_key_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_events_actor_user_created_idx` ON `audit_events` (`actor_user_id`, `created_at`);
