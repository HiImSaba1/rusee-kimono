ALTER TABLE `email_deliveries` MODIFY COLUMN `template` enum('payment_confirmation','admin_new_order','fulfilment_update','contact_enquiry_notification') NOT NULL;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD `contact_enquiry_id` bigint;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD `reply_to` varchar(254);--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_deliveries_contact_enquiry_id_contact_enquiries_id_fk` FOREIGN KEY (`contact_enquiry_id`) REFERENCES `contact_enquiries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_deliveries_contact_enquiry_idx` ON `email_deliveries` (`contact_enquiry_id`);