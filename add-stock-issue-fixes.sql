-- Add missing columns to stock_issue table
ALTER TABLE IF EXISTS stock_issue
ADD COLUMN IF NOT EXISTS issue_number VARCHAR(32),
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'Draft';

-- Add stock_issue_status enum type if not exists
DO $$ BEGIN
    CREATE TYPE stock_issue_status AS ENUM ('Draft', 'Issued', 'Applied', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_stock_issue_issue_number ON stock_issue(issue_number);
CREATE INDEX IF NOT EXISTS idx_stock_issue_status ON stock_issue(status);
