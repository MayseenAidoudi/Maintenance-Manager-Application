CREATE TABLE `calibration_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer NOT NULL,
	`calibration_date` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `machines` ADD `last_calibration_date` integer;--> statement-breakpoint
ALTER TABLE `machines` ADD `next_calibration_date` integer;