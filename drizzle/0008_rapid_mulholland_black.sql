CREATE TABLE preventive_maintenance_tickets_new (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  machine_id integer REFERENCES machines(id) ON DELETE SET NULL, -- Updated onDelete behavior
  user_id integer REFERENCES users(id),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  completion_notes text,
  scheduled_date integer NOT NULL,
  completed_date integer,
  created_at integer NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at integer NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --> statement-breakpoint
INSERT INTO preventive_maintenance_tickets_new (id, machine_id, user_id, title, description, status, completion_notes, scheduled_date, completed_date, created_at, updated_at)
SELECT id, machine_id, user_id, title, description, status, completion_notes, scheduled_date, completed_date, created_at, updated_at
FROM preventive_maintenance_tickets;

-- --> statement-breakpoint
DROP TABLE preventive_maintenance_tickets;

-- --> statement-breakpoint
ALTER TABLE preventive_maintenance_tickets_new RENAME TO preventive_maintenance_tickets;
