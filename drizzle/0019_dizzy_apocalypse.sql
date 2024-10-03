CREATE TABLE `machine_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint


CREATE TABLE preventive_maintenance_tickets_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id INTEGER REFERENCES machines(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    completion_notes TEXT,
    scheduled_date INTEGER NOT NULL,
    completed_date INTEGER,
    created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
    critical INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES machine_categories(id) ON DELETE SET NULL
);
--> statement-breakpoint

INSERT INTO preventive_maintenance_tickets_new
SELECT id, machine_id, user_id, title, description, status, completion_notes, scheduled_date, completed_date, created_at, updated_at, critical, NULL
FROM preventive_maintenance_tickets;
--> statement-breakpoint

DROP TABLE preventive_maintenance_tickets;
--> statement-breakpoint

ALTER TABLE preventive_maintenance_tickets_new RENAME TO preventive_maintenance_tickets;

