SET default_storage_engine=InnoDB;
--> statement-breakpoint
CREATE TABLE `admin_audit_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`admin_user_id` int,
	`action` varchar(120) NOT NULL,
	`entity_type` varchar(80) NOT NULL,
	`entity_id` varchar(100),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`admin_user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_sessions_token_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`email` varchar(254),
	`password_hash` varchar(255) NOT NULL,
	`role` enum('owner','manager','fulfilment','viewer') NOT NULL DEFAULT 'owner',
	`active` boolean NOT NULL DEFAULT true,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `colours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(120) NOT NULL,
	`hex` varchar(9),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colours_id` PRIMARY KEY(`id`),
	CONSTRAINT `colours_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`phone` varchar(40),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(140) NOT NULL,
	`story` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designs_id` PRIMARY KEY(`id`),
	CONSTRAINT `designs_product_slug_unique` UNIQUE(`product_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variant_id` int NOT NULL,
	`on_hand` int NOT NULL DEFAULT 0,
	`reserved` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_variant_unique` UNIQUE(`variant_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`variant_id` int NOT NULL,
	`order_id` bigint,
	`quantity_delta` int NOT NULL,
	`reason` enum('seed','adjustment','reservation','release','sale','return') NOT NULL,
	`note` varchar(300),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_addresses` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint NOT NULL,
	`type` enum('billing','shipping') NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`company` varchar(160),
	`line1` varchar(200) NOT NULL,
	`line2` varchar(200),
	`city` varchar(120) NOT NULL,
	`region` varchar(120),
	`postal_code` varchar(24) NOT NULL,
	`country_code` varchar(2) NOT NULL,
	`phone` varchar(40),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_addresses_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_addresses_order_type_unique` UNIQUE(`order_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint NOT NULL,
	`variant_id` int,
	`sku` varchar(80) NOT NULL,
	`product_title` varchar(180) NOT NULL,
	`design_name` varchar(140) NOT NULL,
	`colour_name` varchar(120) NOT NULL,
	`size_label` varchar(80) NOT NULL,
	`unit_price_minor` int NOT NULL,
	`quantity` int NOT NULL,
	`tax_minor` int NOT NULL DEFAULT 0,
	`total_minor` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_status_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint NOT NULL,
	`from_status` varchar(40),
	`to_status` varchar(40) NOT NULL,
	`actor_type` enum('system','customer','admin','provider') NOT NULL,
	`note` varchar(300),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_status_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`order_number` varchar(40) NOT NULL,
	`customer_id` bigint,
	`email` varchar(254) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`subtotal_minor` int NOT NULL,
	`shipping_minor` int NOT NULL DEFAULT 0,
	`tax_minor` int NOT NULL DEFAULT 0,
	`discount_minor` int NOT NULL DEFAULT 0,
	`total_minor` int NOT NULL,
	`status` enum('draft','pending_payment','paid','processing','shipped','completed','payment_failed','cancelled','partially_refunded','refunded') NOT NULL DEFAULT 'draft',
	`payment_status` enum('unpaid','pending','authorized','paid','partially_refunded','refunded','failed','cancelled') NOT NULL DEFAULT 'unpaid',
	`fulfilment_status` enum('unfulfilled','processing','shipped','delivered','returned','cancelled') NOT NULL DEFAULT 'unfulfilled',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_public_id_unique` UNIQUE(`public_id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`payment_id` bigint,
	`provider` enum('fake','stripe','paypal','nbg','worldline') NOT NULL,
	`provider_event_id` varchar(190) NOT NULL,
	`event_type` varchar(120) NOT NULL,
	`payload_hash` varchar(64) NOT NULL,
	`processing_status` enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
	`sanitized_payload` json,
	`received_at` timestamp NOT NULL DEFAULT (now()),
	`processed_at` timestamp,
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_events_provider_event_unique` UNIQUE(`provider`,`provider_event_id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint NOT NULL,
	`provider` enum('fake','stripe','paypal','nbg','worldline') NOT NULL,
	`provider_payment_id` varchar(190),
	`amount_minor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('created','pending','authorized','captured','failed','cancelled','partially_refunded','refunded') NOT NULL DEFAULT 'created',
	`failure_code` varchar(100),
	`failure_message` varchar(300),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_provider_id_unique` UNIQUE(`provider`,`provider_payment_id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`design_id` int,
	`colour_id` int,
	`src` varchar(500) NOT NULL,
	`alt` varchar(240) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`design_id` int NOT NULL,
	`colour_id` int NOT NULL,
	`size_id` int NOT NULL,
	`sku` varchar(80) NOT NULL,
	`price_minor` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`),
	CONSTRAINT `product_variants_option_unique` UNIQUE(`product_id`,`design_id`,`colour_id`,`size_id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(180) NOT NULL,
	`subtitle` varchar(240),
	`description` text NOT NULL,
	`material` text,
	`care` text,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`tax_rate_bps` int NOT NULL DEFAULT 2400,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`payment_id` bigint NOT NULL,
	`provider_refund_id` varchar(190),
	`amount_minor` int NOT NULL,
	`reason` varchar(300),
	`status` enum('pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`),
	CONSTRAINT `refunds_provider_id_unique` UNIQUE(`provider_refund_id`)
);
--> statement-breakpoint
CREATE TABLE `sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(24) NOT NULL,
	`label` varchar(80) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sizes_id` PRIMARY KEY(`id`),
	CONSTRAINT `sizes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `admin_audit_events` ADD CONSTRAINT `admin_audit_events_admin_user_id_admin_users_id_fk` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_user_id_admin_users_id_fk` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `designs` ADD CONSTRAINT `designs_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_addresses` ADD CONSTRAINT `order_addresses_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_events` ADD CONSTRAINT `order_status_events_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_events` ADD CONSTRAINT `payment_events_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_design_id_designs_id_fk` FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_colour_id_colours_id_fk` FOREIGN KEY (`colour_id`) REFERENCES `colours`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_design_id_designs_id_fk` FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_colour_id_colours_id_fk` FOREIGN KEY (`colour_id`) REFERENCES `colours`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_size_id_sizes_id_fk` FOREIGN KEY (`size_id`) REFERENCES `sizes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_audit_events_actor_idx` ON `admin_audit_events` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `designs_product_idx` ON `designs` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_movements_variant_idx` ON `inventory_movements` (`variant_id`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_status_events_order_idx` ON `order_status_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_email_idx` ON `orders` (`email`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_variants_product_idx` ON `product_variants` (`product_id`);
