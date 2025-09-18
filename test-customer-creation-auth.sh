#!/bin/bash

# Test Customer Creation Flow
echo "=== Testing Customer Creation with Authentication ==="

BASE_URL="http://localhost:5000"
COOKIE_FILE="/tmp/test_cookies.txt"

# Clean up any previous cookies
rm -f "$COOKIE_FILE"

echo "1. Testing login..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Check if login was successful
if [[ "$LOGIN_RESPONSE" == *"\"success\":true"* ]] || [[ "$LOGIN_RESPONSE" == *"username"* ]]; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

echo -e "\n2. Testing customer creation..."
CUSTOMER_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890",
    "type": "Corporate",
    "address": "123 Test Street, Test City"
  }')

echo "Customer creation response: $CUSTOMER_RESPONSE"

# Check if customer creation was successful
if [[ "$CUSTOMER_RESPONSE" == *"\"id\""* ]] || [[ "$CUSTOMER_RESPONSE" == *"success"* ]]; then
  echo "✅ Customer creation successful"
else
  echo "❌ Customer creation failed"
  echo "Response details: $CUSTOMER_RESPONSE"
fi

echo -e "\n3. Testing customer list to verify creation..."
CUSTOMERS_LIST=$(curl -s -b "$COOKIE_FILE" -X GET "$BASE_URL/api/customers")
echo "Customers list response: $CUSTOMERS_LIST"

# Clean up
rm -f "$COOKIE_FILE"

echo -e "\n=== Test Complete ==="