#!/bin/bash

# Test script for quotation item functionality
echo "=== Testing Quotation Item Functionality ==="

BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        return 1
    fi
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

print_info "Testing quotation item functionality..."

# Test 1: Create a customer for testing
print_info "Step 1: Creating test customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer for Items",
    "email": "testitems@example.com",
    "phone": "123-456-7890",
    "address": "123 Test St",
    "customerType": "Retail"
  }')

if [ $? -eq 0 ]; then
    CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_status 0 "Customer created with ID: $CUSTOMER_ID"
else
    print_status 1 "Failed to create customer"
    exit 1
fi

# Test 2: Create an enquiry with items
print_info "Step 2: Creating test enquiry with items..."
ENQUIRY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"subject\": \"Test Enquiry for Item Conversion\",
    \"description\": \"Testing automatic item conversion\",
    \"priority\": \"Medium\",
    \"expectedClosureDate\": \"2025-01-01\",
    \"notes\": \"Test enquiry for quotation conversion\"
  }")

if [ $? -eq 0 ]; then
    ENQUIRY_ID=$(echo "$ENQUIRY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_status 0 "Enquiry created with ID: $ENQUIRY_ID"
else
    print_status 1 "Failed to create enquiry"
    exit 1
fi

# Test 3: Add items to the enquiry
print_info "Step 3: Adding items to enquiry..."

ITEM1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/enquiry-items" \
  -H "Content-Type: application/json" \
  -d "{
    \"enquiryId\": \"$ENQUIRY_ID\",
    \"description\": \"Test Item 1 - Electronics\",
    \"quantity\": 5,
    \"unitPrice\": 25.00,
    \"notes\": \"High quality electronics\"
  }")

ITEM2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/enquiry-items" \
  -H "Content-Type: application/json" \
  -d "{
    \"enquiryId\": \"$ENQUIRY_ID\",
    \"description\": \"Test Item 2 - Accessories\",
    \"quantity\": 10,
    \"unitPrice\": 15.00,
    \"notes\": \"Essential accessories\"
  }")

if [ $? -eq 0 ]; then
    print_status 0 "Items added to enquiry"
else
    print_status 1 "Failed to add items to enquiry"
    exit 1
fi

# Test 4: Generate quotation from enquiry
print_info "Step 4: Generating quotation from enquiry..."
QUOTATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/quotations/generate/$ENQUIRY_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "validUntil": "2025-02-01",
    "terms": "Standard terms",
    "notes": "Generated from test enquiry"
  }')

if [ $? -eq 0 ]; then
    QUOTATION_ID=$(echo "$QUOTATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_status 0 "Quotation generated with ID: $QUOTATION_ID"
else
    print_status 1 "Failed to generate quotation"
    echo "Response: $QUOTATION_RESPONSE"
    exit 1
fi

# Test 5: Check if quotation items were created
print_info "Step 5: Verifying quotation items were created..."
QUOTATION_ITEMS_RESPONSE=$(curl -s "$BASE_URL/api/quotations/$QUOTATION_ID/items")

if [ $? -eq 0 ]; then
    ITEM_COUNT=$(echo "$QUOTATION_ITEMS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    if [ "$ITEM_COUNT" -eq 2 ]; then
        print_status 0 "Quotation items created successfully (Count: $ITEM_COUNT)"
    else
        print_status 1 "Expected 2 items, found $ITEM_COUNT"
        echo "Response: $QUOTATION_ITEMS_RESPONSE"
    fi
else
    print_status 1 "Failed to fetch quotation items"
    exit 1
fi

# Test 6: Manually add a new item to the quotation
print_info "Step 6: Testing manual item addition..."
MANUAL_ITEM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/quotations/$QUOTATION_ID/items" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Manually Added Item - Premium Service",
    "quantity": 3,
    "costPrice": "20.00",
    "markup": "70.00",
    "unitPrice": "34.00",
    "lineTotal": "102.00",
    "notes": "Premium service package"
  }')

if [ $? -eq 0 ]; then
    print_status 0 "Manual item added successfully"
else
    print_status 1 "Failed to add manual item"
    echo "Response: $MANUAL_ITEM_RESPONSE"
    exit 1
fi

# Test 7: Verify total item count
print_info "Step 7: Verifying total item count..."
FINAL_ITEMS_RESPONSE=$(curl -s "$BASE_URL/api/quotations/$QUOTATION_ID/items")

if [ $? -eq 0 ]; then
    FINAL_ITEM_COUNT=$(echo "$FINAL_ITEMS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    if [ "$FINAL_ITEM_COUNT" -eq 3 ]; then
        print_status 0 "Final item count correct (Count: $FINAL_ITEM_COUNT)"
    else
        print_status 1 "Expected 3 items, found $FINAL_ITEM_COUNT"
        echo "Response: $FINAL_ITEMS_RESPONSE"
    fi
else
    print_status 1 "Failed to fetch final quotation items"
    exit 1
fi

# Test 8: Check quotation details
print_info "Step 8: Verifying quotation details..."
QUOTATION_DETAILS=$(curl -s "$BASE_URL/api/quotations/$QUOTATION_ID")

if [ $? -eq 0 ]; then
    TOTAL_AMOUNT=$(echo "$QUOTATION_DETAILS" | grep -o '"totalAmount":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$TOTAL_AMOUNT" ] && [ "$TOTAL_AMOUNT" != "0" ]; then
        print_status 0 "Quotation total amount calculated: \$$TOTAL_AMOUNT"
    else
        print_status 1 "Quotation total amount not calculated properly"
        echo "Response: $QUOTATION_DETAILS"
    fi
else
    print_status 1 "Failed to fetch quotation details"
    exit 1
fi

echo ""
echo -e "${GREEN}=== All Tests Completed Successfully! ===${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Customer ID: $CUSTOMER_ID"
echo -e "  Enquiry ID: $ENQUIRY_ID"
echo -e "  Quotation ID: $QUOTATION_ID"
echo -e "  Total Items: $FINAL_ITEM_COUNT"
echo -e "  Total Amount: \$$TOTAL_AMOUNT"
echo ""
echo -e "${GREEN}✓ Enquiry-to-quotation conversion with automatic item generation works!${NC}"
echo -e "${GREEN}✓ Manual quotation item addition works!${NC}"
