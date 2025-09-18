#!/bin/bash

# Test script to verify proforma generation functionality
BASE_URL="http://localhost:5000"
LOG_FILE="proforma-test.log"

echo "🧪 Testing Proforma Invoice Generation" | tee $LOG_FILE
echo "======================================" | tee -a $LOG_FILE

# First, let's check if there are any invoices
echo "📋 Checking existing invoices..." | tee -a $LOG_FILE
existing_invoices=$(curl -s "$BASE_URL/api/invoices" | jq '. | length' 2>/dev/null)
echo "   Found $existing_invoices existing invoices" | tee -a $LOG_FILE

# Check for sales orders to use for proforma generation
echo "📋 Checking for sales orders..." | tee -a $LOG_FILE
sales_orders=$(curl -s "$BASE_URL/api/sales-orders" | jq '. | length' 2>/dev/null)
echo "   Found $sales_orders sales orders" | tee -a $LOG_FILE

if [ "$sales_orders" -gt 0 ]; then
    # Get the first sales order ID
    so_id=$(curl -s "$BASE_URL/api/sales-orders" | jq -r '.[0].id' 2>/dev/null)
    echo "   Using sales order: $so_id" | tee -a $LOG_FILE
    
    # Test proforma generation
    echo "🧪 Testing proforma generation..." | tee -a $LOG_FILE
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/invoices/generate-proforma" \
        -H "Content-Type: application/json" \
        -d "{\"salesOrderId\": \"$so_id\"}" 2>/dev/null)
    
    response_body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -1)
    
    if [ "$status_code" = "201" ]; then
        echo "   ✅ PASS - Proforma invoice generated successfully" | tee -a $LOG_FILE
        invoice_id=$(echo "$response_body" | jq -r '.id' 2>/dev/null)
        echo "   Generated invoice ID: $invoice_id" | tee -a $LOG_FILE
        
        # Now test PDF generation
        echo "🧪 Testing proforma PDF generation..." | tee -a $LOG_FILE
        pdf_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/$invoice_id/pdf" 2>/dev/null)
        pdf_code=$(echo "$pdf_response" | tail -1)
        
        if [ "$pdf_code" = "200" ]; then
            echo "   ✅ PASS - Proforma PDF generates successfully" | tee -a $LOG_FILE
        else
            echo "   ❌ FAIL - Proforma PDF generation failed ($pdf_code)" | tee -a $LOG_FILE
            echo "   Response: $(echo "$pdf_response" | head -n -1)" | tee -a $LOG_FILE
        fi
    else
        echo "   ❌ FAIL - Proforma generation failed ($status_code)" | tee -a $LOG_FILE
        echo "   Response: $response_body" | tee -a $LOG_FILE
    fi
else
    echo "   ⚠️  No sales orders found - creating test data..." | tee -a $LOG_FILE
    
    # Create a test customer first
    customer_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/customers" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Customer for Proforma",
            "customerType": "Corporate",
            "email": "test@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street"
        }' 2>/dev/null)
    
    customer_code=$(echo "$customer_response" | tail -1)
    if [ "$customer_code" = "201" ]; then
        customer_id=$(echo "$customer_response" | head -n -1 | jq -r '.id' 2>/dev/null)
        echo "   Created test customer: $customer_id" | tee -a $LOG_FILE
        
        # Create a test quotation
        quote_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/quotations" \
            -H "Content-Type: application/json" \
            -d "{
                \"customerId\": \"$customer_id\",
                \"validUntil\": \"$(date -d '+30 days' -I)\",
                \"notes\": \"Test quotation for proforma generation\"
            }" 2>/dev/null)
        
        quote_code=$(echo "$quote_response" | tail -1)
        if [ "$quote_code" = "201" ]; then
            quote_id=$(echo "$quote_response" | head -n -1 | jq -r '.id' 2>/dev/null)
            echo "   Created test quotation: $quote_id" | tee -a $LOG_FILE
            echo "   ℹ️  Test data created. Manual sales order creation needed for full test." | tee -a $LOG_FILE
        fi
    fi
fi

echo "🏁 Test completed. Check $LOG_FILE for details." | tee -a $LOG_FILE