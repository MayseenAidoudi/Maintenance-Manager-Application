
CREATE TABLE spare_parts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  part_number TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 1,
  reorder_level INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  supplier TEXT,  -- Change to TEXT type
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

--> statement-breakpoint
INSERT INTO spare_parts_new (id, machine_id, name, part_number, quantity, reorder_level, location)
SELECT id, machine_id, name, part_number, quantity, reorder_level, location
FROM spare_parts;
--> statement-breakpoint
DROP TABLE spare_parts;

--> statement-breakpoint
ALTER TABLE spare_parts_new RENAME TO spare_parts;
