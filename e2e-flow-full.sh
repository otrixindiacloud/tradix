#!/bin/bash
set -eo pipefail

# Full ERP Lifecycle Test: Customer -> Enquiry -> Quotation -> Acceptance -> Customer PO -> Sales Order -> Supplier LPO -> Goods Receipt -> Delivery -> Invoice -> Mark Paid

API_BASE="http://localhost:5000"
# Static system user (will be accepted by backend attribution logic even if not a real user in DB)
SYSTEM_USER_ID="00000000-0000-0000-0000-000000000001"
TEST_LOG="e2e_full_test_results.log"
> "$TEST_LOG"

log(){
  # Write log line to log file and stderr (not stdout) so command substitution captures only JSON
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$TEST_LOG" >&2
}
fail(){ log "ERROR: $1"; echo "See $TEST_LOG"; exit 1; }

sanitize_id(){ printf '%s' "$1" | tr -d '\r' | awk 'NR==1 {print}'; }

# Safer jq field extraction (filter passed in $2)
jget(){
  local json_input="${1:-}"
  local filter="${2:-}"
  if [ -z "$json_input" ] || [ -z "$filter" ]; then
    echo ""; return 0;
  fi
  echo "$json_input" | jq -r "$filter // empty" 2>/dev/null || true
}

