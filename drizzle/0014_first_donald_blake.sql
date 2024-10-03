
CREATE TABLE preventive_maintenance_tickets_new (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    machine_id integer,
    user_id integer,
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL,
    completion_notes text,
    scheduled_date integer NOT NULL,
    completed_date integer,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO preventive_maintenance_tickets_new (
    id, machine_id, user_id, title, description, status, completion_notes,
    scheduled_date, completed_date, created_at, updated_at
)
SELECT 
    id, machine_id, user_id, title, description, status, completion_notes,
    scheduled_date, completed_date, created_at, updated_at
FROM preventive_maintenance_tickets;
--> statement-breakpoint
DROP TABLE preventive_maintenance_tickets;
--> statement-breakpoint
ALTER TABLE preventive_maintenance_tickets_new RENAME TO preventive_maintenance_tickets;
--> statement-breakpoint
CREATE INDEX idx_preventive_maintenance_tickets_machine_id ON preventive_maintenance_tickets(machine_id);

--> statement-breakpoint
CREATE INDEX idx_preventive_maintenance_tickets_user_id ON preventive_maintenance_tickets(user_id);