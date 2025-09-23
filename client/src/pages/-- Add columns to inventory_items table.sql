-- Add columns to inventory_items table
ALTER TABLE inventory_items
  ADD COLUMN total_stock INTEGER DEFAULT 0,
  ADD COLUMN reserved_quantity INTEGER DEFAULT 0,
  ADD COLUMN available_quantity INTEGER DEFAULT 0,
  ADD COLUMN storage_location VARCHAR(255);