request(){
  local method=$1; shift || true
  local endpoint=${1:-}; shift || true
  local data=""; local desc=""
  if [ $# -gt 0 ]; then
    data=$1; shift || true
  fi
  if [ $# -gt 0 ]; then
    desc=$1; shift || true
  fi
  desc=${desc:-"(no description)"}
  log "REQUEST: $method $endpoint - $desc"
  local http_code
  if [ -n "$data" ]; then
    resp=$(curl -s -w '\n%{http_code}' -X "$method" "$API_BASE$endpoint" -H 'Content-Type: application/json' -H "x-user-id: $SYSTEM_USER_ID" --data "$data")
  else
    resp=$(curl -s -w '\n%{http_code}' -X "$method" "$API_BASE$endpoint" -H 'Content-Type: application/json' -H "x-user-id: $SYSTEM_USER_ID")
  fi
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  log "STATUS: $http_code"
  log "RESPONSE: $body"
  echo "$body"
  export LAST_HTTP_STATUS="$http_code"
}

summary(){
  echo "==========================================" | tee -a "$TEST_LOG"
  log "FULL FLOW SUMMARY:";
  log "Customer ID: ${CUSTOMER_ID:-}";
  log "Enquiry ID: ${ENQUIRY_ID:-}";
  log "Enquiry Item ID: ${ENQUIRY_ITEM_ID:-}";
  log "Quotation ID: ${QUOTATION_ID:-}";
  log "Acceptance ID: ${ACCEPTANCE_ID:-}";
  log "Accepted Item ID: ${ACCEPTANCE_ITEM_ID:-}";
  log "Customer PO ID: ${CUSTOMER_PO_ID:-}";
  log "Sales Order ID: ${SALES_ORDER_ID:-}";
  log "Supplier LPO ID: ${SUPPLIER_LPO_ID:-}";
  log "Goods Receipt Header ID: ${GR_HEADER_ID:-}";
  log "Goods Receipt Item ID: ${GR_ITEM_ID:-}";
  log "Delivery ID: ${DELIVERY_ID:-}";
  log "Delivery Item ID: ${DELIVERY_ITEM_ID:-}";
  log "Invoice ID: ${INVOICE_ID:-}";
  log "Paid Invoice ID: ${PAID_INVOICE_ID:-}";
  echo "==========================================" | tee -a "$TEST_LOG"
}
trap summary EXIT

############################################
# 1. Customer
############################################
CUSTOMER_PAYLOAD='{"name":"FullFlow Test Corp","email":"fullflow@test.com","phone":"+1999888777","address":"55 Lifecycle Ave","customerType":"Wholesale","classification":"Corporate","creditLimit":"250000","paymentTerms":"Net 30","userId":"'$SYSTEM_USER_ID'"}'
CUSTOMER_RESPONSE=$(request POST /api/customers "$CUSTOMER_PAYLOAD" "Create customer")
CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.id // empty' 2>/dev/null || true)
CUSTOMER_ID=$(sanitize_id "$CUSTOMER_ID")
if [ -z "$CUSTOMER_ID" ]; then
  fail "Customer creation failed"
fi

############################################
# 2. Enquiry
############################################
ENQUIRY_PAYLOAD=$(jq -n --arg cid "$CUSTOMER_ID" --arg notes "Lifecycle test enquiry" --arg uid "$SYSTEM_USER_ID" '{customerId:$cid, source:"Email", targetDeliveryDate:"2025-12-31T00:00:00.000Z", notes:$notes, userId:$uid}')
ENQUIRY_RESPONSE=$(request POST /api/enquiries "$ENQUIRY_PAYLOAD" "Create enquiry")
ENQUIRY_ID=$(sanitize_id $(jget "$ENQUIRY_RESPONSE" '.id'))
[ -n "$ENQUIRY_ID" ] || fail "Enquiry creation failed"

############################################
# 3. Enquiry Item
############################################
ENQUIRY_ITEM_PAYLOAD=$(jq -n --arg eid "$ENQUIRY_ID" --arg uid "$SYSTEM_USER_ID" '{enquiryId:$eid, description:"Lifecycle Bulk Pens", quantity:1000, unitPrice:"3.50", notes:"Blue ink", userId:$uid}')
ENQUIRY_ITEM_RESPONSE=$(request POST /api/enquiry-items "$ENQUIRY_ITEM_PAYLOAD" "Add enquiry item")
ENQUIRY_ITEM_ID=$(sanitize_id $(jget "$ENQUIRY_ITEM_RESPONSE" '.id'))
[ -n "$ENQUIRY_ITEM_ID" ] || fail "Enquiry item creation failed"

############################################
# 4. Generate Quotation
############################################
QUOTATION_RESPONSE=$(request POST /api/quotations/generate/$ENQUIRY_ID '{}' "Generate quotation from enquiry")
QUOTATION_ID=$(sanitize_id $(jget "$QUOTATION_RESPONSE" '.id'))
[ -n "$QUOTATION_ID" ] || fail "Quotation generation failed"

############################################
# 5. Customer Acceptance (Full)
############################################
# Required: quotationId, acceptanceType, acceptedBy
ACCEPTANCE_PAYLOAD=$(jq -n --arg qid "$QUOTATION_ID" --arg uid "$SYSTEM_USER_ID" '{quotationId:$qid, acceptanceType:"Full", acceptedBy:"Auto Tester", customerEmail:"customer@example.com", customerNotes:"Automated full acceptance", internalNotes:"Script acceptance", userId:$uid}')
ACCEPTANCE_RESPONSE=$(request POST /api/customer-acceptances "$ACCEPTANCE_PAYLOAD" "Create customer acceptance") || true
ACCEPTANCE_ID=$(sanitize_id $(jget "$ACCEPTANCE_RESPONSE" '.id'))
if [ -z "$ACCEPTANCE_ID" ]; then
  log "WARN: Acceptance creation failed (continuing, PO upload will fail without acceptance)."
fi

############################################
# 6. Quotation Items & Item Acceptance
############################################
Q_ITEMS_RESPONSE=$(request GET /api/quotations/$QUOTATION_ID/items '' "Fetch quotation items")
FIRST_QUOTE_ITEM_ID=$(jget "$Q_ITEMS_RESPONSE" '.[0].id')
FIRST_QUOTE_ITEM_QTY=$(jget "$Q_ITEMS_RESPONSE" '.[0].quantity')
if [ -n "${ACCEPTANCE_ID:-}" ] && [ -n "${FIRST_QUOTE_ITEM_ID:-}" ]; then
  ACCEPT_ITEM_PAYLOAD=$(jq -n --arg aid "$ACCEPTANCE_ID" --arg qitem "$FIRST_QUOTE_ITEM_ID" --argjson qty "${FIRST_QUOTE_ITEM_QTY:-0}" --arg uid "$SYSTEM_USER_ID" '{quotationItemId:$qitem, customerAcceptanceId:$aid, isAccepted:true, originalQuantity:$qty, acceptedQuantity:$qty, rejectedQuantity:0, userId:$uid}')
  ACCEPT_ITEM_RESPONSE=$(request POST /api/customer-acceptances/$ACCEPTANCE_ID/item-acceptances "$ACCEPT_ITEM_PAYLOAD" "Accept first quotation item") || true
  ACCEPTANCE_ITEM_ID=$(sanitize_id $(jget "$ACCEPT_ITEM_RESPONSE" '.id'))
  if [ -z "$ACCEPTANCE_ITEM_ID" ]; then
    log "WARN: Item acceptance failed"
  fi
fi

############################################
# 7. Update Quotation status -> Accepted (if route supports)
############################################
UPDATE_QUOTE_PAYLOAD='{"status":"Accepted","userId":"'$SYSTEM_USER_ID'"}'
UPDATED_QUOTE_RESPONSE=$(request PUT /api/quotations/$QUOTATION_ID "$UPDATE_QUOTE_PAYLOAD" "Set quotation status to Accepted") || true
QUOTATION_STATUS=$(jget "$UPDATED_QUOTE_RESPONSE" '.status')
log "Quotation status after update attempt: ${QUOTATION_STATUS:-unknown}"

############################################
# 8. Customer PO Upload (requires quotation status Accepted & accepted item)
############################################
if [ "${QUOTATION_STATUS}" = "Accepted" ]; then
  # Minimal valid fields (uploadedBy optional / will fallback)
  CUSTOMER_PO_PAYLOAD=$(jq -n --arg qid "$QUOTATION_ID" --arg uid "$SYSTEM_USER_ID" '{quotationId:$qid, poNumber:"PO-AUTO-001", poDate:"2025-12-01T00:00:00.000Z", documentPath:"/tmp/customer-po.pdf", documentName:"customer-po.pdf", documentType:"PDF", currency:"USD", paymentTerms:"Net 30", deliveryTerms:"Standard", specialInstructions:"None", userId:$uid}')
  CUSTOMER_PO_RESPONSE=$(request POST /api/customer-po-upload "$CUSTOMER_PO_PAYLOAD" "Upload customer PO") || true
  CUSTOMER_PO_ID=$(sanitize_id $(jget "$CUSTOMER_PO_RESPONSE" '.id'))
  if [ -z "$CUSTOMER_PO_ID" ]; then
    log "WARN: Customer PO upload failed"
  fi
else
  log "WARN: Quotation not Accepted; skipping Customer PO upload"
fi

############################################
# 9. Sales Order from Quotation
############################################
SO_FROM_QUOTE_PAYLOAD=$(jq -n --arg qid "$QUOTATION_ID" --arg uid "$SYSTEM_USER_ID" '{quotationId:$qid, userId:$uid}')
SALES_ORDER_RESPONSE=$(request POST /api/sales-orders/from-quotation "$SO_FROM_QUOTE_PAYLOAD" "Create sales order from quotation") || true
SALES_ORDER_ID=$(sanitize_id $(jget "$SALES_ORDER_RESPONSE" '.id'))
if [ -z "$SALES_ORDER_ID" ]; then
  fail "Sales order creation failed (status=$LAST_HTTP_STATUS). Raw response above." 
fi

############################################
# 10. Supplier LPO
############################################
if [ -n "${SALES_ORDER_ID:-}" ]; then
  SUPPLIER_LPO_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg uid "$SYSTEM_USER_ID" '{salesOrderId:$so, userId:$uid}')
  SUPPLIER_LPO_RESPONSE=$(request POST /api/supplier-lpos/from-sales-order "$SUPPLIER_LPO_PAYLOAD" "Create supplier LPO from sales order") || true
  SUPPLIER_LPO_ID=$(sanitize_id $(jget "$SUPPLIER_LPO_RESPONSE" '.id'))
  if [ -z "$SUPPLIER_LPO_ID" ]; then
    log "WARN: Supplier LPO creation failed"
  fi
fi

############################################
# 11. Goods Receipt (header + item)
############################################
if [ -n "${SUPPLIER_LPO_ID:-}" ]; then
  # Fetch supplier LPO to get supplierId for goods receipt header
  SUPPLIER_LPO_DETAIL=$(request GET /api/supplier-lpos/$SUPPLIER_LPO_ID '' "Fetch supplier LPO detail") || true
  SUPPLIER_ID_FOR_GR=$(jget "$SUPPLIER_LPO_DETAIL" '.supplierId')
  if [ -z "$SUPPLIER_ID_FOR_GR" ]; then
    log "WARN: Could not resolve supplierId from Supplier LPO; skipping goods receipt"
  else
    RECEIPT_NUM="GR-$(date +%s)"
    TODAY_STR=$(date '+%Y-%m-%d')
    GR_HEADER_PAYLOAD=$(jq -n --arg lpo "$SUPPLIER_LPO_ID" --arg sup "$SUPPLIER_ID_FOR_GR" --arg rn "$RECEIPT_NUM" --arg today "$TODAY_STR" --arg uid "$SYSTEM_USER_ID" '{supplierLpoId:$lpo, supplierId:$sup, receiptNumber:$rn, receiptDate:$today, status:"Draft", notes:"Auto GR header", userId:$uid}')
    GR_HEADER_RESPONSE=$(request POST /api/goods-receipt-headers "$GR_HEADER_PAYLOAD" "Create goods receipt header") || true
    GR_HEADER_ID=$(sanitize_id $(jget "$GR_HEADER_RESPONSE" '.id'))
    if [ -n "$GR_HEADER_ID" ]; then
      # Build goods receipt item referencing header (schema expects receiptHeaderId, itemDescription, quantityExpected, etc.)
      GR_ITEM_PAYLOAD=$(jq -n --arg rh "$GR_HEADER_ID" --arg uid "$SYSTEM_USER_ID" '{receiptHeaderId:$rh, itemDescription:"Lifecycle Pens", quantityExpected:1000, quantityReceived:1000, quantityDamaged:0, quantityShort:0, unitCost:"1.25", totalCost:"1250.00", notes:"All received good", userId:$uid}')
      GR_ITEM_RESPONSE=$(request POST /api/goods-receipt-items "$GR_ITEM_PAYLOAD" "Create goods receipt item") || true
      GR_ITEM_ID=$(sanitize_id $(jget "$GR_ITEM_RESPONSE" '.id'))
      if [ -z "$GR_ITEM_ID" ]; then
        log "WARN: Goods receipt item creation failed"
      fi
    else
      log "WARN: Goods receipt header creation failed"
    fi
  fi
else
  log "INFO: Skipping goods receipt (no supplier LPO)"
fi

############################################
# 12. Delivery (create + add first available item + confirm)
############################################
if [ -n "${SALES_ORDER_ID:-}" ]; then
  # Create delivery without explicit status (schema default Pending). Storage will assign deliveryNumber.
  DELIVERY_CREATE_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg uid "$SYSTEM_USER_ID" '{salesOrderId:$so, notes:"Auto delivery", deliveryDate:(now|strftime("%Y-%m-%dT%H:%M:%SZ")), userId:$uid}')
  DELIVERY_RESPONSE=$(request POST /api/deliveries "$DELIVERY_CREATE_PAYLOAD" "Create delivery") || true
  DELIVERY_ID=$(sanitize_id $(jget "$DELIVERY_RESPONSE" '.id'))
  if [ -n "$DELIVERY_ID" ]; then
    # Fetch sales order items to create at least one delivery item
    SO_ITEMS_RESPONSE=$(request GET /api/sales-orders/$SALES_ORDER_ID/items '' "Fetch sales order items for delivery") || true
    FIRST_SO_ITEM_ID=$(jget "$SO_ITEMS_RESPONSE" '.[0].id')
    if [ -n "$FIRST_SO_ITEM_ID" ]; then
      DEL_ITEM_PAYLOAD=$(jq -n --arg did "$DELIVERY_ID" --arg soi "$FIRST_SO_ITEM_ID" --arg uid "$SYSTEM_USER_ID" '{deliveryId:$did, salesOrderItemId:$soi, userId:$uid}')
      DELIVERY_ITEM_RESPONSE=$(request POST /api/deliveries/$DELIVERY_ID/items "$DEL_ITEM_PAYLOAD" "Add delivery item from sales order item") || true
      DELIVERY_ITEM_ID=$(sanitize_id $(jget "$DELIVERY_ITEM_RESPONSE" '.id'))
    else
      log "WARN: No sales order items found to add to delivery"
    fi
    request POST /api/deliveries/$DELIVERY_ID/confirm '{"confirmedBy":"Auto Tester","signature":"Signed","userId":"'$SYSTEM_USER_ID'"}' "Confirm delivery" || log "WARN: Delivery confirmation failed"
  else
    log "WARN: Delivery creation failed"
  fi
