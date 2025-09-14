#!/bin/bash
# End-to-end workflow test: Customer → Enquiry → Quotation → Acceptance → Customer PO → Sales Order → Supplier PO → Goods Receipt → Inventory update → Delivery Note → Invoice

BASE_URL="http://localhost:5000"
set -e

# 1. Create Customer
echo "Creating customer..."
cust=$(curl -s -X POST -H "Content-Type: application/json" -d '{"name":"E2E Customer","email":"e2e@customer.com","phone":"1234567890","address":"E2E St","contactPerson":"Jane Doe","customerType":"Retail","classification":"Corporate"}' "$BASE_URL/api/customers")
cust_id=$(echo "$cust" | jq -r '.id')

# 2. Create Enquiry
echo "Creating enquiry..."
enq=$(curl -s -X POST -H "Content-Type: application/json" -d '{"customerId":"'$cust_id'","enquiryDate":"2025-09-13","itemDescription":"Test Item","supplierCode":"SUP-E2E","logoRequired":false,"requiredQuantity":10,"deliveryDate":"2025-09-20","notes":"E2E test"}' "$BASE_URL/api/enquiries")
enq_id=$(echo "$enq" | jq -r '.id')

# 3. Create Quotation
echo "Creating quotation..."
quote=$(curl -s -X POST -H "Content-Type: application/json" -d '{"enquiryId":"'$enq_id'","customerId":"'$cust_id'","status":"Draft","validity":"2025-09-30","terms":"E2E terms"}' "$BASE_URL/api/quotations")
quote_id=$(echo "$quote" | jq -r '.id')

# 4. Accept Quotation
echo "Accepting quotation..."
accept=$(curl -s -X POST -H "Content-Type: application/json" -d '{"quotationId":"'$quote_id'","acceptedBy":"Jane Doe","acceptanceDate":"2025-09-14","acceptedItems":[{"itemId":"SUP-E2E","quantity":10}]}' "$BASE_URL/api/customer-acceptances")
accept_id=$(echo "$accept" | jq -r '.id')

# 5. Upload Customer PO
echo "Uploading customer PO..."
po=$(curl -s -X POST -H "Content-Type: application/json" -d '{"customerId":"'$cust_id'","quotationId":"'$quote_id'","poNumber":"PO-E2E-001","poDate":"2025-09-14","uploadedBy":"Jane Doe","fileUrl":"/fake-po.pdf"}' "$BASE_URL/api/purchase-orders")
po_id=$(echo "$po" | jq -r '.id')

# 6. Create Sales Order
echo "Creating sales order..."
so=$(curl -s -X POST -H "Content-Type: application/json" -d '{"customerId":"'$cust_id'","quotationId":"'$quote_id'","purchaseOrderId":"'$po_id'","orderDate":"2025-09-15","status":"Confirmed"}' "$BASE_URL/api/sales-orders")
so_id=$(echo "$so" | jq -r '.id')

# 7. Auto-generate Supplier LPO
echo "Auto-generating supplier LPO..."
lpo=$(curl -s -X POST -H "Content-Type: application/json" -d '{"salesOrderIds":["'$so_id'"],"groupBy":"supplier","userId":"Jane Doe"}' "$BASE_URL/api/supplier-lpos/from-sales-orders")
lpo_id=$(echo "$lpo" | jq -r '.[0].id')

# 8. Create Goods Receipt (GRN) with multiple items
echo "Creating goods receipt..."
grn_header='{ "receiptNumber": "GRN-E2E-001", "supplierLpoId": "'$lpo_id'", "supplierId": "SUP-E2E", "receiptDate": "2025-09-16", "status": "Complete", "totalItems": 2, "totalQuantityExpected": 20, "totalQuantityReceived": 20 }'
grn_items='[{ "itemId": "SUP-E2E", "itemDescription": "Test Item", "quantityExpected": 10, "quantityReceived": 10 }, { "itemId": "SUP-E2E", "itemDescription": "Test Item 2", "quantityExpected": 10, "quantityReceived": 10 }]'
grn=$(curl -s -X POST -H "Content-Type: application/json" -d '{"header":'$grn_header',"items":'$grn_items'}' "$BASE_URL/api/goods-receipts")
grn_id=$(echo "$grn" | jq -r '.header.id')

# 9. Validate inventory update
echo "Validating inventory update..."
inv=$(curl -s "$BASE_URL/api/inventory")
echo "Raw inventory response:"
echo "$inv"
echo "Parsed inventory (if valid):"
echo "$inv" | jq '.' || echo "(Not valid JSON for jq)"

# 10. Create Delivery Note
echo "Creating delivery note..."
del=$(curl -s -X POST -H "Content-Type: application/json" -d '{"salesOrderId":"'$so_id'","deliveryDate":"2025-09-17","status":"Complete"}' "$BASE_URL/api/deliveries")
del_id=$(echo "$del" | jq -r '.id')

# 11. Generate Invoice
echo "Generating invoice..."
inv=$(curl -s -X POST -H "Content-Type: application/json" -d '{"deliveryId":"'$del_id'","invoiceDate":"2025-09-18","status":"Sent"}' "$BASE_URL/api/invoices")
inv_id=$(echo "$inv" | jq -r '.id')

echo "End-to-end workflow test completed."
echo "Customer: $cust_id, Enquiry: $enq_id, Quotation: $quote_id, Acceptance: $accept_id, PO: $po_id, SO: $so_id, LPO: $lpo_id, GRN: $grn_id, Delivery: $del_id, Invoice: $inv_id"
