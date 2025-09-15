#!/bin/bash

# Test PO Upload functionality
echo "=== Testing Customer PO Upload Functionality ==="

BASE_URL="http://localhost:5000"
QUOTATION_ID="e81b97bc-d43a-40c8-be6e-d278c2f48e5a"

# Step 1: Upload file
echo "1. Uploading test file..."
UPLOAD_RESULT=$(curl -s -X POST -F "file=@test-po.txt" "$BASE_URL/api/files/upload")
echo "Upload result: $UPLOAD_RESULT"

FILE_PATH=$(echo "$UPLOAD_RESULT" | jq -r '.files[0].path')
FILE_NAME=$(echo "$UPLOAD_RESULT" | jq -r '.files[0].name')
FILE_SIZE=$(echo "$UPLOAD_RESULT" | jq -r '.files[0].size')

echo "File path: $FILE_PATH"
echo "File name: $FILE_NAME"
echo "File size: $FILE_SIZE"

# Step 2: Create PO record
echo -e "\n2. Creating PO record..."
PO_PAYLOAD=$(cat <<PAYLOAD
{
  "quotationId": "$QUOTATION_ID",
  "poNumber": "TEST-PO-$(date +%s)",
  "documentPath": "$FILE_PATH",
  "documentName": "$FILE_NAME",
  "documentType": "TEXT",
  "documentSize": $FILE_SIZE
}
PAYLOAD
)

echo "PO Payload: $PO_PAYLOAD"

PO_RESULT=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PO_PAYLOAD" \
  "$BASE_URL/api/customer-po-upload")

PO_BODY=$(echo "$PO_RESULT" | head -n -1)
HTTP_CODE=$(echo "$PO_RESULT" | tail -n 1 | sed 's/HTTP_CODE://')

echo "HTTP Code: $HTTP_CODE"
echo "Response: $PO_BODY"

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ PO upload successful!"
  
  # Step 3: Verify PO was created
  echo -e "\n3. Verifying PO creation..."
  PO_ID=$(echo "$PO_BODY" | jq -r '.id')
  
  VERIFY_RESULT=$(curl -s "$BASE_URL/api/purchase-orders")
  PO_EXISTS=$(echo "$VERIFY_RESULT" | jq -r ".[] | select(.id == \"$PO_ID\") | .id")
  
  if [ "$PO_EXISTS" = "$PO_ID" ]; then
    echo "✅ PO record verified in database"
    echo "PO Details:"
    echo "$VERIFY_RESULT" | jq ".[] | select(.id == \"$PO_ID\")"
  else
    echo "❌ PO record not found in database"
  fi
else
  echo "❌ PO upload failed"
  echo "Error: $PO_BODY"
fi

echo -e "\n=== Test Complete ==="
