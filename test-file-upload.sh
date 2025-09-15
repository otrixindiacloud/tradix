#!/bin/bash

# Test file upload and download functionality for enquiry documents

echo "Testing File Upload and Download Functionality"
echo "=============================================="

# Base URL
BASE_URL="http://localhost:5000"

# Create a test file
echo "Creating test file..."
echo "This is a test document for enquiry attachment testing." > test-enquiry-doc.txt

# Test file upload
echo "Testing file upload..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/files/upload" \
  -F "files=@test-enquiry-doc.txt" \
  -H "Content-Type: multipart/form-data")

echo "Upload response: $UPLOAD_RESPONSE"

# Extract filename from response (assuming JSON response)
FILENAME=$(echo $UPLOAD_RESPONSE | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)

if [ -z "$FILENAME" ]; then
  echo "❌ Upload failed - no filename in response"
  exit 1
fi

echo "✅ File uploaded successfully: $FILENAME"

# Test file download
echo "Testing file download..."
DOWNLOAD_URL="$BASE_URL/api/files/download/$FILENAME"
curl -s -o downloaded-test-file.txt "$DOWNLOAD_URL"

if [ -f "downloaded-test-file.txt" ]; then
  echo "✅ File downloaded successfully"
  
  # Compare files
  if cmp -s test-enquiry-doc.txt downloaded-test-file.txt; then
    echo "✅ Downloaded file matches original"
  else
    echo "❌ Downloaded file does not match original"
  fi
else
  echo "❌ File download failed"
fi

# Test file info
echo "Testing file info..."
INFO_RESPONSE=$(curl -s "$BASE_URL/api/files/info/$FILENAME")
echo "File info: $INFO_RESPONSE"

# Create an enquiry to test attachment functionality
echo "Testing enquiry with attachments..."

# First create a customer
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer for File Upload",
    "customerType": "Corporate",
    "email": "test@example.com",
    "phone": "+1234567890"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CUSTOMER_ID" ]; then
  echo "❌ Failed to create test customer"
  exit 1
fi

echo "✅ Created test customer: $CUSTOMER_ID"

# Create an enquiry
ENQUIRY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"source\": \"Web Form\",
    \"notes\": \"Test enquiry for file upload functionality\"
  }")

ENQUIRY_ID=$(echo $ENQUIRY_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ENQUIRY_ID" ]; then
  echo "❌ Failed to create test enquiry"
  exit 1
fi

echo "✅ Created test enquiry: $ENQUIRY_ID"

# Upload file info to enquiry's attachment field
echo "Updating enquiry with attachment..."

ATTACHMENT_JSON="[{
  \"id\": \"$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)\",
  \"name\": \"test-enquiry-doc.txt\",
  \"filename\": \"$FILENAME\",
  \"size\": $(stat -c%s test-enquiry-doc.txt),
  \"type\": \"text/plain\",
  \"url\": \"/api/files/download/$FILENAME\",
  \"uploadedAt\": \"$(date -Iseconds)\"
}]"

ATTACHMENT_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/enquiries/$ENQUIRY_ID/attachments" \
  -H "Content-Type: application/json" \
  -d "{\"attachments\": $ATTACHMENT_JSON}")

echo "Attachment update response: $ATTACHMENT_RESPONSE"

# Verify enquiry has attachment
echo "Verifying enquiry attachment..."
ENQUIRY_GET_RESPONSE=$(curl -s "$BASE_URL/api/enquiries/$ENQUIRY_ID")

if echo $ENQUIRY_GET_RESPONSE | grep -q "$FILENAME"; then
  echo "✅ Enquiry attachment saved successfully"
else
  echo "❌ Enquiry attachment not found"
fi

# Clean up
echo "Cleaning up..."
rm -f test-enquiry-doc.txt downloaded-test-file.txt

# Delete the test file from server
curl -s -X DELETE "$BASE_URL/api/files/$FILENAME"

echo "🎉 File upload and download test completed!"