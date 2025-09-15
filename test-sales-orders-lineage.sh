#!/usr/bin/env bash
# Test script for sales order lineage endpoint.
# Requires server running on localhost:3000 and jq installed.
# Usage: bash test-sales-orders-lineage.sh
set -euo pipefail
BASE_URL="http://localhost:3000"
log() { printf "[lineage-test] %s\n" "$*"; }

# 1. Create a base sales order (minimal required fields) using existing endpoint
log "Creating base sales order"
CREATE_PAYLOAD='{
  "customerId": "00000000-0000-0000-0000-000000000000",
  "orderDate": "2025-01-01",
  "status": "Draft",
  "totalAmount": 0
}'
BASE_ORDER=$(curl -s -X POST "$BASE_URL/api/sales-orders" -H 'Content-Type: application/json' -d "$CREATE_PAYLOAD")
BASE_ID=$(echo "$BASE_ORDER" | jq -r '.id')
if [ "$BASE_ID" = "null" ] || [ -z "$BASE_ID" ]; then
  log "Failed to create base sales order: $BASE_ORDER"; exit 1; fi
log "Base order id: $BASE_ID"

# 2. Create two amendments
for reason in "Price adjustment" "Quantity correction"; do
  AMEND=$(curl -s -X POST "$BASE_URL/api/sales-orders/$BASE_ID/amend" -H 'Content-Type: application/json' -d "{\"reason\":\"$reason\"}")
  A_ID=$(echo "$AMEND" | jq -r '.id')
  if [ "$A_ID" = "null" ]; then log "Failed to create amendment: $AMEND"; exit 1; fi
  log "Created amendment $A_ID for reason '$reason'"
  # Use original parent each time so all amendments attach to root
  BASE_ID_ORIG=$BASE_ID
  BASE_ID=$BASE_ID_ORIG
  sleep 0.2
done

# 3. Fetch lineage for last amendment id
LINEAGE=$(curl -s "$BASE_URL/api/sales-orders/$BASE_ID/lineage")
COUNT=$(echo "$LINEAGE" | jq -r '.count')
if [ "$COUNT" != "3" ]; then
  log "Expected lineage count 3 got $COUNT: $LINEAGE"; exit 1; fi
log "Lineage count OK (3)"

# 4. Ensure ordering root then A1 then A2 by checking order_numbers
ORDER_NUMBERS=$(echo "$LINEAGE" | jq -r '.lineage[] | .orderNumber')
echo "$ORDER_NUMBERS" | nl -ba
FIRST=$(echo "$ORDER_NUMBERS" | sed -n '1p')
SECOND=$(echo "$ORDER_NUMBERS" | sed -n '2p')
THIRD=$(echo "$ORDER_NUMBERS" | sed -n '3p')
if echo "$SECOND" | grep -vq -- '-A1'; then log "Second entry not A1: $SECOND"; exit 1; fi
if echo "$THIRD" | grep -vq -- '-A2'; then log "Third entry not A2: $THIRD"; exit 1; fi
log "Ordering validation passed"

log "SUCCESS: Sales order lineage endpoint works as expected"
