#!/bin/bash

echo "🔍 Testing GT-ERP Application Features"
echo "========================================="

BASE_URL="http://localhost:5000"

# Function to test API endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ PASS (HTTP $http_code)"
        return 0
    else
        echo "❌ FAIL (HTTP $http_code)"
        if [ ! -z "$body" ]; then
            echo "   Response: $body"
        fi
        return 1
    fi
}

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 5

# Test dashboard
test_endpoint "/api/dashboard/stats" "Dashboard Stats"

# Test main features
test_endpoint "/api/enquiries" "Enquiries"
test_endpoint "/api/quotations" "Quotations"
test_endpoint "/api/customers" "Customers"
test_endpoint "/api/sales-orders" "Sales Orders"
test_endpoint "/api/suppliers" "Suppliers"
test_endpoint "/api/inventory" "Inventory"

# Test procurement features
test_endpoint "/api/supplier-lpos" "Supplier LPOs"
test_endpoint "/api/goods-receipt" "Goods Receipt"

# Test delivery features
test_endpoint "/api/deliveries" "Deliveries"

echo ""
echo "📊 Feature Test Summary Complete"
echo "================================="
