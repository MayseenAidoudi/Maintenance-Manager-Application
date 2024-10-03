
CREATE TABLE machine_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    has_accessories INTEGER NOT NULL DEFAULT 0
);

--> statement-breakpoint
ALTER TABLE machines
ADD COLUMN machine_group_id INTEGER REFERENCES machine_groups(id) ON DELETE SET NULL;

--> statement-breakpoint
ALTER TABLE accessories
ADD COLUMN machine_group_id INTEGER REFERENCES machine_groups(id) ON DELETE SET NULL;

--> statement-breakpoint
ALTER TABLE machine_documents
ADD COLUMN machine_group_id INTEGER REFERENCES machine_groups(id) ON DELETE SET NULL;

--> statement-breakpoint
ALTER TABLE checklists
ADD COLUMN machine_group_id INTEGER REFERENCES machine_groups(id) ON DELETE SET NULL;
