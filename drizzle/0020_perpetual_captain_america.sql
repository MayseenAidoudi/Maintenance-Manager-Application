CREATE TABLE machine_categories_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER, 
  name TEXT NOT NULL,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);
--> statement-breakpoint

INSERT INTO machine_categories_new (id, machine_id, name)
SELECT id, machine_id, name
FROM machine_categories;
--> statement-breakpoint

DROP TABLE machine_categories;

--> statement-breakpoint
ALTER TABLE machine_categories_new RENAME TO machine_categories;