## Embedded Customer Enrichment (Deliveries & Sales Orders)

### Summary
Sales Orders and Delivery Notes API responses now include an embedded, normalized `customer` object and a transition flag `__customerEmbedded: true`. This removes the need for the frontend to perform a separate `/api/customers` fetch purely to resolve customer names.

### Affected Endpoints
- `GET /api/sales-orders`
- `GET /api/sales-orders/:id`
- `GET /api/deliveries`
- `GET /api/deliveries/:id` (via storage layer)

### New Response Shape (Example)
```jsonc
{
  "id": "c3b7...",
  "orderNumber": "SO-2025-007",
  "status": "Confirmed",
  "customerId": "cust_123",
  "customer": {
    "id": "cust_123",
    "name": "Acme Trading Co",
    "customerType": "Corporate",
    "address": "Manama, Bahrain"
  },
  "__customerEmbedded": true,
  "createdAt": "2025-02-11T08:22:11.123Z"
}
```

### Frontend Adjustments
`client/src/pages/delivery.tsx` now:
1. Detects enrichment via `__customerEmbedded` on either deliveries or sales orders.
2. Skips the legacy `/api/customers` fetch when enrichment is present.
3. Simplifies mapping logic to prefer `delivery.customer` then `salesOrder.customer`.

### Backward Compatibility
The legacy customer fetch + ID → object mapping remains only when neither dataset exposes `__customerEmbedded`. Once deployed and stable, that fallback can be safely removed.

### Normalization Logic
For robustness, the enrichment code attempts to derive a display name from several possible legacy fields:
`name | customerName | companyName | fullName` and address from `address | billingAddress`.

### Next Possible Cleanup
- Remove fallback customer fetch & mapping after verification window.
- Update any other pages querying sales orders to leverage embedded `customer` instead of performing custom joins or lookups.

### Rationale
Reducing N+1 client lookups lowers latency, removes shape ambiguity (objects vs arrays), and centralizes canonical customer projection in the storage layer.

### Audit / Flag Removal Plan
1. Monitor production logs for 48h for any access where `__customerEmbedded` missing.
2. If none, remove fallback block and the `__customerEmbedded` flag itself.
3. Document final stabilized contract in main README.

---
Implemented: 2025-02-XX
Author: Automation (Copilot)