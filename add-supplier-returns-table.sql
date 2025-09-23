-- Migration: Create supplier_returns and supplier_return_items tables for receipt returns
CREATE TABLE IF NOT EXISTS supplier_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(255) NOT NULL UNIQUE,
    supplier_id UUID REFERENCES suppliers(id),
    goods_receipt_id UUID REFERENCES goods_receipts(id),
    return_date TIMESTAMPTZ DEFAULT NOW(),
    return_reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_return_value DECIMAL(12,2) DEFAULT 0,
    debit_note_number VARCHAR(255),
    debit_note_generated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_return_id UUID REFERENCES supplier_returns(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_returned INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    return_reason TEXT,
    condition_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);