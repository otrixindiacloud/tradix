-- SQL migration for receipt-returns table
CREATE TABLE IF NOT EXISTS receipt_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(32) NOT NULL UNIQUE,
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipt_headers(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    return_reason VARCHAR(255) NOT NULL,
    return_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Returned', 'Credited')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for items returned in each receipt return
CREATE TABLE IF NOT EXISTS receipt_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_return_id UUID NOT NULL REFERENCES receipt_returns(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_returned NUMERIC(12,2) NOT NULL CHECK (quantity_returned > 0),
    unit_cost NUMERIC(12,2),
    total_cost NUMERIC(12,2),
    return_reason VARCHAR(255) NOT NULL,
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_receipt_returns_goods_receipt_id ON receipt_returns(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_return_items_receipt_return_id ON receipt_return_items(receipt_return_id);
