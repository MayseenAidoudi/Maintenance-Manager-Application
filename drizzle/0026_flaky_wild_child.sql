CREATE TABLE `checklist_item_completion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`checklist_completion_id` integer,
	`checklist_item_id` integer,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`checklist_completion_id`) REFERENCES `checklist_completion`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`checklist_item_id`) REFERENCES `checklist_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `generic_accessories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer,
	`machine_group_id` integer,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`notes` text,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`machine_group_id`) REFERENCES `machine_groups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `special_accessories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer,
	`machine_group_id` integer,
	`name` text NOT NULL,
	`length` integer,
	`diameter` integer,
	`angle` integer,
	`quantity` integer DEFAULT 1 NOT NULL,
	`notes` text,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`machine_group_id`) REFERENCES `machine_groups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
DROP TABLE `accessories`;--> statement-breakpoint
ALTER TABLE `checklist_completion` ADD `status` text;--> statement-breakpoint
ALTER TABLE `checklists` ADD `status` text;--> statement-breakpoint
ALTER TABLE `users` ADD `ticket_permissions` integer DEFAULT false NOT NULL;