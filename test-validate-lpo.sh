#!/bin/bash

# Test script for Validate LPO functionality
API_BASE="http://localhost:5000/api"

echo "🧪 Testing Validate LPO Functionality"
echo "=================================="

# First, let's get some existing sales orders
echo "📋 Fetching existing sales orders..."
curl -s -X GET "$API_BASE/sales-orders" | jq '.[] | {id, orderNumber, customerPoNumber, customerLpoValidationStatus}' | head -5

echo ""
echo "Select a sales order ID from the above list to test validation..."
read -p "Enter sales order ID: " ORDER_ID

if [ -z "$ORDER_ID" ]; then
    echo "❌ No order ID provided, exiting."
    exit 1
fi

echo ""
echo "🔍 Testing LPO validation for order: $ORDER_ID"

# Test approve validation
echo "✅ Testing APPROVE validation..."
APPROVE_RESPONSE=$(curl -s -X PUT "$API_BASE/sales-orders/$ORDER_ID/validate-lpo" \
    -H "Content-Type: application/json" \
    -d '{
        "status": "Approved",
        "notes": "LPO documentation is complete and verified",
        "validatedBy": "test-user-123"
    }')

echo "Approve Response:"
echo "$APPROVE_RESPONSE" | jq '.'

# Test reject validation
echo ""
echo "❌ Testing REJECT validation..."
REJECT_RESPONSE=$(curl -s -X PUT "$API_BASE/sales-orders/$ORDER_ID/validate-lpo" \
    -H "Content-Type: application/json" \
    -d '{
        "status": "Rejected",
        "notes": "LPO missing required signatures",
        "validatedBy": "test-user-123"
    }')

echo "Reject Response:"
echo "$REJECT_RESPONSE" | jq '.'

# Verify the updated order
echo ""
echo "🔍 Verifying updated order status..."
UPDATED_ORDER=$(curl -s -X GET "$API_BASE/sales-orders/$ORDER_ID")
echo "$UPDATED_ORDER" | jq '{id, orderNumber, customerLpoValidationStatus, customerLpoValidatedBy, customerLpoValidatedAt}'

echo ""
echo "✅ Validate LPO test completed!"