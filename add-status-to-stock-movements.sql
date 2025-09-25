-- Migration: add status column to stock_movements
-- Adds a nullable status column to align with application logic (Draft, Pending Approval, Approved, In Transit, Completed, Cancelled)
-- Safe to run multiple times with IF NOT EXISTS guard.
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS status text;

-- Optional backfill: set status based on movement_type where currently NULL
UPDATE stock_movements
SET status = CASE movement_type
  WHEN 'Transfer' THEN 'In Transit'
  WHEN 'Receipt' THEN 'Completed'
  WHEN 'Issue' THEN 'Completed'
  WHEN 'Adjustment' THEN 'Completed'
  ELSE 'Draft'
END
WHERE status IS NULL;