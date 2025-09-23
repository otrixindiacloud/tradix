-- Migration: Add material_request table
-- This table tracks material requests for inventory/production

CREATE TABLE IF NOT EXISTS material_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(32) NOT NULL UNIQUE,
    requested_by VARCHAR(128) NOT NULL,
    department_id UUID,
    request_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for faster lookup by request_number
CREATE INDEX IF NOT EXISTS idx_material_request_number ON material_request(request_number);
