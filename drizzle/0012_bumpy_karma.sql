CREATE TABLE `design_fact_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`design_id` int NOT NULL,
	`category` enum('composition','measurements_fit','opacity','care','provenance','final_media') NOT NULL,
	`status` enum('pending','approved') NOT NULL DEFAULT 'pending',
	`approved_by_admin_id` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_fact_approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `design_fact_approvals_design_category_unique` UNIQUE(`design_id`,`category`)
);
--> statement-breakpoint
ALTER TABLE `design_fact_approvals` ADD CONSTRAINT `design_fact_approvals_design_id_designs_id_fk` FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `design_fact_approvals` ADD CONSTRAINT `design_fact_approvals_approved_by_admin_id_admin_users_id_fk` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `design_fact_approvals_status_idx` ON `design_fact_approvals` (`status`);