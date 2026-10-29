CREATE TABLE `automation_jobs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`deduplication_key` varchar(190) NOT NULL,
	`kind` enum('email_dispatch','notification_sync','reservation_release') NOT NULL,
	`status` enum('queued','processing','retry_wait','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`payload` json,
	`run_at` timestamp NOT NULL DEFAULT (now()),
	`attempt_count` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 5,
	`locked_at` timestamp,
	`locked_by` varchar(100),
	`last_error` varchar(300),
	`completed_at` timestamp,
	`cancelled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_job_public_uq` UNIQUE(`public_id`),
	CONSTRAINT `automation_job_dedupe_uq` UNIQUE(`deduplication_key`)
);
--> statement-breakpoint
ALTER TABLE `order_addresses` ADD `document_type` enum('receipt','invoice');--> statement-breakpoint
ALTER TABLE `order_addresses` ADD `vat_number` varchar(20);--> statement-breakpoint
ALTER TABLE `order_addresses` ADD `tax_office` varchar(120);--> statement-breakpoint
ALTER TABLE `order_addresses` ADD `business_activity` varchar(180);--> statement-breakpoint
CREATE INDEX `automation_job_due_idx` ON `automation_jobs` (`status`,`run_at`);--> statement-breakpoint
CREATE INDEX `automation_job_lock_idx` ON `automation_jobs` (`status`,`locked_at`);