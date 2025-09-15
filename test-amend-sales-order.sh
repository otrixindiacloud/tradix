#!/bin/bash
# Quick test for amended sales order creation
API_BASE="http://localhost:5000/api"

echo "🧪 Testing Sales Order Amendment"
echo "Fetching first Draft sales order..."
ORDER_JSON=$(curl -s "$API_BASE/sales-orders?status=Draft&limit=1")
ORDER_ID=$(echo "$ORDER_JSON" | jq -r '.[0].id')
ORDER_NUM=$(echo "$ORDER_JSON" | jq -r '.[0].orderNumber')

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
  echo "❌ No draft sales order found to amend."
  exit 1
fi

echo "Amending order $ORDER_NUM ($ORDER_ID)"
RESP=$(curl -s -X POST "$API_BASE/sales-orders/$ORDER_ID/amend" \
  -H 'Content-Type: application/json' \
  -d '{"reason":"Price adjustment for customer request"}')

echo "$RESP" | jq '{id, orderNumber, parentOrderId, version, amendmentReason}'

PARENT=$(echo "$RESP" | jq -r '.parentOrderId')
if [ "$PARENT" != "$ORDER_ID" ]; then
  echo "❌ Parent linkage mismatch"; exit 1; fi

VER=$(echo "$RESP" | jq -r '.version')
if [ "$VER" = "null" ]; then echo "❌ Missing version"; exit 1; fi

echo "✅ Amendment test completed successfully."