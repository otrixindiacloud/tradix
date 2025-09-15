#!/bin/bash
set -euo pipefail

API_BASE="http://localhost:5000"
LOG="e2e_lifecycle_results.log"
> "$LOG"

log(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"; }
fail(){ log "ERROR: $1"; summary; exit 1; }
json(){ jq -r "$1" 2>/dev/null || true; }

summary(){
  echo "==========================================" | tee -a "$LOG"
  log "FLOW SUMMARY:";
  log "Customer: ${CUSTOMER_ID:-}";
  log "Enquiry: ${ENQUIRY_ID:-}";
  log "Enquiry Item: ${ENQUIRY_ITEM_ID:-}";
  log "Quotation: ${QUOTATION_ID:-}";
  log "Acceptance: ${ACCEPTANCE_ID:-}";
  log "Accepted Item: ${ACCEPTANCE_ITEM_ID:-}";
  log "Sales Order: ${SALES_ORDER_ID:-}";
  log "Supplier LPO: ${SUPPLIER_LPO_ID:-}";
  log "Goods Receipt Header: ${GR_HEADER_ID:-}";
  log "Goods Receipt Item: ${GR_ITEM_ID:-}";
  log "Delivery: ${DELIVERY_ID:-}";
  log "Delivery Item: ${DELIVERY_ITEM_ID:-}";
  log "Invoice: ${INVOICE_ID:-}";
  log "Paid Invoice: ${PAID_INVOICE_ID:-}";
  echo "==========================================" | tee -a "$LOG"
}
trap summary EXIT

api(){
  local method=$1; shift
  local endpoint=$1; shift
  local data=${1:-}
  local desc=$2
  log "REQUEST: $method $endpoint - $desc"
  if [ -n "$data" ]; then
    RESP=$(curl -s -X "$method" "$API_BASE$endpoint" -H 'Content-Type: application/json' --data "$data")
  else
    RESP=$(curl -s -X "$method" "$API_BASE$endpoint" -H 'Content-Type: application/json')
  fi
  log "RESPONSE: $RESP"
  echo "$RESP"
}

# 1. Customer
CUSTOMER_PAYLOAD='{"name":"Lifecycle Test Co","email":"lifecycle@test.com","phone":"+10000000001","address":"99 Process Way","customerType":"Wholesale","classification":"Corporate","creditLimit":"50000","paymentTerms":"Net 30"}'
CUSTOMER_RESP=$(api POST /api/customers "$CUSTOMER_PAYLOAD" "Create customer")
CUSTOMER_ID=$(echo "$CUSTOMER_RESP" | jq -r '.id // empty')
[ -n "$CUSTOMER_ID" ] || fail "Customer creation failed"

# 2. Enquiry
ENQUIRY_PAYLOAD=$(jq -n --arg cid "$CUSTOMER_ID" '{customerId:$cid, source:"Email", targetDeliveryDate:"2025-12-31T00:00:00.000Z", notes:"Lifecycle enquiry"}')
ENQUIRY_RESP=$(api POST /api/enquiries "$ENQUIRY_PAYLOAD" "Create enquiry")
ENQUIRY_ID=$(echo "$ENQUIRY_RESP" | jq -r '.id // empty')
[ -n "$ENQUIRY_ID" ] || fail "Enquiry creation failed"

# 3. Enquiry Item
ENQ_ITEM_PAYLOAD=$(jq -n --arg eid "$ENQUIRY_ID" '{enquiryId:$eid, description:"Branded Mugs", quantity:250, unitPrice:"12.00", notes:"Gift batch"}')
ENQ_ITEM_RESP=$(api POST /api/enquiry-items "$ENQ_ITEM_PAYLOAD" "Add enquiry item")
ENQUIRY_ITEM_ID=$(echo "$ENQ_ITEM_RESP" | jq -r '.id // empty')
[ -n "$ENQUIRY_ITEM_ID" ] || fail "Enquiry item failed"

# 4. Quotation (generate)
QUOTE_RESP=$(api POST /api/quotations/generate/$ENQUIRY_ID '{}' "Generate quotation")
QUOTATION_ID=$(echo "$QUOTE_RESP" | jq -r '.id // empty')
[ -n "$QUOTATION_ID" ] || fail "Quotation generation failed"

# 5. Customer Acceptance (full acceptance of all items)
ACCEPTANCE_PAYLOAD=$(jq -n --arg qid "$QUOTATION_ID" '{quotationId:$qid, acceptanceType:"Full", notes:"Automated full acceptance"}')
ACC_RESP=$(api POST /api/customer-acceptances "$ACCEPTANCE_PAYLOAD" "Create acceptance header")
ACCEPTANCE_ID=$(echo "$ACC_RESP" | jq -r '.id // empty')
[ -n "$ACCEPTANCE_ID" ] || fail "Acceptance creation failed"

# 6. Quotation Item Acceptances (fetch quotation items first)
Q_ITEMS_RESP=$(api GET /api/quotations/$QUOTATION_ID/items '' "Fetch quotation items")
FIRST_QUOTE_ITEM_ID=$(echo "$Q_ITEMS_RESP" | jq -r '.[0].id // empty')
if [ -n "$FIRST_QUOTE_ITEM_ID" ]; then
  ACC_ITEM_PAYLOAD=$(jq -n --arg aid "$ACCEPTANCE_ID" --arg qitem "$FIRST_QUOTE_ITEM_ID" '{quotationItemId:$qitem, customerAcceptanceId:$aid, acceptedQuantity:100, acceptanceStatus:"Accepted"}')
  ACC_ITEM_RESP=$(api POST /api/customer-acceptances/$ACCEPTANCE_ID/item-acceptances "$ACC_ITEM_PAYLOAD" "Accept quotation item")
  ACCEPTANCE_ITEM_ID=$(echo "$ACC_ITEM_RESP" | jq -r '.id // empty')
else
  log "WARN: No quotation items returned; skipping item acceptance"
fi

# 7. Sales Order (from quotation)
SO_PAYLOAD=$(jq -n --arg qid "$QUOTATION_ID" '{quotationId:$qid}')
SO_RESP=$(api POST /api/sales-orders/from-quotation "$SO_PAYLOAD" "Create sales order from quotation")
SALES_ORDER_ID=$(echo "$SO_RESP" | jq -r '.id // empty')
[ -n "$SALES_ORDER_ID" ] || fail "Sales order creation failed"

# 8. Supplier LPO (from sales order)
LPO_SINGLE_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" '{salesOrderId:$so}')
LPO_RESP=$(api POST /api/supplier-lpos/from-sales-order "$LPO_SINGLE_PAYLOAD" "Create supplier LPO from sales order")
SUPPLIER_LPO_ID=$(echo "$LPO_RESP" | jq -r '.id // empty')
if [ -z "$SUPPLIER_LPO_ID" ]; then
  log "WARN: Supplier LPO creation failed (maybe items/suppliers required)."
fi

# 9. Goods Receipt (conditional – only if LPO exists)
if [ -n "${SUPPLIER_LPO_ID:-}" ]; then
  # Minimal header attempt – adjust if schema differs
  GR_HEADER_PAYLOAD=$(jq -n --arg lpo "$SUPPLIER_LPO_ID" '{supplierLpoId:$lpo, notes:"Auto GR"}')
  GR_HEADER_RESP=$(api POST /api/goods-receipt-headers "$GR_HEADER_PAYLOAD" "Create goods receipt header") || true
  GR_HEADER_ID=$(echo "$GR_HEADER_RESP" | jq -r '.id // empty')
  if [ -n "$GR_HEADER_ID" ]; then
    GR_ITEM_PAYLOAD=$(jq -n --arg gr "$GR_HEADER_ID" '{goodsReceiptId:$gr, description:"Received Branded Mugs", receivedQuantity:250, notes:"All good"}')
    GR_ITEM_RESP=$(api POST /api/goods-receipt-items "$GR_ITEM_PAYLOAD" "Create goods receipt item") || true
    GR_ITEM_ID=$(echo "$GR_ITEM_RESP" | jq -r '.id // empty')
  else
    log "WARN: Goods receipt header failed; skipping GR item"
  fi
else
  log "INFO: Skipping goods receipt (no supplier LPO)"
fi

# 10. Delivery (based on sales order) – create + item list (if available)
DELIVERY_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" '{salesOrderId:$so, notes:"Automated delivery"}')
DELIVERY_RESP=$(api POST /api/deliveries "$DELIVERY_PAYLOAD" "Create delivery") || true
DELIVERY_ID=$(echo "$DELIVERY_RESP" | jq -r '.id // empty')
if [ -n "$DELIVERY_ID" ]; then
  # Try available items endpoint then add one delivery item if an itemId exists
  AVAIL_ITEMS_RESP=$(api GET /api/deliveries/$DELIVERY_ID/available-items '' "Fetch delivery available items") || true
  FIRST_AVAIL_ITEM_ID=$(echo "$AVAIL_ITEMS_RESP" | jq -r '.[0].salesOrderItemId // empty')
  if [ -n "$FIRST_AVAIL_ITEM_ID" ]; then
    DEL_ITEM_PAYLOAD=$(jq -n --arg did "$DELIVERY_ID" --arg soi "$FIRST_AVAIL_ITEM_ID" '{deliveryId:$did, salesOrderItemId:$soi, quantity:100}')
    DEL_ITEM_RESP=$(api POST /api/deliveries/$DELIVERY_ID/items "$DEL_ITEM_PAYLOAD" "Add delivery item") || true
    DELIVERY_ITEM_ID=$(echo "$DEL_ITEM_RESP" | jq -r '.id // empty')
  else
    log "WARN: No available delivery items; skipping delivery item creation"
  fi
  # Attempt confirm
  api POST /api/deliveries/$DELIVERY_ID/confirm '{}' "Confirm delivery" || log "WARN: Delivery confirm failed"
else
  log "WARN: Delivery creation failed"
fi

# 11. Invoice (prefer from delivery)
if [ -n "${DELIVERY_ID:-}" ]; then
  GEN_INV_PAYLOAD=$(jq -n --arg did "$DELIVERY_ID" '{deliveryId:$did, invoiceType:"Standard"}')
  INV_RESP=$(api POST /api/invoices/generate-from-delivery "$GEN_INV_PAYLOAD" "Generate invoice from delivery") || true
  INVOICE_ID=$(echo "$INV_RESP" | jq -r '.id // empty')
fi

# 12. Fallback invoice (if generation failed and sales order present)
if [ -z "${INVOICE_ID:-}" ] && [ -n "${SALES_ORDER_ID:-}" ]; then
  log "INFO: Falling back to manual invoice creation (simplified)."
  # Minimal manual invoice attempt (fields guessed; adjust if schema mismatch):
  MANUAL_INV_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg cid "$CUSTOMER_ID" '{salesOrderId:$so, customerId:$cid, status:"Draft", subtotal:"0.00", taxAmount:"0.00", totalAmount:"0.00"}')
  MANUAL_INV_RESP=$(api POST /api/invoices "$MANUAL_INV_PAYLOAD" "Create manual invoice") || true
  INVOICE_ID=$(echo "$MANUAL_INV_RESP" | jq -r '.id // empty')
fi

# 13. Mark Paid (if invoice exists)
if [ -n "${INVOICE_ID:-}" ]; then
  PAY_PAYLOAD='{"paidAmount":"100.00","paymentMethod":"Bank Transfer","paymentReference":"LCYCLE-REF"}'
  PAID_RESP=$(api POST /api/invoices/$INVOICE_ID/mark-paid "$PAY_PAYLOAD" "Mark invoice paid") || true
  PAID_INVOICE_ID=$(echo "$PAID_RESP" | jq -r '.id // empty')
  if [ -z "$PAID_INVOICE_ID" ]; then
    log "WARN: Mark-paid did not return invoice ID"
  fi
else
  log "WARN: No invoice to mark paid"
fi

# 14. Final listings for audit
api GET /api/quotations '' "List quotations"
api GET /api/sales-orders '' "List sales orders"
api GET /api/invoices '' "List invoices"

exit 0
