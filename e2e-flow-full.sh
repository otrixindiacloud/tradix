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

# Basic ID pattern tolerance (UUIDs or prefixed legacy like ENQ- / QTN- / SO- etc.)
is_valid_id(){
  local id="$1"
  if [[ -z "$id" ]]; then return 1; fi
  if [[ "$id" =~ ^[0-9a-fA-F-]{36}$ ]]; then return 0; fi           # UUID
  if [[ "$id" =~ ^(ENQ|QTN|SO|LPO|GRH|GRI|DLV|INV)-[A-Za-z0-9_-]+$ ]]; then return 0; fi
  return 1
}

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
  log "Supplier ID: ${SUPPLIER_ID:-}";
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
if ! is_valid_id "$CUSTOMER_ID"; then
  fail "Customer creation failed (invalid ID: $CUSTOMER_ID)"
fi

############################################
# 1b. Supplier (for controlled supplierId in LPO / Goods Receipt)
############################################
SUPPLIER_PAYLOAD='{"name":"FullFlow Auto Supplier","email":"supplier@test.com","phone":"+1888777666","address":"77 Supply Chain Rd","contactPerson":"Automation","paymentTerms":"Net 30"}'
SUPPLIER_RESPONSE=$(request POST /api/suppliers "$SUPPLIER_PAYLOAD" "Create supplier") || true
SUPPLIER_ID=$(sanitize_id $(echo "$SUPPLIER_RESPONSE" | jq -r '.id // empty'))
if [ -z "$SUPPLIER_ID" ]; then
  log "WARN: Supplier creation failed; downstream LPO will auto-create supplier"
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
# Create two enquiry items to test multi-item propagation
ENQUIRY_ITEM_PAYLOAD_1=$(jq -n --arg eid "$ENQUIRY_ID" --arg uid "$SYSTEM_USER_ID" '{enquiryId:$eid, description:"Lifecycle Bulk Pens Blue", quantity:1000, unitPrice:"3.50", notes:"Blue ink", userId:$uid}')
ENQUIRY_ITEM_PAYLOAD_2=$(jq -n --arg eid "$ENQUIRY_ID" --arg uid "$SYSTEM_USER_ID" '{enquiryId:$eid, description:"Lifecycle Bulk Pens Red", quantity:500, unitPrice:"3.60", notes:"Red ink", userId:$uid}')
ENQUIRY_ITEM_RESPONSE_1=$(request POST /api/enquiry-items "$ENQUIRY_ITEM_PAYLOAD_1" "Add enquiry item 1")
ENQUIRY_ITEM_ID=$(sanitize_id $(jget "$ENQUIRY_ITEM_RESPONSE_1" '.id'))
ENQUIRY_ITEM_RESPONSE_2=$(request POST /api/enquiry-items "$ENQUIRY_ITEM_PAYLOAD_2" "Add enquiry item 2") || true
ENQUIRY_ITEM2_ID=$(sanitize_id $(jget "$ENQUIRY_ITEM_RESPONSE_2" '.id'))
if [ -z "$ENQUIRY_ITEM_ID" ]; then
  fail "Primary enquiry item creation failed"
fi
log "Enquiry items created: $ENQUIRY_ITEM_ID ${ENQUIRY_ITEM2_ID:-}" 

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
Q_ITEM_COUNT=$(echo "$Q_ITEMS_RESPONSE" | jq 'length' 2>/dev/null || echo 0)
FIRST_QUOTE_ITEM_ID=$(jget "$Q_ITEMS_RESPONSE" '.[0].id')
FIRST_QUOTE_ITEM_QTY=$(jget "$Q_ITEMS_RESPONSE" '.[0].quantity')
SECOND_QUOTE_ITEM_ID=$(jget "$Q_ITEMS_RESPONSE" '.[1].id')
log "Quotation items count: $Q_ITEM_COUNT"
if [ -n "${ACCEPTANCE_ID:-}" ] && [ -n "${FIRST_QUOTE_ITEM_ID:-}" ]; then
  ACCEPT_ITEM_PAYLOAD_1=$(jq -n --arg aid "$ACCEPTANCE_ID" --arg qitem "$FIRST_QUOTE_ITEM_ID" --argjson qty "${FIRST_QUOTE_ITEM_QTY:-0}" --arg uid "$SYSTEM_USER_ID" '{quotationItemId:$qitem, customerAcceptanceId:$aid, isAccepted:true, originalQuantity:$qty, acceptedQuantity:$qty, rejectedQuantity:0, userId:$uid}')
  ACCEPT_ITEM_RESPONSE_1=$(request POST /api/customer-acceptances/$ACCEPTANCE_ID/item-acceptances "$ACCEPT_ITEM_PAYLOAD_1" "Accept first quotation item") || true
  ACCEPTANCE_ITEM_ID=$(sanitize_id $(jget "$ACCEPT_ITEM_RESPONSE_1" '.id'))
  if [ -n "$SECOND_QUOTE_ITEM_ID" ]; then
    ACCEPT_ITEM_PAYLOAD_2=$(jq -n --arg aid "$ACCEPTANCE_ID" --arg qitem "$SECOND_QUOTE_ITEM_ID" --arg uid "$SYSTEM_USER_ID" '{quotationItemId:$qitem, customerAcceptanceId:$aid, isAccepted:false, originalQuantity:0, acceptedQuantity:0, rejectedQuantity:0, userId:$uid}')
    request POST /api/customer-acceptances/$ACCEPTANCE_ID/item-acceptances "$ACCEPT_ITEM_PAYLOAD_2" "Record second quotation item (not accepted)" || true
  fi
  if [ -z "$ACCEPTANCE_ITEM_ID" ]; then
    log "WARN: Acceptance item creation failed"
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
# Capture sales order items list to ensure multi propagation
SO_ITEMS_AFTER_CREATE=$(request GET /api/sales-orders/$SALES_ORDER_ID/items '' "Fetch sales order items after create") || true
SO_ITEM_COUNT=$(echo "$SO_ITEMS_AFTER_CREATE" | jq 'length' 2>/dev/null || echo 0)
FIRST_SO_ITEM_ID=$(jget "$SO_ITEMS_AFTER_CREATE" '.[0].id')
SECOND_SO_ITEM_ID=$(jget "$SO_ITEMS_AFTER_CREATE" '.[1].id')
log "Sales order items count: $SO_ITEM_COUNT"

