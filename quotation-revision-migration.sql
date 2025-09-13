-- SQL Migration for Quotation Revision Fields
-- Add these columns to the quotations table if they don't exist

-- Check if columns exist first, then add them
DO $$ 
BEGIN
    -- Add parent quotation ID for revision linking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='parent_quotation_id') THEN
        ALTER TABLE quotations ADD COLUMN parent_quotation_id UUID REFERENCES quotations(id);
    END IF;

    -- Add revision reason field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='revision_reason') THEN
        ALTER TABLE quotations ADD COLUMN revision_reason TEXT;
    END IF;

    -- Add superseded timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='superseded_at') THEN
        ALTER TABLE quotations ADD COLUMN superseded_at TIMESTAMP;
    END IF;

    -- Add superseded by user
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='superseded_by') THEN
        ALTER TABLE quotations ADD COLUMN superseded_by UUID REFERENCES users(id);
    END IF;

    -- Add superseded flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='is_superseded') THEN
        ALTER TABLE quotations ADD COLUMN is_superseded BOOLEAN DEFAULT FALSE;
    END IF;

    RAISE NOTICE 'Quotation revision columns have been added successfully';
END $$;
