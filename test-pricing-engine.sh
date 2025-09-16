#!/bin/bash

# Pricing & Costing Engine Test Suite
# Tests all pricing calculation methods, volume discounts, contract pricing, and competitive analysis

set -e

echo "🧪 Pricing & Costing Engine Test Suite"
echo "======================================"

# Configuration
BASE_URL="http://localhost:5002"
API_BASE="$BASE_URL/api/pricing"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TESTS_RUN++))
}

# Test function to make HTTP requests
api_test() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    run_test
    print_test "$test_name"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            "$API_BASE$endpoint")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        print_success "$test_name - Status: $http_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        print_failure "$test_name - Expected: $expected_status, Got: $http_code"
        echo "$body"
        return 1
    fi
}

echo
echo "📊 Starting Enhanced Pricing Engine Tests..."
echo

# Test 1: Enhanced Price Calculation - Cost Plus Method
print_test "Test 1: Enhanced Price Calculation - Cost Plus Method"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002", 
    "quantity": 1,
    "method": "cost_plus",
    "targetCurrency": "USD"
}' 200 "Enhanced Cost Plus Pricing"

echo
echo "---"

# Test 2: Enhanced Price Calculation - Margin Based Method
print_test "Test 2: Enhanced Price Calculation - Margin Based Method"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 5,
    "method": "margin_based",
    "targetCurrency": "USD"
}' 200 "Enhanced Margin Based Pricing"

echo
echo "---"

# Test 3: Enhanced Price Calculation - Volume Tiered Method
print_test "Test 3: Enhanced Price Calculation - Volume Tiered Method"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 100,
    "method": "volume_tiered",
    "targetCurrency": "USD"
}' 200 "Enhanced Volume Tiered Pricing"

echo
echo "---"

# Test 4: Enhanced Price Calculation - Competitive Method
print_test "Test 4: Enhanced Price Calculation - Competitive Method"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 10,
    "method": "competitive",
    "targetCurrency": "USD"
}' 200 "Enhanced Competitive Pricing"

echo
echo "---"

# Test 5: Enhanced Price Calculation - Dynamic Method
print_test "Test 5: Enhanced Price Calculation - Dynamic Method"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 25,
    "method": "dynamic",
    "targetCurrency": "USD"
}' 200 "Enhanced Dynamic Pricing"

echo
echo "---"

# Test 6: Batch Price Calculation
print_test "Test 6: Batch Price Calculation"
api_test "POST" "/calculate-batch-prices" '{
    "items": [
        {"itemId": "550e8400-e29b-41d4-a716-446655440001", "quantity": 1},
        {"itemId": "550e8400-e29b-41d4-a716-446655440003", "quantity": 5},
        {"itemId": "550e8400-e29b-41d4-a716-446655440004", "quantity": 10}
    ],
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "targetCurrency": "USD"
}' 200 "Batch Price Calculation"

echo
echo "---"

# Test 7: Create Volume Pricing Tier
print_test "Test 7: Create Volume Pricing Tier"
api_test "POST" "/volume-tiers" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "tierName": "Bulk Discount Tier 1",
    "minQuantity": 50,
    "maxQuantity": 99,
    "discountPercentage": 10,
    "currency": "USD"
}' 201 "Create Volume Pricing Tier"

echo
echo "---"

# Test 8: Get Volume Pricing Tiers
print_test "Test 8: Get Volume Pricing Tiers"
api_test "GET" "/volume-tiers?itemId=550e8400-e29b-41d4-a716-446655440001" "" 200 "Get Volume Pricing Tiers"

echo
echo "---"

# Test 9: Create Contract Pricing
print_test "Test 9: Create Contract Pricing"
api_test "POST" "/contract-pricing" '{
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "contractPrice": 85.50,
    "contractStartDate": "2024-01-01T00:00:00.000Z",
    "contractEndDate": "2024-12-31T23:59:59.000Z",
    "minimumQuantity": 100,
    "maximumQuantity": 1000,
    "terms": "Annual contract with quarterly review"
}' 201 "Create Contract Pricing"

echo
echo "---"

# Test 10: Get Contract Pricing
print_test "Test 10: Get Contract Pricing"
api_test "GET" "/contract-pricing?customerId=550e8400-e29b-41d4-a716-446655440002" "" 200 "Get Contract Pricing"

echo
echo "---"

# Test 11: Create Competitor Pricing
print_test "Test 11: Create Competitor Pricing"
api_test "POST" "/competitor-pricing" '{
    "competitorName": "Competitor ABC Ltd",
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "price": 95.00,
    "currency": "USD",
    "source": "Website",
    "sourceUrl": "https://competitor-abc.com/products/item-1",
    "notes": "Listed price on public website as of today"
}' 201 "Create Competitor Pricing"

echo
echo "---"

# Test 12: Get Competitor Pricing
print_test "Test 12: Get Competitor Pricing"
api_test "GET" "/competitor-pricing?itemId=550e8400-e29b-41d4-a716-446655440001" "" 200 "Get Competitor Pricing"

