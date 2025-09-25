-- Migration: Add created_by column to shipments table (nullable)
-- Reason: Application code/log auditing expects shipments.created_by; runtime error showed column missing
-- Safe to run multiple times (IF NOT EXISTS guards)

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

-- Optional: index to speed up queries / audit lookups by creator
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON shipments(created_by);

-- Verification (PostgreSQL):
-- \d+ shipments;  -- should now list created_by column

-- Rollback (manual, only if needed and no data relies on it):
-- ALTER TABLE shipments DROP COLUMN created_by;

-- Notes:
-- 1. Column left NULLABLE because current creation flow may not always supply a user context.
-- 2. If later you enforce authentication, update code to set createdBy and then apply NOT NULL constraint:
--    ALTER TABLE shipments ALTER COLUMN created_by SET NOT NULL;
-- 3. Drizzle schema uses camelCase createdBy mapping to snake_case created_by.