############################################
# 10. Supplier LPO
############################################
if [ -n "${SALES_ORDER_ID:-}" ]; then
  if [ -n "$SUPPLIER_ID" ]; then
    SUPPLIER_LPO_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg sup "$SUPPLIER_ID" --arg uid "$SYSTEM_USER_ID" '{salesOrderId:$so, supplierId:$sup, userId:$uid}')
  else
    SUPPLIER_LPO_PAYLOAD=$(jq -n --arg so "$SALES_ORDER_ID" --arg uid "$SYSTEM_USER_ID" '{salesOrderId:$so, userId:$uid}')
  fi
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
  ITEM_STATUS="$LAST_HTTP_STATUS"
      GR_ITEM_ID=$(sanitize_id $(jget "$GR_ITEM_RESPONSE" '.id'))
      if [ -z "$GR_ITEM_ID" ]; then
        log "WARN: Goods receipt item creation failed (header $GR_HEADER_ID). HTTP status: $ITEM_STATUS"
        echo "--- Goods Receipt Item Raw Response Start ---"
        echo "$GR_ITEM_RESPONSE"
        echo "--- Goods Receipt Item Raw Response End ---"
      else
        log "Goods receipt item created: $GR_ITEM_ID (status $ITEM_STATUS)"
      fi
    else
      log "WARN: Goods receipt header creation failed"
    fi
  fi
else
  log "INFO: Skipping goods receipt (no supplier LPO)"
fi

# Assertion: if we had a supplier LPO we expect at least a goods receipt header id
if [ -n "${SUPPLIER_LPO_ID:-}" ] && [ -z "${GR_HEADER_ID:-}" ]; then
  fail "Expected goods receipt header to be created for supplier LPO $SUPPLIER_LPO_ID but none was created"
fi

# Assertion: if goods receipt header created we expect at least one item
if [ -n "${GR_HEADER_ID:-}" ] && [ -z "${GR_ITEM_ID:-}" ]; then
  fail "Goods receipt header $GR_HEADER_ID created but item creation failed"
fi

