CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`email` text,
	`phone_number` text
);
--> statement-breakpoint
CREATE TABLE machines_new (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    description text,
    location text NOT NULL,
    SAP_number text NOT NULL UNIQUE,
    serial_number text NOT NULL UNIQUE,
    user_id integer NOT NULL,
    status text NOT NULL DEFAULT 'active',
    last_calibration_date integer,
    next_calibration_date integer,
    supplier_id integer,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

--> statement-breakpoint
INSERT INTO machines_new (id, name, description, location, SAP_number, serial_number, user_id, status, last_calibration_date, next_calibration_date)
SELECT id, name, description, location, SAP_number, serial_number, user_id, status, last_calibration_date, next_calibration_date
FROM machines;

--> statement-breakpoint
DROP TABLE machines;
--> statement-breakpoint
ALTER TABLE machines_new RENAME TO machines;
