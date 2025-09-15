#!/bin/bash

# Test script to verify supplier LPO data display
echo "Testing Supplier LPO data fix..."

# Check server response
echo "1. Testing API endpoint:"
curl -s "http://localhost:5000/api/supplier-lpos?limit=2" | jq '.[0:2] | .[] | {lpoNumber, supplierName, expectedDeliveryDate}' 2>/dev/null || echo "Error: Server not accessible or JSON malformed"

# Update a sample LPO with expected delivery date for testing
echo -e "\n2. Setting expected delivery date on sample LPO..."
LPO_ID=$(curl -s "http://localhost:5000/api/supplier-lpos?limit=1" | jq -r '.[0].id' 2>/dev/null)

if [ "$LPO_ID" != "null" ] && [ "$LPO_ID" != "" ]; then
    echo "Setting expected delivery date for LPO: $LPO_ID"
    curl -s -X PUT "http://localhost:5000/api/supplier-lpos/$LPO_ID" \
        -H "Content-Type: application/json" \
        -d '{"expectedDeliveryDate": "2025-09-20T00:00:00.000Z"}' | jq '.expectedDeliveryDate' 2>/dev/null || echo "Update failed"
else
    echo "No LPO found to update"
fi

echo -e "\n3. Checking updated data:"
curl -s "http://localhost:5000/api/supplier-lpos?limit=1" | jq '.[0] | {lpoNumber, supplierName, expectedDeliveryDate}' 2>/dev/null || echo "Error getting updated data"

echo -e "\nTest completed!"