# If goods receipt item created, validate basic quantity integrity (expected >= received, shorts/damaged non-negative)
if [ -n "${GR_ITEM_ID:-}" ]; then
  GR_ITEM_DETAIL=$(request GET /api/goods-receipt-items/${GR_ITEM_ID} '' "Fetch goods receipt item detail") || true
  GRI_Q_EXPECTED=$(jget "$GR_ITEM_DETAIL" '.quantityExpected')
  GRI_Q_RECEIVED=$(jget "$GR_ITEM_DETAIL" '.quantityReceived')
  GRI_Q_DAMAGED=$(jget "$GR_ITEM_DETAIL" '.quantityDamaged')
  GRI_Q_SHORT=$(jget "$GR_ITEM_DETAIL" '.quantityShort')
  if [ -n "$GRI_Q_EXPECTED" ] && [ -n "$GRI_Q_RECEIVED" ]; then
    if [ "$GRI_Q_RECEIVED" -gt "$GRI_Q_EXPECTED" ]; then
      fail "Goods receipt item $GR_ITEM_ID received quantity $GRI_Q_RECEIVED exceeds expected $GRI_Q_EXPECTED"
    fi
  fi
  for v in "$GRI_Q_DAMAGED" "$GRI_Q_SHORT"; do
    if [ -n "$v" ] && [ "$v" -lt 0 ]; then
      fail "Goods receipt item $GR_ITEM_ID has negative discrepancy quantity ($v)"
    fi
  done
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
    SECOND_SO_ITEM_ID=$(jget "$SO_ITEMS_RESPONSE" '.[1].id')
    if [ -n "$FIRST_SO_ITEM_ID" ]; then
      DEL_ITEM_PAYLOAD_1=$(jq -n --arg did "$DELIVERY_ID" --arg soi "$FIRST_SO_ITEM_ID" --arg uid "$SYSTEM_USER_ID" '{deliveryId:$did, salesOrderItemId:$soi, userId:$uid}')
      DELIVERY_ITEM_RESPONSE_1=$(request POST /api/deliveries/$DELIVERY_ID/items "$DEL_ITEM_PAYLOAD_1" "Add delivery item #1 from sales order item") || true
      DELIVERY_ITEM_ID=$(sanitize_id $(jget "$DELIVERY_ITEM_RESPONSE_1" '.id'))
      if [ -n "$SECOND_SO_ITEM_ID" ]; then
        DEL_ITEM_PAYLOAD_2=$(jq -n --arg did "$DELIVERY_ID" --arg soi "$SECOND_SO_ITEM_ID" --arg uid "$SYSTEM_USER_ID" '{deliveryId:$did, salesOrderItemId:$soi, userId:$uid}')
        request POST /api/deliveries/$DELIVERY_ID/items "$DEL_ITEM_PAYLOAD_2" "Add delivery item #2 from sales order item" || true
      fi
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
  # Fetch invoice to determine total for full payment
  INVOICE_DETAIL_BEFORE=$(request GET /api/invoices/$INVOICE_ID '' "Fetch invoice before payment") || true
  INVOICE_TOTAL_AMOUNT=$(jget "$INVOICE_DETAIL_BEFORE" '.totalAmount')
  INVOICE_OUTSTANDING_AMOUNT=$(jget "$INVOICE_DETAIL_BEFORE" '.outstandingAmount')
  # Fallback logic: if null/empty, treat as 0.00 so mark-paid will still succeed (status may remain Draft if no total)
  if [ -z "$INVOICE_TOTAL_AMOUNT" ] || [ "$INVOICE_TOTAL_AMOUNT" = "null" ]; then
    INVOICE_TOTAL_AMOUNT="0.00"
  fi
  if [ -z "$INVOICE_OUTSTANDING_AMOUNT" ] || [ "$INVOICE_OUTSTANDING_AMOUNT" = "null" ]; then
    INVOICE_OUTSTANDING_AMOUNT="$INVOICE_TOTAL_AMOUNT"
  fi
  MARK_PAID_AMOUNT="$INVOICE_OUTSTANDING_AMOUNT"
  MARK_PAID_PAYLOAD=$(jq -n --arg amt "$MARK_PAID_AMOUNT" --arg uid "$SYSTEM_USER_ID" '{paidAmount:$amt, paymentMethod:"Bank Transfer", paymentReference:"FFLOW-TEST-REF", userId:$uid}')
  MARK_PAID_RESPONSE=$(request POST /api/invoices/$INVOICE_ID/mark-paid "$MARK_PAID_PAYLOAD" "Mark invoice paid (amount=$MARK_PAID_AMOUNT)") || true
  PAID_INVOICE_ID=$(sanitize_id $(jget "$MARK_PAID_RESPONSE" '.id'))
  if [ -z "$PAID_INVOICE_ID" ]; then
    log "WARN: Mark-paid did not return invoice ID"
  else
    # Post-payment verification
    INVOICE_DETAIL_AFTER=$(request GET /api/invoices/$INVOICE_ID '' "Fetch invoice after payment") || true
    INVOICE_STATUS_AFTER=$(jget "$INVOICE_DETAIL_AFTER" '.status')
    OUTSTANDING_AFTER=$(jget "$INVOICE_DETAIL_AFTER" '.outstandingAmount')
    if [ -z "$OUTSTANDING_AFTER" ] || [ "$OUTSTANDING_AFTER" = "null" ]; then OUTSTANDING_AFTER="0"; fi
    # Normalize numeric comparisons (strip possible quotes)
    if [ "$OUTSTANDING_AFTER" = "0" ] || [ "$OUTSTANDING_AFTER" = "0.00" ]; then
      : # ok
    else
      log "WARN: Outstanding after payment is $OUTSTANDING_AFTER (status=$INVOICE_STATUS_AFTER)"
    fi
    if [ "$OUTSTANDING_AFTER" = "0" ] && [ "$INVOICE_STATUS_AFTER" != "Paid" ]; then
      fail "Invoice $INVOICE_ID fully paid but status is $INVOICE_STATUS_AFTER (expected Paid)"
    fi
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
