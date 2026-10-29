ALTER TABLE `product_images` ADD `size_id` int;--> statement-breakpoint
ALTER TABLE `product_images` ADD `alt_el` varchar(240);--> statement-breakpoint
ALTER TABLE `product_images` ADD `alt_en` varchar(240);--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_size_id_sizes_id_fk` FOREIGN KEY (`size_id`) REFERENCES `sizes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_images_design_size_idx` ON `product_images` (`design_id`,`size_id`,`sort_order`);