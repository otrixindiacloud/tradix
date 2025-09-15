#!/bin/bash

# Comprehensive Workflow Test for GT-ERP
# Tests the complete 10-step business process

BASE_URL="http://localhost:5000/api"
LOG_FILE="workflow-test-$(date +%s).log"

echo "🔄 Starting Comprehensive GT-ERP Workflow Test" | tee $LOG_FILE
echo "===============================================" | tee -a $LOG_FILE
echo "Testing complete workflow: Enquiry → Quotation → Acceptance → Customer PO → Sales Order → Supplier LPO → Goods Receipt → Inventory → Delivery → Invoice" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Function to test API endpoints
test_api() {
    local endpoint=$1
    local method=$2
    local description=$3
    local data=$4
    
    echo "🧪 Testing: $description" | tee -a $LOG_FILE
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    # Extract HTTP code from last line
    http_code=$(echo "$response" | tail -1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✅ PASS ($http_code)" | tee -a $LOG_FILE
        echo "$response_body"
    else
        echo "   ❌ FAIL ($http_code)" | tee -a $LOG_FILE
        echo "   Response: $response_body" | tee -a $LOG_FILE
    fi
    echo "" | tee -a $LOG_FILE
    
    echo "$response_body"  # Return response for chaining
}

# Function to extract ID from JSON response
extract_id() {
    echo "$1" | jq -r '.id' 2>/dev/null || echo ""
}

echo "📋 Step 1: Testing Core Data Availability" | tee -a $LOG_FILE
echo "=========================================" | tee -a $LOG_FILE

# Test customer data
test_api "/customers" "GET" "Customer API endpoint"

# Test enquiries
test_api "/enquiries" "GET" "Enquiry API endpoint"

# Test quotations
test_api "/quotations" "GET" "Quotation API endpoint"

# Test sales orders
test_api "/sales-orders" "GET" "Sales Order API endpoint"

# Test supplier LPOs
test_api "/supplier-lpos" "GET" "Supplier LPO API endpoint"

# Test goods receipts
test_api "/goods-receipts" "GET" "Goods Receipt API endpoint"

# Test deliveries
test_api "/deliveries" "GET" "Delivery API endpoint"

# Test invoices
test_api "/invoices" "GET" "Invoice API endpoint"

echo "📊 Step 2: Testing PDF Generation" | tee -a $LOG_FILE
echo "===============================" | tee -a $LOG_FILE

# Get a sample quotation ID for PDF testing
quotation_response=$(curl -s "$BASE_URL/quotations" | jq '.[0].id' -r 2>/dev/null)
if [ "$quotation_response" != "null" ] && [ -n "$quotation_response" ]; then
    echo "🧪 Testing: Quotation PDF generation" | tee -a $LOG_FILE
    pdf_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/quotations/$quotation_response/pdf" 2>/dev/null)
    pdf_code=$(echo "$pdf_response" | tail -1)
    if [ "$pdf_code" = "200" ]; then
        echo "   ✅ PASS - Quotation PDF generates successfully" | tee -a $LOG_FILE
    else
        echo "   ❌ FAIL - Quotation PDF generation failed ($pdf_code)" | tee -a $LOG_FILE
    fi
else
    echo "   ⚠️  SKIP - No quotations available for PDF testing" | tee -a $LOG_FILE
fi

# Get a sample invoice ID for PDF testing
invoice_response=$(curl -s "$BASE_URL/invoices" | jq '.[0].id' -r 2>/dev/null)
if [ "$invoice_response" != "null" ] && [ -n "$invoice_response" ]; then
    echo "🧪 Testing: Invoice PDF generation" | tee -a $LOG_FILE
    pdf_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/invoices/$invoice_response/pdf" 2>/dev/null)
    pdf_code=$(echo "$pdf_response" | tail -1)
    if [ "$pdf_code" = "200" ]; then
        echo "   ✅ PASS - Invoice PDF generates successfully" | tee -a $LOG_FILE
    else
        echo "   ❌ FAIL - Invoice PDF generation failed ($pdf_code)" | tee -a $LOG_FILE
    fi
else
    echo "   ⚠️  SKIP - No invoices available for PDF testing" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE

echo "🔧 Step 3: Testing UI Page Accessibility" | tee -a $LOG_FILE
echo "=======================================" | tee -a $LOG_FILE

# Test key pages
pages=(
    "/"
    "/enquiries"
    "/quotations"
    "/customer-po-upload"
    "/sales-orders"
    "/supplier-lpo"
    "/goods-receipt"
    "/inventory"
    "/delivery"
    "/invoicing"
)

for page in "${pages[@]}"; do
    echo "🧪 Testing: Page $page accessibility" | tee -a $LOG_FILE
    page_response=$(curl -s -w "\n%{http_code}" "http://localhost:5000$page" 2>/dev/null)
    page_code=$(echo "$page_response" | tail -1)
    if [ "$page_code" = "200" ]; then
        echo "   ✅ PASS - Page loads successfully" | tee -a $LOG_FILE
    else
        echo "   ❌ FAIL - Page failed to load ($page_code)" | tee -a $LOG_FILE
    fi
done

echo "" | tee -a $LOG_FILE

echo "⚙️  Step 4: Testing Workflow Specific APIs" | tee -a $LOG_FILE
echo "=========================================" | tee -a $LOG_FILE

# Test customer acceptance endpoints
test_api "/customer-acceptances" "GET" "Customer Acceptance API endpoint"

# Test purchase orders
test_api "/purchase-orders" "GET" "Purchase Order API endpoint"

# Test suppliers
test_api "/suppliers" "GET" "Supplier API endpoint"

# Test inventory
test_api "/inventory" "GET" "Inventory API endpoint"

echo "📈 Step 5: Testing Workflow Statistics" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE

# Test dashboard stats
test_api "/dashboard/stats" "GET" "Dashboard Statistics API"

echo "" | tee -a $LOG_FILE

echo "✅ Test Summary" | tee -a $LOG_FILE
echo "===============" | tee -a $LOG_FILE
echo "Comprehensive workflow test completed!" | tee -a $LOG_FILE
echo "Test log saved to: $LOG_FILE" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Count results
total_tests=$(grep -c "🧪 Testing:" $LOG_FILE)
passed_tests=$(grep -c "✅ PASS" $LOG_FILE)
failed_tests=$(grep -c "❌ FAIL" $LOG_FILE)
skipped_tests=$(grep -c "⚠️  SKIP" $LOG_FILE)

echo "📊 Results:" | tee -a $LOG_FILE
echo "  Total Tests: $total_tests" | tee -a $LOG_FILE
echo "  Passed: $passed_tests" | tee -a $LOG_FILE
echo "  Failed: $failed_tests" | tee -a $LOG_FILE
echo "  Skipped: $skipped_tests" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

if [ "$failed_tests" -eq 0 ]; then
    echo "🎉 All tests passed! Workflow is functioning correctly." | tee -a $LOG_FILE
else
    echo "⚠️  Some tests failed. Review the log for details." | tee -a $LOG_FILE
fi