CREATE TABLE `admin_notification_states` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`notification_id` bigint NOT NULL,
	`admin_user_id` int NOT NULL,
	`read_at` timestamp,
	`archived_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_notification_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_notification_states_admin_notification_unique` UNIQUE(`admin_user_id`,`notification_id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `admin_notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`deduplication_key` varchar(190) NOT NULL,
	`kind` enum('verified_sale','payment_attention','email_failed','low_stock','return_pending','enquiry_new') NOT NULL,
	`severity` enum('critical','action','information') NOT NULL,
	`audience` enum('all','commerce','catalogue','owner_manager') NOT NULL DEFAULT 'all',
	`entity_type` varchar(80) NOT NULL,
	`entity_id` varchar(100) NOT NULL,
	`href` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_notifications_dedupe_unique` UNIQUE(`deduplication_key`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `email_template_versions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`version` int NOT NULL,
	`subject_el` varchar(240) NOT NULL,
	`subject_en` varchar(240) NOT NULL,
	`html_el` text NOT NULL,
	`html_en` text NOT NULL,
	`text_el` text NOT NULL,
	`text_en` text NOT NULL,
	`allowed_variables` json NOT NULL,
	`created_by_admin_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_template_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_template_versions_template_version_unique` UNIQUE(`template_id`,`version`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_key` varchar(100) NOT NULL,
	`name` varchar(160) NOT NULL,
	`system` boolean NOT NULL DEFAULT false,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`active_version_id` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_templates_key_unique` UNIQUE(`template_key`)
) ENGINE=InnoDB;
--> statement-breakpoint
ALTER TABLE `email_deliveries` ENGINE=InnoDB;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD `template_version_id` bigint;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD `subject_snapshot` varchar(240);--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD `text_snapshot` text;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD `html_snapshot` text;--> statement-breakpoint
ALTER TABLE `admin_notification_states` ADD CONSTRAINT `admin_notice_state_notice_fk` FOREIGN KEY (`notification_id`) REFERENCES `admin_notifications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_notification_states` ADD CONSTRAINT `admin_notice_state_user_fk` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_template_versions` ADD CONSTRAINT `email_version_template_fk` FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_template_versions` ADD CONSTRAINT `email_version_admin_fk` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_notification_states_admin_archive_idx` ON `admin_notification_states` (`admin_user_id`,`archived_at`);--> statement-breakpoint
CREATE INDEX `admin_notifications_severity_created_idx` ON `admin_notifications` (`severity`,`created_at`);--> statement-breakpoint
CREATE INDEX `email_templates_status_idx` ON `email_templates` (`status`);--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_delivery_version_fk` FOREIGN KEY (`template_version_id`) REFERENCES `email_template_versions`(`id`) ON DELETE set null ON UPDATE no action;
