ALTER TABLE `glossary_terms` ADD `parent_id` integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `glossary_terms_parent_id_idx` ON `glossary_terms` (`parent_id`);
