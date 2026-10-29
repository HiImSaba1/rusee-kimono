ALTER TABLE `orders` ADD `reservation_expires_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `reservation_released_at` timestamp;--> statement-breakpoint
CREATE INDEX `orders_reservation_expiry_idx` ON `orders` (`status`,`reservation_expires_at`);