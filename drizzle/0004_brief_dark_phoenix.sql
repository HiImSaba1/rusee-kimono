CREATE TABLE `contact_enquiries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`name` varchar(140) NOT NULL,
	`email` varchar(254) NOT NULL,
	`subject` enum('order_question','fit_sizing','press','stockist','collaboration') NOT NULL,
	`order_number` varchar(40),
	`message` text NOT NULL,
	`locale` enum('el','en') NOT NULL DEFAULT 'el',
	`status` enum('new','read','replied','closed') NOT NULL DEFAULT 'new',
	`rate_limit_key` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_enquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `contact_enquiries_public_id_unique` UNIQUE(`public_id`)
);
--> statement-breakpoint
CREATE TABLE `contact_enquiry_rate_limits` (
	`rate_limit_key` varchar(64) NOT NULL,
	`window_started_at` timestamp NOT NULL DEFAULT (now()),
	`submission_count` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_enquiry_rate_limits_rate_limit_key` PRIMARY KEY(`rate_limit_key`)
);
--> statement-breakpoint
CREATE INDEX `contact_enquiries_status_created_idx` ON `contact_enquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `contact_enquiries_email_idx` ON `contact_enquiries` (`email`);