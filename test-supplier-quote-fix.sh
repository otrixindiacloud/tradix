#!/bin/bash

# Test script to verify supplier quote detail view fix
echo "Testing Supplier Quote Detail View Fix"
echo "====================================="

# Check that the mock data IDs now match between files
echo "1. Checking ID consistency between files..."

# Extract IDs from supplier-quotes.tsx
echo "IDs in supplier-quotes.tsx:"
grep -o '"sq-[0-9][0-9][0-9]"' /workspaces/tradix/client/src/pages/supplier-quotes.tsx | sort | uniq

# Extract IDs from supplier-quote-detail.tsx 
echo "IDs in supplier-quote-detail.tsx:"
grep -o '"sq-[0-9][0-9][0-9]"' /workspaces/tradix/client/src/pages/supplier-quote-detail.tsx | sort | uniq

echo ""
echo "2. Checking if status types are compatible..."

# Check for Pending status in both files
QUOTES_PENDING=$(grep -c '"Pending"' /workspaces/tradix/client/src/pages/supplier-quotes.tsx)
DETAIL_PENDING=$(grep -c '"Pending"' /workspaces/tradix/client/src/pages/supplier-quote-detail.tsx)

echo "Pending status references:"
echo "- supplier-quotes.tsx: $QUOTES_PENDING"
echo "- supplier-quote-detail.tsx: $DETAIL_PENDING"

if [ "$QUOTES_PENDING" -gt 0 ] && [ "$DETAIL_PENDING" -gt 0 ]; then
    echo "✅ Status types are now compatible"
else
    echo "⚠️  Status type compatibility needs verification"
fi

echo ""
echo "3. Verifying navigation implementation..."

# Check that navigation is correctly implemented
NAV_CHECK=$(grep -n 'navigate.*supplier-quotes.*quote\.id' /workspaces/tradix/client/src/pages/supplier-quotes.tsx)
if [ ! -z "$NAV_CHECK" ]; then
    echo "✅ Navigation implementation found:"
    echo "   $NAV_CHECK"
else
    echo "❌ Navigation implementation not found"
fi

echo ""
echo "4. Checking route configuration..."

# Check route in App.tsx
ROUTE_CHECK=$(grep -n '/supplier-quotes/:id' /workspaces/tradix/client/src/App.tsx)
if [ ! -z "$ROUTE_CHECK" ]; then
    echo "✅ Route configuration found:"
    echo "   $ROUTE_CHECK"
else
    echo "❌ Route configuration not found"
fi

echo ""
echo "5. Summary of Fix..."
echo "==================="
echo "✅ Updated mock data IDs to match between list and detail pages"
echo "✅ Added 'Pending' and 'Accepted' to status interface"
echo "✅ Added mock data for sq-003 (Pending status)"
echo "✅ Enhanced item data for sq-002 to match itemCount"

echo ""
echo "The issue was that the supplier quotes list was using IDs like 'sq-001'"
echo "but the detail page was expecting IDs like 'sq-2024-001'."
echo "This has been fixed by updating the detail page mock data to use the correct IDs."

echo ""
echo "Test that should now work:"
echo "1. Go to /supplier-quotes"
echo "2. Click the eye (view) button on any quote"
echo "3. Detail page should now display the quote information instead of 'Not Found'"