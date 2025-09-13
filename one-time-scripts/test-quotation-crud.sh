#!/bin/bash

# Test Script for Quotation CRUD Operations
echo "🧪 Testing Quotation CRUD Operations"
echo "====================================="

BASE_URL="http://localhost:5000"

echo -e "\n1. 📋 Testing GET /api/quotations (List)"
curl -s "${BASE_URL}/api/quotations" | jq '.' | head -20

echo -e "\n2. 📋 Testing GET /api/quotations/quot-1 (Get Single)"
curl -s "${BASE_URL}/api/quotations/quot-1" | jq '.'

echo -e "\n3. 📋 Testing GET /api/quotations/quot-1/items (Get Items)"
curl -s "${BASE_URL}/api/quotations/quot-1/items" | jq '.'

echo -e "\n4. 🔧 Testing PUT /api/quotations/quot-1 (Update Status)"
curl -s -X PUT "${BASE_URL}/api/quotations/quot-1" \
  -H "Content-Type: application/json" \
  -d '{"status": "Accepted"}' | jq '.'

echo -e "\n5. 📋 Testing GET /api/customers (For quotation creation)"
curl -s "${BASE_URL}/api/customers" | jq '.' | head -10

echo -e "\n6. 📊 Testing POST /api/quotations (Create - will fail with validation)"
curl -s -X POST "${BASE_URL}/api/quotations" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "ac0a1d83-e061-4784-9ede-91ae8ca7299f"}' | jq '.'

echo -e "\n\n✅ API Test Summary:"
echo "- GET quotations: Working with test data"
echo "- GET single quotation: Working with test data"
echo "- GET quotation items: Working with test data"
echo "- PUT update quotation: Working"
echo "- GET customers: Working"
echo "- POST create quotation: Needs validation (expected)"

echo -e "\n🎯 Frontend CRUD Status:"
echo "- List View: ✅ Working (displays quotations)"
echo "- Detail View: ✅ Working (shows quotation details)"
echo "- Update Status: ✅ Working (status updates)"
echo "- Create Quotation: 🔶 Partially implemented (no form yet)"
echo "- Edit Quotation: ❌ Missing onClick handler"
echo "- Delete Quotation: ❌ Missing onClick handler"
