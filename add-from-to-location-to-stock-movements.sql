-- Migration: add from_location and to_location to stock_movements
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS from_location text;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS to_location text;

-- No destructive changes; existing rows will have NULL which UI will handle.
