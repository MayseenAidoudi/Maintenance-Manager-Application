CREATE TABLE machines_new (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    description text,
    location text NOT NULL,
    SAP_number text NOT NULL UNIQUE,
    serial_number text NOT NULL UNIQUE,
    user_id integer,
    status text NOT NULL DEFAULT 'active',
    last_calibration_date integer,
    next_calibration_date integer,
    supplier_id integer,
    calibration_interval integer,
    has_accessories integer NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

--> statement-breakpoint
INSERT INTO machines_new (id, name, description, location, SAP_number, serial_number, user_id, status, last_calibration_date, next_calibration_date, supplier_id, calibration_interval, has_accessories)
SELECT id, name, description, location, SAP_number, serial_number, user_id, status, last_calibration_date, next_calibration_date, supplier_id, calibration_interval, has_accessories
FROM machines;
--> statement-breakpoint
DROP TABLE machines;
--> statement-breakpoint
ALTER TABLE machines_new RENAME TO machines;

--> statement-breakpoint
CREATE TABLE checklist_completion_new (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    checklist_id integer,
    machine_id integer,
    user_id integer,
    completion_date integer NOT NULL DEFAULT (unixepoch()),
    notes text,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE SET NULL,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO checklist_completion_new (id, checklist_id, machine_id, user_id, completion_date, notes)
SELECT id, checklist_id, machine_id, user_id, completion_date, notes
FROM checklist_completion;

--> statement-breakpoint
DROP TABLE checklist_completion;

--> statement-breakpoint
ALTER TABLE checklist_completion_new RENAME TO checklist_completion;