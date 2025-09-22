-- Migration: Add status field to stock_issue table
ALTER TABLE stock_issue ADD COLUMN status VARCHAR(32);