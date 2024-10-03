DROP TABLE `calibration_history`;--> statement-breakpoint
ALTER TABLE `machines` DROP COLUMN `last_calibration_date`;--> statement-breakpoint
ALTER TABLE `machines` DROP COLUMN `next_calibration_date`;