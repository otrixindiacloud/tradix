-- Migration: Create requisitions & requisition_items tables (plus enums)
-- Purpose: Backend for /api/material-requests endpoint (UI uses requisitions model)
-- Safe to run multiple times (guards for existing types/tables)

-- (Simplified) Rely on native IF NOT EXISTS instead of DO blocks for better migration engine compatibility
CREATE TYPE IF NOT EXISTS requisition_priority AS ENUM ('Low','Medium','High','Urgent');
CREATE TYPE IF NOT EXISTS requisition_status AS ENUM ('Draft','Pending Approval','Approved','Rejected','Processing','Completed','Cancelled');
CREATE TYPE IF NOT EXISTS requisition_item_urgency AS ENUM ('Standard','Urgent');

-- 2. Create requisitions table
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    priority requisition_priority NOT NULL,
    status requisition_status DEFAULT 'Draft',
    request_date TIMESTAMP DEFAULT NOW(),
    required_date TIMESTAMP NOT NULL,
    approved_by VARCHAR(255),
    approved_date TIMESTAMP,
    total_estimated_cost NUMERIC(12,2) NOT NULL,
    justification TEXT NOT NULL,
    notes TEXT,
    item_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Index for fast lookup by number & status filters
CREATE INDEX IF NOT EXISTS idx_requisitions_number ON requisitions(requisition_number);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_priority ON requisitions(priority);

-- 4. Create requisition_items table
CREATE TABLE IF NOT EXISTS requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    estimated_cost NUMERIC(10,2) NOT NULL,
    specification TEXT,
    preferred_supplier VARCHAR(255),
    urgency requisition_item_urgency DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requisition_items_req_id ON requisition_items(requisition_id);

-- Create/replace helper function (idempotent)
CREATE OR REPLACE FUNCTION requisitions_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS trg_requisitions_set_updated_at ON requisitions;
CREATE TRIGGER trg_requisitions_set_updated_at
BEFORE UPDATE ON requisitions
FOR EACH ROW
EXECUTE FUNCTION requisitions_set_updated_at();

-- 6. NOTE: The legacy material_request table (if present) is separate/minimal. The UI now maps
--        /api/material-requests to the richer requisitions model. Keep both if already in use.

-- Done.