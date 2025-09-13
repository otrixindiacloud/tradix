#!/bin/bash

# Debug script to test quotation generation with detailed logging

echo "Testing quotation generation with debug..."

# Test generating a quotation and capture both output and error
echo "Generating quotation from enquiry 47f4a58c-ebbd-4290-975c-ce66c915ae90..."
RESULT=$(curl -X POST http://localhost:5000/api/quotations/generate/47f4a58c-ebbd-4290-975c-ce66c915ae90 \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1)

echo "Quotation generation result:"
echo "$RESULT"

# Extract quotation ID if successful
QUOTATION_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$QUOTATION_ID" ]; then
  echo "Generated quotation ID: $QUOTATION_ID"
  
  # Check for items
  echo "Checking for quotation items..."
  curl -X GET "http://localhost:5000/api/quotations/$QUOTATION_ID/items" \
    -H "Content-Type: application/json"
  echo ""
  
  # Check the quotation details
  echo "Checking quotation details..."
  curl -X GET "http://localhost:5000/api/quotations/$QUOTATION_ID" \
    -H "Content-Type: application/json"
  echo ""
else
  echo "Failed to extract quotation ID from result"
fi

echo "Debug test completed."