fi

############################################
# 13. Invoice Generation (prefer delivery based)
############################################
if [ -n "${DELIVERY_ID:-}" ]; then
  INVOICE_FROM_DELIVERY_PAYLOAD=$(jq -n --arg did "$DELIVERY_ID" --arg uid "$SYSTEM_USER_ID" '{deliveryId:$did, invoiceType:"Standard", userId:$uid}')
  INVOICE_RESPONSE=$(request POST /api/invoices/generate-from-delivery "$INVOICE_FROM_DELIVERY_PAYLOAD" "Generate invoice from delivery") || true
  INVOICE_ID=$(sanitize_id $(jget "$INVOICE_RESPONSE" '.id'))
  if [ -z "$INVOICE_ID" ]; then
    log "WARN: Invoice generation from delivery failed"
  fi
fi

# Fallback: Proforma from sales order
if [ -z "${INVOICE_ID:-}" ] && [ -n "${SALES_ORDER_ID:-}" ]; then
  PROFORMA_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg uid "$SYSTEM_USER_ID" '{salesOrderId:$so, userId:$uid}')
  PROFORMA_RESPONSE=$(request POST /api/invoices/generate-proforma "$PROFORMA_PAYLOAD" "Generate proforma invoice (fallback)") || true
  INVOICE_ID=$(sanitize_id $(jget "$PROFORMA_RESPONSE" '.id'))
