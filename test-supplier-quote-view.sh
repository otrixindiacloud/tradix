#!/bin/bash

# Test script to verify supplier quote view button functionality
echo "Testing Supplier Quote View Button Functionality"
echo "================================================"

# Start timestamp
START_TIME=$(date +%Y%m%d_%H%M%S)
echo "Test started at: $(date)"

# Check if server is running
SERVER_PORT=5000
echo "Checking if server is running on port $SERVER_PORT..."

if ! nc -z localhost $SERVER_PORT; then
    echo "❌ Server is not running on port $SERVER_PORT"
    echo "Starting development server..."
    cd /workspaces/tradix
    npm run dev &
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
    
    # Wait for server to start
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if nc -z localhost $SERVER_PORT; then
            echo "✅ Server is now running on port $SERVER_PORT"
            break
        fi
        sleep 1
    done
    
    if ! nc -z localhost $SERVER_PORT; then
        echo "❌ Server failed to start within 30 seconds"
        exit 1
    fi
else
    echo "✅ Server is already running on port $SERVER_PORT"
fi

# Test API endpoints
echo ""
echo "Testing Supplier Quotes API..."

# Test GET /api/supplier-quotes
echo "1. Testing GET /api/supplier-quotes..."
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/supplier_quotes_response.json http://localhost:$SERVER_PORT/api/supplier-quotes)
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ GET /api/supplier-quotes returned 200"
    QUOTE_COUNT=$(jq length /tmp/supplier_quotes_response.json 2>/dev/null || echo "0")
    echo "   Found $QUOTE_COUNT supplier quotes"
    
    # Get the first quote ID for testing detail view
    if [ "$QUOTE_COUNT" -gt 0 ]; then
        FIRST_QUOTE_ID=$(jq -r '.[0].id' /tmp/supplier_quotes_response.json 2>/dev/null)
        echo "   First quote ID: $FIRST_QUOTE_ID"
        
        # Test the detail endpoint
        echo ""
        echo "2. Testing GET /api/supplier-quotes/$FIRST_QUOTE_ID..."
        DETAIL_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/supplier_quote_detail_response.json http://localhost:$SERVER_PORT/api/supplier-quotes/$FIRST_QUOTE_ID)
        DETAIL_HTTP_CODE="${DETAIL_RESPONSE: -3}"
        
        if [ "$DETAIL_HTTP_CODE" = "200" ]; then
            echo "✅ GET /api/supplier-quotes/$FIRST_QUOTE_ID returned 200"
            echo "   Detail page API is working correctly"
        else
            echo "❌ GET /api/supplier-quotes/$FIRST_QUOTE_ID returned $DETAIL_HTTP_CODE"
            echo "   Response: $(cat /tmp/supplier_quote_detail_response.json)"
        fi
    else
        echo "⚠️  No supplier quotes found to test detail view"
    fi
else
    echo "❌ GET /api/supplier-quotes returned $HTTP_CODE"
    echo "   Response: $(cat /tmp/supplier_quotes_response.json)"
fi

# Test the frontend routing
echo ""
echo "3. Testing Frontend Routing..."

# Check if the supplier quotes page is accessible
echo "Testing /supplier-quotes page..."
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/frontend_response.html http://localhost:3000/supplier-quotes 2>/dev/null)
FRONTEND_HTTP_CODE="${FRONTEND_RESPONSE: -3}"

if [ "$FRONTEND_HTTP_CODE" = "200" ]; then
    echo "✅ Frontend /supplier-quotes page is accessible"
else
    echo "⚠️  Frontend might not be running on port 3000 (HTTP $FRONTEND_HTTP_CODE)"
fi

# Test the view button functionality in the source code
echo ""
echo "4. Analyzing View Button Implementation..."

# Check if the view button navigation is correctly implemented
VIEW_BUTTON_CHECK=$(grep -n "navigate.*supplier-quotes.*\${quote\.id}" /workspaces/tradix/client/src/pages/supplier-quotes.tsx)
if [ ! -z "$VIEW_BUTTON_CHECK" ]; then
    echo "✅ View button navigation is correctly implemented:"
    echo "   $VIEW_BUTTON_CHECK"
else
    echo "❌ View button navigation not found or incorrectly implemented"
fi

# Check if the route is defined in App.tsx
ROUTE_CHECK=$(grep -n "/supplier-quotes/:id" /workspaces/tradix/client/src/App.tsx)
if [ ! -z "$ROUTE_CHECK" ]; then
    echo "✅ Route /supplier-quotes/:id is defined in App.tsx:"
    echo "   $ROUTE_CHECK"
else
    echo "❌ Route /supplier-quotes/:id not found in App.tsx"
fi

# Check if the detail component exists and is properly imported
COMPONENT_CHECK=$(grep -n "SupplierQuoteDetail" /workspaces/tradix/client/src/App.tsx)
if [ ! -z "$COMPONENT_CHECK" ]; then
    echo "✅ SupplierQuoteDetail component is imported and used:"
    echo "   $COMPONENT_CHECK"
else
    echo "❌ SupplierQuoteDetail component not found in App.tsx"
fi

echo ""
echo "5. Summary of Findings:"
echo "======================="

# Summary based on checks
if [ "$HTTP_CODE" = "200" ] && [ ! -z "$VIEW_BUTTON_CHECK" ] && [ ! -z "$ROUTE_CHECK" ] && [ ! -z "$COMPONENT_CHECK" ]; then
    echo "✅ Supplier Quote View Button Functionality: WORKING"
    echo "   - API endpoint is accessible"
    echo "   - View button navigation is correctly implemented"
    echo "   - Route is properly defined"
    echo "   - Detail component is properly imported"
    
    if [ "$QUOTE_COUNT" -gt 0 ] && [ "$DETAIL_HTTP_CODE" = "200" ]; then
        echo "   - Detail API endpoint is working"
    fi
else
    echo "❌ Supplier Quote View Button Functionality: ISSUES FOUND"
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo "   - API endpoint not accessible"
    fi
    
    if [ -z "$VIEW_BUTTON_CHECK" ]; then
        echo "   - View button navigation implementation missing"
    fi
    
    if [ -z "$ROUTE_CHECK" ]; then
        echo "   - Route definition missing"
    fi
    
    if [ -z "$COMPONENT_CHECK" ]; then
        echo "   - Detail component not properly imported"
    fi
fi

echo ""
echo "Test completed at: $(date)"
echo "Log files generated:"
echo "- /tmp/supplier_quotes_response.json"
echo "- /tmp/supplier_quote_detail_response.json (if applicable)"
echo "- /tmp/frontend_response.html (if applicable)"

# Clean up background process if we started it
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "Stopping development server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
fi