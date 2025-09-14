# Inventory Management Architecture (Step 8 Alignment)

## Objectives
Provide accurate, auditable, real‑time stock visibility using:
- Inventory Items + Variants
- Inventory Levels (per location)
- Stock Movements (event log)
- Goods Receipts (inbound)
- Scanning Sessions (high-volume capture)
- Supplier Returns (outbound corrections)
- Manual Adjustments (controlled exceptions)

## Core Principles
1. Single Source of Truth: `stock_movements` + derived `inventory_levels`.
2. Every quantity change is an event (movement) with before/after snapshot.
3. Idempotent inbound processing (avoid double counting).
4. Barcode-first lookup for operational speed.
5. Separation of capture (scanning) vs commit (finalization endpoint).

## Data Flow
Inbound (Procurement):
Goods Receipt -> Items -> StockService.receiveStock() -> Movement (IN) -> Level updated.

Outbound (Sales / Delivery):
Future: Delivery picking -> Movement (OUT) -> Level updated.

Adjustments:
Manual `/api/inventory-levels/adjust` -> recordMovement() (IN/OUT)

Scanning Sessions:
Capture -> `/api/scanning-sessions/:id/finalize` -> aggregate -> receiveStock() per item.

## StockService
`server/services/stock-service.ts` centralizes:
- Movement creation
- Level upsert (create/update)
- Negative stock prevention

Interface:
```
recordMovement({ itemId, quantity, referenceType, referenceId, location, reason })
receiveStock(params)
issueStock(params)
```

## Recent Improvements
- Replaced direct `createStockMovement` calls in goods receipt & adjustment routes with `StockService`.
- Added scanning finalization endpoint.
- Added integrity test `one-time-scripts/test-inventory-integrity.sh`.

## Remaining Enhancements
- Add BarcodeService abstraction & validation caching.
- Wrap goods receipt header+items+stock in a DB transaction.
- Add low-stock alert job (threshold: `quantityAvailable <= reorderLevel`).
- Indexes: `(inventory_item_id, storage_location)` unique for `inventory_levels`.
- Outbound flows: delivery deduction & reservation mechanism.
- Add movement soft-delete guard (disallow modifications; use reversal movement instead).

## KPI & Reporting Readiness
- Movements enable FIFO costing extension.
- Levels enable real-time dashboard stock widget.
- Scanning variance analysis (expected vs scanned vs received).

## Glossary
- Inventory Level: Current snapshot per item/location.
- Stock Movement: Immutable audit event capturing change.
- Receive Stock: Positive movement (IN) from procurement or scanning.
- Issue Stock: Negative movement (OUT) from sales, return to supplier, or adjustment.

---
Prepared to align with good tracking industry practices (auditability, event sourcing pattern, barcode-centric).