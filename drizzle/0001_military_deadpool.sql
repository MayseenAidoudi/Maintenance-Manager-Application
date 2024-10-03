
CREATE TABLE checklist_completion_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL,
  machine_id INTEGER REFERENCES machines(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  completion_date INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--> statement-breakpoint
INSERT INTO checklist_completion_new (id, checklist_id, machine_id, user_id, completion_date)
SELECT id, checklist_id, machine_id, user_id, completion_date
FROM checklist_completion;

--> statement-breakpoint
DROP TABLE checklist_completion;
--> statement-breakpoint
ALTER TABLE checklist_completion_new RENAME TO checklist_completion;
