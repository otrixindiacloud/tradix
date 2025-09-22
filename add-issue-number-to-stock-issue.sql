-- Migration: Add issue_number column to stock_issue table
ALTER TABLE stock_issue ADD COLUMN issue_number VARCHAR(32);