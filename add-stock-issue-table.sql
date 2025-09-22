-- Create stock_issue table if it does not exist
CREATE TABLE IF NOT EXISTS stock_issue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    issued_to VARCHAR(128),
    quantity INTEGER NOT NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);
-- Add index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_stock_issue_item_id ON stock_issue(item_id);
