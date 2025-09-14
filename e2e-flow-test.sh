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

# Ensure IDs are single-line UUIDs without accidental duplication/newlines
sanitize_id() {
  # Take only the first line, strip CR, and trim whitespace
  printf '%s' "$1" | tr -d '\r' | awk 'NR==1 {print}'
}

test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    log "Testing: $description"
    log "Request: $method $endpoint"
    
  if [ -n "$data" ]; then
    # Debug payload details before sending
    local payload_length=${#data}
    log "Payload length: $payload_length"
    printf '%s' "$data" | head -c 200 | sed 's/\\/\\\\/g' | sed 's/\t/\\t/g' | sed 's/\r/\\r/g' | sed 's/\n/\\n/g' | while read -r line; do
      log "Payload preview: $line"
    done
    printf '%s' "$data" | od -An -tx1 -N120 | sed 's/^/HEX: /' | while read -r hex; do log "$hex"; done
    response=$(curl -s -X $method "$API_BASE$endpoint" \
      -H "Content-Type: application/json" \
      --data "$data" 2>&1)
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

CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
CUSTOMER_ID=$(sanitize_id "$CUSTOMER_ID")
log "Customer ID: $CUSTOMER_ID"

# Step 2: Test Enquiry Creation
log "STEP 2: ENQUIRY MANAGEMENT"

# Build enquiry payload using jq (preferred) or fallback to compact JSON
if command -v jq >/dev/null 2>&1; then
  ENQUIRY_PAYLOAD=$(jq -n \
    --arg customerId "$CUSTOMER_ID" \
    --arg source "Email" \
    --arg tdate "2025-10-30T00:00:00.000Z" \
    --arg notes "E2E Test enquiry for promotional materials" \
    '{customerId:$customerId, source:$source, targetDeliveryDate:$tdate, notes:$notes}')
else
  ENQUIRY_PAYLOAD={"customerId":"$CUSTOMER_ID","source":"Email","targetDeliveryDate":"2025-10-30T00:00:00.000Z","notes":"E2E Test enquiry for promotional materials"}
fi

ENQUIRY_RESPONSE=$(test_api "POST" "/api/enquiries" "$ENQUIRY_PAYLOAD" "Creating test enquiry")

ENQUIRY_ID=$(echo "$ENQUIRY_RESPONSE" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
ENQUIRY_ID=$(sanitize_id "$ENQUIRY_ID")
log "Enquiry ID: $ENQUIRY_ID"

if [ -z "$ENQUIRY_ID" ]; then
  log "ERROR: Enquiry creation failed. Aborting remaining steps.";
  echo "==========================================";
  log "E2E Test Summary:";
  log "Customer ID: $CUSTOMER_ID";
  log "Enquiry ID: (creation failed)";
  echo "==========================================";
  exit 1;
fi

# Step 3: Add Enquiry Items
log "STEP 3: ENQUIRY ITEMS"

read -r -d '' ENQUIRY_ITEM_PAYLOAD <<EOF
{
  "enquiryId": "$ENQUIRY_ID",
  "description": "E2E Test Promotional T-Shirts",
  "quantity": 500,
  "unitPrice": "20.00",
  "notes": "Various sizes - logo required"
}
EOF

ITEM_RESPONSE=$(test_api "POST" "/api/enquiry-items" "$ENQUIRY_ITEM_PAYLOAD" "Adding enquiry item")

ITEM_ID=$(echo "$ITEM_RESPONSE" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
log "Enquiry Item ID: $ITEM_ID"

if [ -z "$ITEM_ID" ]; then
  log "WARNING: Enquiry item creation failed; continuing to quotation generation (may fail)."
fi

# Verify enquiry items
test_api "GET" "/api/enquiries/$ENQUIRY_ID/items" "" "Retrieving enquiry items"

# Step 4: Generate Quotation from Enquiry
log "STEP 4: QUOTATION GENERATION"
QUOTATION_RESPONSE=$(test_api "POST" "/api/quotations/generate/$ENQUIRY_ID" '{}' "Generating quotation from enquiry")

QUOTATION_ID=$(echo "$QUOTATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
log "Quotation ID: $QUOTATION_ID"

if [ -z "$QUOTATION_ID" ]; then
  log "WARNING: Quotation generation failed; later verification steps will show existing quotations only.";
fi

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