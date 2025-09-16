-- Fix Supplier LPO Status Enum Issues
-- This script addresses the invalid enum value "Pending" for supplier_lpo_status

-- First, let's see what status values currently exist in the database
SELECT 'Current status values in supplier_lpos table:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM supplier_lpos 
WHERE status IS NOT NULL 
GROUP BY status 
ORDER BY status;

-- Check for any records with invalid status values
SELECT 'Records with potentially invalid status values:' as info;
SELECT id, lpo_number, status 
FROM supplier_lpos 
WHERE status NOT IN ('Draft', 'Sent', 'Confirmed', 'Received', 'Cancelled')
LIMIT 10;

-- Option 1: Update "Pending" to "Sent" (most logical mapping)
-- This assumes "Pending" should be mapped to "Sent" status
UPDATE supplier_lpos 
SET status = 'Sent' 
WHERE status = 'Pending';

-- Check how many records were updated
SELECT 'Records updated from Pending to Sent:' as info;
SELECT COUNT(*) as updated_count 
FROM supplier_lpos 
WHERE status = 'Sent';

-- Option 2: If you want to add "Pending" to the enum instead, uncomment the following:
-- Note: This requires adding the enum value to the PostgreSQL enum type first

-- Add "Pending" to the supplier_lpo_status enum
-- ALTER TYPE supplier_lpo_status ADD VALUE 'Pending';

-- Verify the enum now includes all needed values
SELECT 'Current enum values for supplier_lpo_status:' as info;
SELECT unnest(enum_range(NULL::supplier_lpo_status)) as enum_value;

-- Final verification - check all status values are now valid
SELECT 'Final status distribution after fix:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM supplier_lpos 
GROUP BY status 
ORDER BY status;

-- Check if there are any remaining invalid values
SELECT 'Any remaining invalid status values:' as info;
SELECT COUNT(*) as invalid_count
FROM supplier_lpos 
WHERE status NOT IN ('Draft', 'Sent', 'Confirmed', 'Received', 'Cancelled');