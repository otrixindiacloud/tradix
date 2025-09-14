#!/bin/bash

echo "=== Direct PDF Generation Test ==="

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 5

# Resolve an existing invoice ID
INVOICE_ID=$(curl -s "http://localhost:5000/api/invoices" | jq -r '.[0].id // empty')
if [ -z "$INVOICE_ID" ]; then
    echo "No invoices found via API. Cannot test invoice PDF endpoint. Create an invoice first."
    exit 1
fi

# Test PDF generation with the unified endpoint
echo "Testing invoice PDF endpoint (/api/invoices/$INVOICE_ID/pdf)..."
curl -s -D headers.txt -o test_invoice.pdf "http://localhost:5000/api/invoices/$INVOICE_ID/pdf" -w "HTTP_STATUS:%{http_code}\n"
grep -i "content-type" headers.txt || true

# Check if PDF was generated
if [ -f "test_invoice.pdf" ]; then
    file_size=$(stat -c%s "test_invoice.pdf" 2>/dev/null || stat -f%z "test_invoice.pdf")
    echo "✅ PDF generated successfully!"
    echo "📄 File size: $file_size bytes"
    
    # Check if it's a valid PDF
    if file test_invoice.pdf | grep -q "PDF"; then
        echo "✅ Valid PDF format confirmed"
    else
        echo "⚠️  File created but may not be valid PDF"
    fi
    
    # Show first few bytes to verify PDF header
    echo "📋 PDF header check:"
    head -c 20 test_invoice.pdf | xxd
    
else
    echo "❌ PDF generation failed"
fi

# Test basic API endpoint
echo -e "\nTesting basic API..."
response=$(curl -s -w "%{http_code}" "http://localhost:5000/api/dashboard/stats")
status="${response: -3}"
echo "Dashboard API status: $status"

echo -e "\n=== Test Complete ==="