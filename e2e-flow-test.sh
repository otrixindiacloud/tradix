#!/bin/bash

# Comprehensive End-to-End ERP Flow Test Script
# Tests: Customer → Enquiry → Quotation → Acceptance → Sales Order → etc.

echo "=========================================="
echo "ERP END-TO-END FLOW VALIDATION"
echo "=========================================="

# Configuration
API_BASE="http://localhost:5000"
TEST_LOG="e2e_test_results.log"

# Clear previous test log
> $TEST_LOG

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $TEST_LOG
}

test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    log "Testing: $description"
    log "Request: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" 2>&1)
    fi
    
    log "Response: $response"
    echo "$response"
    log "---"
}

# Step 1: Test Customer Creation
log "STEP 1: CUSTOMER MANAGEMENT"
CUSTOMER_RESPONSE=$(test_api "POST" "/api/customers" '{
  "name": "E2E Test Corp",
  "email": "e2e@test.com", 
  "phone": "+1234567890",
  "address": "123 Test St, Test City",
  "customerType": "Wholesale",
  "classification": "Corporate",
  "creditLimit": "100000",
  "paymentTerms": "Net 30"
}' "Creating test customer")

CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
log "Customer ID: $CUSTOMER_ID"

# Step 2: Test Enquiry Creation
log "STEP 2: ENQUIRY MANAGEMENT"
ENQUIRY_RESPONSE=$(test_api "POST" "/api/enquiries" '{
  "customerId": "'$CUSTOMER_ID'",
  "source": "Email",
  "targetDeliveryDate": "2025-10-30T00:00:00.000Z",
  "notes": "E2E Test enquiry for promotional materials"
}' "Creating test enquiry")

ENQUIRY_ID=$(echo "$ENQUIRY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
log "Enquiry ID: $ENQUIRY_ID"

# Step 3: Add Enquiry Items
log "STEP 3: ENQUIRY ITEMS"
ITEM_RESPONSE=$(test_api "POST" "/api/enquiry-items" '{
  "enquiryId": "'$ENQUIRY_ID'",
  "description": "E2E Test Promotional T-Shirts",
  "quantity": 500,
  "unitPrice": "20.00",
  "notes": "Various sizes - logo required"
}' "Adding enquiry item")

ITEM_ID=$(echo "$ITEM_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
log "Enquiry Item ID: $ITEM_ID"

# Verify enquiry items
test_api "GET" "/api/enquiries/$ENQUIRY_ID/items" "" "Retrieving enquiry items"

# Step 4: Generate Quotation from Enquiry
log "STEP 4: QUOTATION GENERATION"
QUOTATION_RESPONSE=$(test_api "POST" "/api/quotations/generate/$ENQUIRY_ID" '{}' "Generating quotation from enquiry")

QUOTATION_ID=$(echo "$QUOTATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
log "Quotation ID: $QUOTATION_ID"

# Verify quotation items
test_api "GET" "/api/quotations/$QUOTATION_ID/items" "" "Retrieving quotation items"

# Get quotation details
test_api "GET" "/api/quotations/$QUOTATION_ID" "" "Retrieving quotation details"

# Step 5: List all quotations
log "STEP 5: QUOTATION VERIFICATION"
test_api "GET" "/api/quotations" "" "Listing all quotations"

echo "=========================================="
log "E2E Test Summary:"
log "Customer ID: $CUSTOMER_ID"
log "Enquiry ID: $ENQUIRY_ID"
log "Enquiry Item ID: $ITEM_ID"
log "Quotation ID: $QUOTATION_ID"
echo "=========================================="
log "Full test log saved to: $TEST_LOG"