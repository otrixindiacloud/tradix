#!/bin/bash
# -----------------------------------------------------------------------------
# test-sales-orders-actions.sh
#
# Automated smoke test for core Sales Order actions:
#   1. Locate or create a Draft sales order (uses first Accepted quotation if needed)
#   2. Confirm the order
#   3. Run LPO validation approve -> reject cycle
#   4. Create an amended sales order (version increment & parent linkage)
#   5. Output final status summary
#
# Requirements:
#   - API server running on localhost:5000
#   - jq installed
#
# Usage:
#   bash test-sales-orders-actions.sh
# -----------------------------------------------------------------------------
set -euo pipefail
API="http://localhost:5000/api"
JQ="jq -r"

log() { echo -e "\n📘 $1"; }
pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }

# Preconditions: server running, at least one quotation Accepted OR we will skip creation from quotation.

log "Fetch initial draft sales order (or create from first accepted quotation if none)"
DRAFT_JSON=$(curl -s "$API/sales-orders?status=Draft&limit=1")
DRAFT_ID=$(echo "$DRAFT_JSON" | jq -r '.[0].id // empty')

if [ -z "$DRAFT_ID" ]; then
  QUO_JSON=$(curl -s "$API/quotations")
  QUO_ID=$(echo "$QUO_JSON" | jq -r '[.[] | select(.status=="Accepted")][0].id // empty')
  if [ -n "$QUO_ID" ]; then
    log "Creating sales order from quotation $QUO_ID"
    CREATE_SO=$(curl -s -X POST "$API/sales-orders/from-quotation" -H 'Content-Type: application/json' -d '{"quotationId":"'$QUO_ID'"}')
    DRAFT_ID=$(echo "$CREATE_SO" | jq -r '.id')
  else
    fail "No draft sales order and no accepted quotation available. Cannot proceed."
  fi
fi

SO=$(curl -s "$API/sales-orders/$DRAFT_ID")
STATUS=$(echo "$SO" | jq -r '.status')
[ "$STATUS" = "Draft" ] || fail "Expected Draft status, got $STATUS"
pass "Located draft sales order $DRAFT_ID"

log "Confirming sales order"
CONFIRM=$(curl -s -X PUT "$API/sales-orders/$DRAFT_ID" -H 'Content-Type: application/json' -d '{"status":"Confirmed"}')
NEW_STATUS=$(echo "$CONFIRM" | jq -r '.status')
[ "$NEW_STATUS" = "Confirmed" ] || fail "Failed to confirm order"
pass "Sales order confirmed"

log "Validating customer LPO (approve then reject)"
VAL1=$(curl -s -X PUT "$API/sales-orders/$DRAFT_ID/validate-lpo" -H 'Content-Type: application/json' -d '{"status":"Approved","notes":"auto test"}')
VSTAT1=$(echo "$VAL1" | jq -r '.customerLpoValidationStatus')
[ "$VSTAT1" = "Approved" ] || fail "Expected Approved got $VSTAT1"
VAL2=$(curl -s -X PUT "$API/sales-orders/$DRAFT_ID/validate-lpo" -H 'Content-Type: application/json' -d '{"status":"Rejected","notes":"auto test reject"}')
VSTAT2=$(echo "$VAL2" | jq -r '.customerLpoValidationStatus')
[ "$VSTAT2" = "Rejected" ] || fail "Expected Rejected got $VSTAT2"
pass "LPO validation approve->reject cycle successful"

log "Amending sales order"
AMEND=$(curl -s -X POST "$API/sales-orders/$DRAFT_ID/amend" -H 'Content-Type: application/json' -d '{"reason":"Price update test"}')
A_VERSION=$(echo "$AMEND" | jq -r '.version')
A_PARENT=$(echo "$AMEND" | jq -r '.parentOrderId')
[ "$A_PARENT" = "$DRAFT_ID" ] || fail "Amend parent mismatch"
[ -n "$A_VERSION" ] || fail "Missing amended version"
pass "Amendment created version $A_VERSION"

log "Summary"
FINAL=$(curl -s "$API/sales-orders/$DRAFT_ID")
echo "$FINAL" | jq '{id, status, customerLpoValidationStatus}'

pass "All sales order action tests passed."