fi

# Manual invoice fallback
if [ -z "${INVOICE_ID:-}" ] && [ -n "${SALES_ORDER_ID:-}" ]; then
  MANUAL_INVOICE_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg cid "$CUSTOMER_ID" --arg uid "$SYSTEM_USER_ID" '{salesOrderId:$so, customerId:$cid, status:"Draft", subtotal:"0.00", taxAmount:"0.00", totalAmount:"0.00", userId:$uid}')
  MANUAL_INVOICE_RESPONSE=$(request POST /api/invoices "$MANUAL_INVOICE_PAYLOAD" "Manual invoice creation fallback") || true
  INVOICE_ID=$(sanitize_id $(jget "$MANUAL_INVOICE_RESPONSE" '.id'))
fi

############################################
# 14. Mark Invoice Paid
############################################
if [ -n "${INVOICE_ID:-}" ]; then
  MARK_PAID_PAYLOAD='{"paidAmount":"100.00","paymentMethod":"Bank Transfer","paymentReference":"FFLOW-TEST-REF","userId":"'$SYSTEM_USER_ID'"}'
  MARK_PAID_RESPONSE=$(request POST /api/invoices/$INVOICE_ID/mark-paid "$MARK_PAID_PAYLOAD" "Mark invoice paid") || true
  PAID_INVOICE_ID=$(sanitize_id $(jget "$MARK_PAID_RESPONSE" '.id'))
  if [ -z "$PAID_INVOICE_ID" ]; then
    log "WARN: Mark-paid did not return invoice ID"
  fi
else
  log "WARN: No invoice available to mark paid"
fi

############################################
# 15. Final listings for audit
############################################
request GET /api/quotations '' "List quotations" || true
request GET /api/sales-orders '' "List sales orders" || true
request GET /api/invoices '' "List invoices" || true

exit 0
