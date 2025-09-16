-- Alternative Fix: Add "Pending" to Supplier LPO Status Enum
-- This script adds "Pending" as a valid enum value instead of changing existing data

-- First, check current enum values
SELECT 'Current supplier_lpo_status enum values:' as info;
SELECT unnest(enum_range(NULL::supplier_lpo_status)) as enum_value;

-- Add "Pending" to the enum (this is safe - enum values can only be added, not removed easily)
ALTER TYPE supplier_lpo_status ADD VALUE IF NOT EXISTS 'Pending';

-- Verify the enum now includes "Pending"
SELECT 'Updated supplier_lpo_status enum values:' as info;
SELECT unnest(enum_range(NULL::supplier_lpo_status)) as enum_value;

-- Check the status distribution
SELECT 'Status distribution after adding Pending to enum:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM supplier_lpos 
GROUP BY status 
ORDER BY status;

-- Verify no more invalid enum errors
SELECT 'Verification - all status values should now be valid:' as info;
SELECT CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: No invalid status values found'
    ELSE CONCAT('WARNING: ', COUNT(*), ' records still have invalid status values')
END as result
FROM supplier_lpos 
WHERE status NOT IN ('Draft', 'Sent', 'Confirmed', 'Received', 'Cancelled', 'Pending');