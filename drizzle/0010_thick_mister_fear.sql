CREATE TABLE `commerce_rate_limits` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`scope` enum('order','payment') NOT NULL,
	`rate_limit_key` varchar(64) NOT NULL,
	`window_started_at` timestamp NOT NULL DEFAULT (now()),
	`submission_count` int NOT NULL DEFAULT 0,
	`blocked_count` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerce_rate_limits_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerce_rate_limits_scope_key_unique` UNIQUE(`scope`,`rate_limit_key`)
);
--> statement-breakpoint
CREATE INDEX `commerce_rate_limits_window_idx` ON `commerce_rate_limits` (`window_started_at`);