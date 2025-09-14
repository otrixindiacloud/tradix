3366236#!/bin/bash

# Direct debug of quotation generation issue
API_BASE="http://localhost:5000"

echo "=== DEBUGGING QUOTATION GENERATION ==="

# Use existing enquiry that we know has items
ENQUIRY_ID="564d0f3c-24c4-4233-bd3d-a6b796b235cb"

echo "1. Checking enquiry items for enquiry: $ENQUIRY_ID"
ENQUIRY_ITEMS=$(curl -s "$API_BASE/api/enquiries/$ENQUIRY_ID/items")
echo "Enquiry items: $ENQUIRY_ITEMS"
echo ""

echo "2. Generating quotation..."
QUOTATION_RESPONSE=$(curl -s -X POST "$API_BASE/api/quotations/generate/$ENQUIRY_ID" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Quotation response: $QUOTATION_RESPONSE"
echo ""

QUOTATION_ID=$(echo "$QUOTATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Extracted quotation ID: $QUOTATION_ID"
echo ""

echo "3. Checking quotation items..."
QUOTATION_ITEMS=$(curl -s "$API_BASE/api/quotations/$QUOTATION_ID/items")
echo "Quotation items: $QUOTATION_ITEMS"
echo ""

echo "4. Checking quotation details..."
QUOTATION_DETAILS=$(curl -s "$API_BASE/api/quotations/$QUOTATION_ID")
echo "Quotation details: $QUOTATION_DETAILS"