CREATE TABLE `privacy_requests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`subject_email` varchar(254) NOT NULL,
	`request_type` enum('export','erasure') NOT NULL,
	`status` enum('pending','completed','blocked_legal_review','failed') NOT NULL DEFAULT 'pending',
	`requested_by_admin_id` int,
	`result` json,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privacy_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `privacy_requests_public_id_unique` UNIQUE(`public_id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `privacy_retention_runs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`mode` enum('dry_run','apply') NOT NULL,
	`retention_days` int NOT NULL,
	`eligible_count` int NOT NULL DEFAULT 0,
	`anonymized_count` int NOT NULL DEFAULT 0,
	`status` enum('completed','disabled','failed') NOT NULL,
	`detail` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privacy_retention_runs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB;
--> statement-breakpoint
ALTER TABLE `contact_enquiries` ADD `anonymized_at` timestamp;--> statement-breakpoint
ALTER TABLE `privacy_requests` ADD CONSTRAINT `privacy_requests_requested_by_admin_id_admin_users_id_fk` FOREIGN KEY (`requested_by_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `privacy_requests_email_created_idx` ON `privacy_requests` (`subject_email`,`created_at`);
