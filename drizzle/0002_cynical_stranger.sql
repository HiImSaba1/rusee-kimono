CREATE TABLE `email_deliveries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint,
	`template` enum('payment_confirmation','admin_new_order','fulfilment_update') NOT NULL,
	`recipient` varchar(254) NOT NULL,
	`idempotency_key` varchar(190) NOT NULL,
	`status` enum('queued','sending','sent','failed') NOT NULL DEFAULT 'queued',
	`attempt_count` int NOT NULL DEFAULT 0,
	`provider_message_id` varchar(255),
	`last_error` varchar(300),
	`sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_deliveries_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_deliveries_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_deliveries_status_idx` ON `email_deliveries` (`status`,`created_at`);