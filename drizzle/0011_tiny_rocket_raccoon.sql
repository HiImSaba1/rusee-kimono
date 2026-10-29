CREATE TABLE `store_information_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`eyebrow_el` varchar(160) NOT NULL,
	`eyebrow_en` varchar(160) NOT NULL,
	`title_el` varchar(180) NOT NULL,
	`title_en` varchar(180) NOT NULL,
	`intro_el` text NOT NULL,
	`intro_en` text NOT NULL,
	`sections` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_information_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_information_pages_slug_unique` UNIQUE(`slug`)
);
