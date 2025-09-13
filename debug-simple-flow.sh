#!/bin/bash

# Simple debug script for ERP flow testing
API_BASE="http://localhost:5000"

echo "=== ERP Flow Debug ==="

# Step 1: Create Customer
echo "[STEP 1] Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_BASE/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Debug Test Corp",
    "email": "debug@test.com", 
    "phone": "+1234567890",
    "address": "123 Debug St, Test City",
    "customerType": "Wholesale",
    "classification": "Corporate",
    "creditLimit": "100000",
    "paymentTerms": "Net 30"
  }')

CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Customer ID: $CUSTOMER_ID"
echo "Full response: $CUSTOMER_RESPONSE"
echo ""

# Step 2: Create Enquiry
echo "[STEP 2] Creating enquiry..."
ENQUIRY_RESPONSE=$(curl -s -X POST "$API_BASE/api/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "source": "Email",
    "targetDeliveryDate": "2025-10-30T00:00:00.000Z",
    "notes": "Debug test enquiry for promotional materials"
  }')

ENQUIRY_ID=$(echo "$ENQUIRY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Enquiry ID: $ENQUIRY_ID"
echo "Full response: $ENQUIRY_RESPONSE"
echo ""

# Step 3: Add Enquiry Item
echo "[STEP 3] Adding enquiry item..."
ITEM_RESPONSE=$(curl -s -X POST "$API_BASE/api/enquiry-items" \
  -H "Content-Type: application/json" \
  -d '{
    "enquiryId": "'$ENQUIRY_ID'",
    "description": "Debug Test Promotional T-Shirts",
    "quantity": 500,
    "unitPrice": "20.00",
    "notes": "Various sizes - logo required"
  }')

ITEM_ID=$(echo "$ITEM_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Item ID: $ITEM_ID"
echo "Full response: $ITEM_RESPONSE"
echo ""

# Step 4: Generate Quotation
echo "[STEP 4] Generating quotation..."
QUOTATION_RESPONSE=$(curl -s -X POST "$API_BASE/api/quotations/generate/$ENQUIRY_ID" \
  -H "Content-Type: application/json" \
  -d '{}')

QUOTATION_ID=$(echo "$QUOTATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Quotation ID: $QUOTATION_ID"
echo "Full response: $QUOTATION_RESPONSE"
echo ""

# Step 5: Check Quotation Items
echo "[STEP 5] Checking quotation items..."
QUOTATION_ITEMS_RESPONSE=$(curl -s -X GET "$API_BASE/api/quotations/$QUOTATION_ID/items" \
  -H "Content-Type: application/json")

echo "Quotation items response: $QUOTATION_ITEMS_RESPONSE"
echo ""

echo "=== Summary ==="
echo "Customer ID: $CUSTOMER_ID"
echo "Enquiry ID: $ENQUIRY_ID"
echo "Item ID: $ITEM_ID"
echo "Quotation ID: $QUOTATION_ID"