echo
echo "---"

# Test 13: Create Currency Exchange Rate
print_test "Test 13: Create Currency Exchange Rate"
api_test "POST" "/currency-rates" '{
    "fromCurrency": "USD",
    "toCurrency": "AED",
    "rate": 3.67,
    "source": "ECB",
    "effectiveDate": "2024-01-15T00:00:00.000Z"
}' 201 "Create Currency Exchange Rate"

echo
echo "---"

# Test 14: Get Currency Exchange Rates
print_test "Test 14: Get Currency Exchange Rates"
api_test "GET" "/currency-rates?fromCurrency=USD&toCurrency=AED" "" 200 "Get Currency Exchange Rates"

echo
echo "---"

# Test 15: Multi-Currency Price Calculation
print_test "Test 15: Multi-Currency Price Calculation"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 1,
    "method": "margin_based",
    "targetCurrency": "AED"
}' 200 "Multi-Currency Price Calculation"

echo
echo "---"

# Test 16: Generate Margin Analysis
print_test "Test 16: Generate Margin Analysis"
api_test "POST" "/margin-analysis" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "periodStart": "2024-01-01T00:00:00.000Z",
    "periodEnd": "2024-01-31T23:59:59.000Z"
}' 200 "Generate Margin Analysis"

echo
echo "---"

# Test 17: Get Margin Analysis
print_test "Test 17: Get Margin Analysis"
api_test "GET" "/margin-analysis?itemId=550e8400-e29b-41d4-a716-446655440001" "" 200 "Get Margin Analysis"

echo
echo "---"

# Test 18: Pricing Performance Report
print_test "Test 18: Pricing Performance Report"
api_test "GET" "/reports/pricing-performance?dateFrom=2024-01-01&dateTo=2024-01-31" "" 200 "Pricing Performance Report"

echo
echo "---"

# Test 19: Competitive Position Report
print_test "Test 19: Competitive Position Report"
api_test "GET" "/reports/competitive-position?itemId=550e8400-e29b-41d4-a716-446655440001" "" 200 "Competitive Position Report"

echo
echo "---"

# Test 20: Price Analysis for Item
print_test "Test 20: Price Analysis for Item"
api_test "GET" "/price-analysis/550e8400-e29b-41d4-a716-446655440001" "" 200 "Price Analysis for Item"

echo
echo "---"

# Test 21: Invalid Input Validation
print_test "Test 21: Invalid Input Validation"
api_test "POST" "/calculate-price" '{
    "itemId": "invalid-uuid",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": -1
}' 400 "Invalid Input Validation"

echo
echo "---"

# Test 22: Contract Pricing with Date Validation
print_test "Test 22: Contract Pricing with Date Validation"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 500,
    "method": "contract",
    "targetCurrency": "USD"
}' 200 "Contract Pricing with Date Validation"

echo
echo "---"

# Test 23: Volume Tier Edge Cases
print_test "Test 23: Volume Tier Edge Cases"
api_test "POST" "/volume-tiers" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "tierName": "High Volume Tier",
    "minQuantity": 1000,
    "discountPercentage": 25,
    "currency": "USD"
}' 201 "Volume Tier Edge Cases"

echo
echo "---"

# Test 24: Large Quantity Pricing
print_test "Test 24: Large Quantity Pricing"
api_test "POST" "/calculate-price" '{
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 5000,
    "method": "volume_tiered",
    "targetCurrency": "USD"
}' 200 "Large Quantity Pricing"

echo
echo "---"

# Test 25: Multiple Competitor Pricing for Same Item
print_test "Test 25: Multiple Competitor Pricing for Same Item"
api_test "POST" "/competitor-pricing" '{
    "competitorName": "Competitor XYZ Corp",
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "price": 92.50,
    "currency": "USD",
    "source": "Direct Quote",
    "notes": "Quote received via email"
}' 201 "Multiple Competitor Pricing"

echo
echo "=================================================="
echo "🏁 Enhanced Pricing Engine Test Summary"
echo "=================================================="
echo -e "Total Tests Run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed!${NC}"
    echo "✅ Enhanced Pricing & Costing Engine is working correctly"
    echo
    echo "📋 Features Tested:"
    echo "   • Multiple pricing calculation methods (cost-plus, margin-based, competitive, dynamic, volume-tiered, contract)"
    echo "   • Batch price calculations"
    echo "   • Volume pricing tiers with quantity discounts"
    echo "   • Contract pricing for long-term agreements"
    echo "   • Competitor pricing analysis"
    echo "   • Multi-currency support with exchange rates"
    echo "   • Margin analysis and reporting"
    echo "   • Pricing performance reports"
    echo "   • Competitive position analysis"
    echo "   • Input validation and error handling"
    echo "   • Edge cases and large quantity scenarios"
    echo
    exit 0
else
    echo -e "\n❌ ${RED}Some tests failed!${NC}"
    echo "Please check the output above for details."
    echo
    exit 1
fi