CREATE TABLE `return_requests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`order_id` bigint NOT NULL,
	`reason` enum('size_fit','changed_mind','damaged','incorrect_item','other') NOT NULL,
	`customer_note` varchar(500) NOT NULL,
	`status` enum('pending','approved','rejected','received','closed') NOT NULL DEFAULT 'pending',
	`admin_note` varchar(500),
	`reviewed_by_admin_id` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `return_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `return_requests_public_id_unique` UNIQUE(`public_id`),
	CONSTRAINT `return_requests_order_unique` UNIQUE(`order_id`)
);
--> statement-breakpoint
ALTER TABLE `return_requests` ADD CONSTRAINT `return_requests_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `return_requests` ADD CONSTRAINT `return_requests_reviewed_by_admin_id_admin_users_id_fk` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `return_requests_status_created_idx` ON `return_requests` (`status`,`created_at`);