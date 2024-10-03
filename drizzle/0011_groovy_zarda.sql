CREATE TABLE `accessories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer NOT NULL,
	`name` text NOT NULL,
	`length` integer,
	`diameter` integer,
	`angle` integer,
	`notes` text,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade
);
