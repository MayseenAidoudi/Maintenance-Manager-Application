CREATE TABLE `spare_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer,
	`name` text NOT NULL,
	`part_number` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`reorder_level` integer DEFAULT 1 NOT NULL,
	`location` text,
	`supplier_id` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spare_parts_part_number_unique` ON `spare_parts` (`part_number`);