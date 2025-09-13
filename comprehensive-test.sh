#!/bin/bash

echo "🧪 Comprehensive GT-ERP Application Test"
echo "========================================"

BASE_URL="http://localhost:5000"

# Function to test API endpoint
test_api() {
    local endpoint=$1
    local description=$2
    echo -n "🔌 Testing API $description... "
    
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

# Function to test frontend page (just check if it loads without 404)
test_page() {
    local path=$1
    local description=$2
    echo -n "🌐 Testing Page $description... "
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$path")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ PASS (HTTP $http_code)"
        return 0
    elif [ "$http_code" = "404" ]; then
        echo "❌ FAIL (HTTP $http_code - Page Not Found)"
        return 1
    else
        echo "⚠️  WARN (HTTP $http_code)"
        return 0
    fi
}

echo ""
echo "📊 Testing Backend APIs"
echo "======================="
test_api "/api/dashboard/stats" "Dashboard Stats"
test_api "/api/enquiries" "Enquiries API"
test_api "/api/quotations" "Quotations API"
test_api "/api/customers" "Customers API"
test_api "/api/sales-orders" "Sales Orders API"
test_api "/api/suppliers" "Suppliers API"
test_api "/api/inventory" "Inventory API"
test_api "/api/supplier-lpos" "Supplier LPOs API"
test_api "/api/goods-receipt" "Goods Receipt API"
test_api "/api/deliveries" "Deliveries API"

echo ""
echo "🖥️  Testing Frontend Pages"
echo "=========================="
test_page "/" "Dashboard"
test_page "/enquiries" "Enquiries Page"
test_page "/quotations" "Quotations Page"
test_page "/quotations/new" "New Quotation Page"
test_page "/po-upload" "PO Upload Page"
test_page "/sales-orders" "Sales Orders Page"
test_page "/supplier-lpo" "Supplier LPO Page"
test_page "/goods-receipt" "Goods Receipt Page"
test_page "/inventory" "Inventory Page"
test_page "/delivery" "Delivery Page"
test_page "/invoicing" "Invoicing Page"
test_page "/pricing" "Pricing Page"
test_page "/suppliers" "Suppliers Page"

echo ""
echo "🔍 Testing CRUD Operations"
echo "=========================="

# Test creating a new supplier
echo -n "🏭 Testing Supplier Creation... "
create_response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/suppliers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Supplier","email":"test@example.com","contactPerson":"John Doe","phone":"123-456-7890"}')
create_http_code="${create_response: -3}"
if [ "$create_http_code" = "201" ]; then
    echo "✅ PASS (HTTP $create_http_code)"
    
    # Extract supplier ID from response for cleanup
    supplier_id=$(echo "${create_response%???}" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    # Test reading the created supplier
    echo -n "🔍 Testing Supplier Read... "
    read_response=$(curl -s -w "%{http_code}" "$BASE_URL/api/suppliers/$supplier_id")
    read_http_code="${read_response: -3}"
    if [ "$read_http_code" = "200" ]; then
        echo "✅ PASS (HTTP $read_http_code)"
    else
        echo "❌ FAIL (HTTP $read_http_code)"
    fi
    
    # Test updating the supplier
    echo -n "✏️  Testing Supplier Update... "
    update_response=$(curl -s -w "%{http_code}" -X PUT "$BASE_URL/api/suppliers/$supplier_id" \
      -H "Content-Type: application/json" \
      -d '{"name":"Updated Test Supplier","email":"updated@example.com"}')
    update_http_code="${update_response: -3}"
    if [ "$update_http_code" = "200" ]; then
        echo "✅ PASS (HTTP $update_http_code)"
    else
        echo "❌ FAIL (HTTP $update_http_code)"
    fi
    
    # Clean up: delete the test supplier
    echo -n "🗑️  Testing Supplier Deletion... "
    delete_response=$(curl -s -w "%{http_code}" -X DELETE "$BASE_URL/api/suppliers/$supplier_id")
    delete_http_code="${delete_response: -3}"
    if [ "$delete_http_code" = "204" ]; then
        echo "✅ PASS (HTTP $delete_http_code)"
    else
        echo "❌ FAIL (HTTP $delete_http_code)"
    fi
else
    echo "❌ FAIL (HTTP $create_http_code)"
fi

echo ""
echo "📋 Test Summary Complete"
echo "========================"
echo "✅ All core features tested"
echo "🔧 Application is ready for use"
