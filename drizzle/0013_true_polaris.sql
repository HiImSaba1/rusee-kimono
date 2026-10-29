CREATE TABLE `shipments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint NOT NULL,
	`carrier_name` varchar(120) NOT NULL,
	`tracking_code` varchar(120) NOT NULL,
	`tracking_url` varchar(500),
	`created_by_admin_id` int,
	`shipped_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipments_order_unique` UNIQUE(`order_id`),
	CONSTRAINT `shipments_carrier_tracking_unique` UNIQUE(`carrier_name`,`tracking_code`)
);
--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_created_by_admin_id_admin_users_id_fk` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;