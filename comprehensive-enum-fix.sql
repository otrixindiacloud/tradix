-- Comprehensive Fix for Supplier LPO Status Enum Issues
-- Run this script to completely resolve the enum validation errors

BEGIN;

-- Step 1: Identify the problem
SELECT 'DIAGNOSIS: Checking current status values in supplier_lpos table' as step;
CREATE TEMP TABLE status_analysis AS
SELECT status, COUNT(*) as count 
FROM supplier_lpos 
WHERE status IS NOT NULL 
GROUP BY status;

SELECT * FROM status_analysis ORDER BY status;

-- Step 2: Check current enum definition
SELECT 'CURRENT ENUM: supplier_lpo_status values' as step;
SELECT unnest(enum_range(NULL::supplier_lpo_status)) as current_enum_values;

-- Step 3: Add missing enum values that exist in data
-- Add "Pending" to enum if it doesn't exist
DO $$
BEGIN
    -- Check if 'Pending' is already in the enum
    IF NOT EXISTS (
        SELECT 1 FROM unnest(enum_range(NULL::supplier_lpo_status)) AS e(val) 
        WHERE e.val = 'Pending'
    ) THEN
        ALTER TYPE supplier_lpo_status ADD VALUE 'Pending';
        RAISE NOTICE 'Added "Pending" to supplier_lpo_status enum';
    ELSE
        RAISE NOTICE '"Pending" already exists in supplier_lpo_status enum';
    END IF;
END $$;

-- Step 4: Handle any other invalid status values
-- Update any status values that are still not in the enum
UPDATE supplier_lpos 
SET status = CASE 
    WHEN status = 'Pending Approval' THEN 'Pending'
    WHEN status = 'In Progress' THEN 'Sent'
    WHEN status = 'Approved' THEN 'Confirmed'
    WHEN status = 'Delivered' THEN 'Received'
    WHEN status = 'Rejected' THEN 'Cancelled'
    ELSE status
END
WHERE status NOT IN ('Draft', 'Sent', 'Confirmed', 'Received', 'Cancelled', 'Pending');

-- Step 5: Verify the fix
SELECT 'VERIFICATION: Updated enum values' as step;
SELECT unnest(enum_range(NULL::supplier_lpo_status)) as updated_enum_values;

SELECT 'VERIFICATION: Status distribution after fix' as step;
SELECT status, COUNT(*) as count 
FROM supplier_lpos 
GROUP BY status 
ORDER BY status;

-- Step 6: Final validation
SELECT 'FINAL CHECK: Any remaining invalid status values?' as step;
SELECT COUNT(*) as invalid_count,
       CASE 
           WHEN COUNT(*) = 0 THEN 'SUCCESS: All status values are now valid'
           ELSE 'ERROR: Some invalid status values remain'
       END as result
FROM supplier_lpos 
WHERE status NOT IN (
    SELECT unnest(enum_range(NULL::supplier_lpo_status))
);

COMMIT;

-- Summary
SELECT 'FIX COMPLETED: supplier_lpo_status enum issues resolved' as summary;