#!/bin/bash

echo "=== Direct PDF Generation Test ==="

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 5

# Test PDF generation with a simple GET request
echo "Testing PDF generation endpoint..."
curl -v -o test_invoice.pdf "http://localhost:5000/api/invoice/download?id=test-invoice" 2>&1

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