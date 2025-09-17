#!/bin/bash

echo "=== Supplier Quote Detail Page Test ==="
echo "Date: $(date)"
echo ""

# Test if server is running
echo "🔍 Checking if server is running on port 5000..."
if lsof -i :5000 > /dev/null 2>&1; then
    echo "✅ Server is running on port 5000"
else
    echo "❌ Server is NOT running on port 5000"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo ""
echo "🧪 Testing Supplier Quote routes..."

# Test main supplier quotes page
echo "📋 Testing main supplier quotes list..."
response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5000/supplier-quotes")
if [ "$response" = "200" ]; then
    echo "✅ /supplier-quotes returns 200 OK"
else
    echo "❌ /supplier-quotes returns $response"
fi

# Test supplier quote detail pages
echo "📄 Testing supplier quote detail pages..."
quotes=("sq-2024-001" "sq-2024-002")

for quote_id in "${quotes[@]}"; do
    echo "   Testing /supplier-quotes/$quote_id..."
    response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5000/supplier-quotes/$quote_id")
    if [ "$response" = "200" ]; then
        echo "   ✅ /supplier-quotes/$quote_id returns 200 OK"
    else
        echo "   ❌ /supplier-quotes/$quote_id returns $response"
    fi
done

echo ""
echo "🔗 Test URLs:"
echo "Main page: http://localhost:5000/supplier-quotes"
echo "Detail 1:  http://localhost:5000/supplier-quotes/sq-2024-001"
echo "Detail 2:  http://localhost:5000/supplier-quotes/sq-2024-002"
echo ""

echo "🌐 Opening test page in browser..."
if command -v xdg-open > /dev/null; then
    xdg-open "file://$(pwd)/test-supplier-quote-detail.html"
elif command -v open > /dev/null; then
    open "file://$(pwd)/test-supplier-quote-detail.html"
else
    echo "Please open test-supplier-quote-detail.html in your browser manually"
fi

echo ""
echo "✨ Test completed! Check the browser for visual verification."