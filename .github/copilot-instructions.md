# GT-ERP Copilot Instructions

## Architecture Overview

This is a **full-stack TypeScript ERP system** with modular architecture optimized for business operations management. The codebase follows a monorepo pattern with clear separation between client, server, and shared components.

### Core Tech Stack
- **Frontend**: React + Vite + TypeScript + Radix UI + TailwindCSS
- **Backend**: Express.js + TypeScript (ESM modules)
- **Database**: PostgreSQL + Drizzle ORM
- **AI Integration**: OpenAI SDK with custom business context
- **State Management**: TanStack Query + React Context

## Project Structure Patterns

```
client/src/           # React frontend with route-based organization
server/               # Express backend with modular services
  ├── routes/         # Business domain route handlers (customers, enquiries, etc.)
  ├── storage/        # Modular data access layer (77% size reduction achieved)
  └── ai-service.ts   # Business-aware AI assistant
shared/schema.ts      # Drizzle schema with comprehensive business enums
```

## Critical Development Workflows

### Database Operations
```bash
npm run db:push          # Push schema changes to database
npm run dev             # Start development with hot reload
npm run build           # Build for production
```

### Testing Strategy
- Use `comprehensive-test.sh` for full API validation
- Individual feature tests in `one-time-scripts/test-*.sh`
- Frontend pages tested via direct navigation checks
- Testing file should be in the "one-time-scripts" directory and named appropriately, e.g., `test-quotation-crud.sh`

## Domain-Specific Patterns

### Business Entity Lifecycle & Requirements
    1.  **Process Flow Overview**
        `Customer Enquiry` → `Quotation` → `Customer Acceptance (Partial/Full)` → `Customer PO Upload` → `Sales Order` → `Supplier LPO` → `Goods Receipt` → `Inventory Update` → `Customer Delivery` → `Invoice` → `Supplier Payment`

    2.  **Enquiry Management**
        -   **Capture**: Email, phone, web form (auto/manual import)
        -   **Fields**: Customer details, enquiry date, item description, supplier codes, logo requirement (yes/no), logo size, color/size variants, target price, required quantity, delivery date, notes
        -   **Attachments**: Reference images, logo files, packaging guidelines
        -   **Status**: New, In Progress, Quoted, Closed
        -   **Audit**: Timestamped user action log

    3.  **Quotation Management**
        -   **Quote Creation**: From enquiry or manual. Version-controlled with audit log
        -   **Pricing**: Auto logic by customer type (Retail/Wholesale) with configurable markup. Target price check where provided
        -   **Fields**: Quote ID, revision, customer details, item lines (supplier code, barcode, logo specs, description, qty, unit price, total), taxes, discounts, validity, terms
        -   **Approvals**: Hierarchy by quote value, discount %, customer type
        -   **Item Control**: Accept/reject with reasons; archive rejected
        -   **Multi-currency**: AED, USD, BHD, etc.

    4.  **Customer Acceptance & PO Upload**
        -   **Acceptance**: Full/partial acceptance of quoted items
        -   **Validation**: Match PO number, items, and quantities to quote
        -   **Mandatory**: PO upload before Sales Order creation
        -   **Attachments**: Customer PO in PDF/image
        -   **Log**: Timestamped with user identity

    5.  **Sales Order Management**
        -   **Creation**: From accepted quote + uploaded PO
        -   **Fields**: Order ID, customer details, order date, item lines (supplier code, barcode, logo specs, qty, price, total), payment terms, delivery instructions, PO reference
        -   **Controls**: Barcode enforcement, versioning for amendments, partial orders
        -   **Upload**: Customer LPO mandatory with linkage

    6.  **Supplier LPO Management**
        -   **Generation**: Auto from Sales Order, grouped by supplier
        -   **Fields**: LPO ID, supplier details, item lines (supplier code, barcode, logo specs), expected delivery date, cost, terms
        -   **Features**: Multi-supplier split, amendments, cancellations (with approval), backlog reporting
        -   **Currency**: Multi-currency support

    7.  **Inventory Management**
        -   **Structure**: Supplier-coded items with barcode. Fields include supplier code, barcode, description, category, UOM, cost price, markup rules, variants (color, size, packaging)
        -   **Goods Receipt**: Barcode-based GRN against supplier LPO; support partial receipts
        -   **Discrepancies**: Damage/shortage logging
        -   **Bulk Scanning**: High-volume receipts
        -   **Returns**: Debit notes for supplier returns

    8.  **Delivery & Invoicing**
        -   **Delivery Notes**: Generated post-GRN. Barcode picking enforced. Partial delivery supported
        -   **Invoices**: Auto after delivery confirmation. Fields: Invoice ID, date, order reference, item lines with barcodes, taxes (VAT), discounts, totals
        -   **Other Docs**: Delivery note upload, Proforma invoices, multi-currency invoices
        -   **Returns**: Credit notes, barcode-linked, auditable

    9.  **Pricing & Costing Engine**
        -   **Retail Price** = `Cost ÷ (1 - Retail Markup %)`
        -   **Wholesale Price** = `Cost ÷ (1 - Wholesale Markup %)`
        -   **Configurable Markups**: By category, supplier, or item type
        -   **Target Price Matching**: Highlight items exceeding customer’s indicated target

    10. **Supplier Payment & Finance**
        -   **Advance Memos**: Creation against supplier POs
        -   **Settlement**: Final settlement tracking and memos
        -   **Audit**: Payment status linked to supplier orders and customer invoices

    11. **Reporting & Analytics**
        -   **Sales Reports**: Performance by customer, item, category
        -   **Inventory Reports**: Stock levels, turnover days, dead stock
        -   **Order Tracking**: Expected delivery, shipping, payment status
        -   **Profitability Reports**: Item-level margin, customer-level profitability
Each entity follows this storage pattern:
```typescript
// In server/storage/[entity]-storage.ts
export class EntityStorage extends BaseStorage {
  // Implements CRUD + business-specific operations
  // Uses generateNumber() for entity IDs (e.g., "ENQ-123456ABCD")
}
```

### Route Registration Pattern
All business domains auto-register in `server/routes/index.ts`:
```typescript
export async function registerRoutes(app: Express) {
  registerCustomerRoutes(app);
  registerEnquiryRoutes(app);  // etc.
}
```

### Frontend Page Structure
Pages follow consistent patterns in `client/src/pages/`:
- List views with DataTables + search/filter
- Detail views with form validation via `react-hook-form`
- Modal dialogs for CRUD operations
- AI assistant integration via `AIProvider`

## AI Integration Specifics

The AI service (`server/ai-service.ts`) provides **business-context aware responses**:
- Recognizes ERP terminology and workflows
- Provides page-specific guidance
- Suggests next actions based on current business process
- Integrates with live data for intelligent insights

### AI Component Usage
```tsx
// AI assistant available globally via context
import { AIProvider } from "@/components/ai-assistant/ai-context";
```

## Database Schema Conventions

### Entity Relationships
- Use `uuid` for foreign keys with proper relations defined
- Business entities have `createdAt`/`updatedAt` timestamps
- Status fields use strict enums (e.g., `enquiryStatusEnum`)
- Audit logging via `BaseStorage.logAuditEvent()`

### Key Business Enums
```typescript
enquiryStatusEnum: ["New", "In Progress", "Quoted", "Closed"]
quotationStatusEnum: ["Draft", "Under Review", "Approved", "Rejected", "Sent", "Accepted", "Rejected by Customer", "Expired"]
salesOrderStatusEnum: ["Draft", "Confirmed", "Processing", "Shipped", "Delivered"]
```

## Module Import Patterns

### Path Aliases (tsconfig.json)
```typescript
import Component from "@/components/ui/component";     // client/src/*
import { schema } from "@shared/schema";               // shared/*
```

### Storage Module Access
```typescript
import { storage } from "../storage";  // Main delegating class
// Individual modules auto-exported via server/storage/index.ts
```

## Error Handling & Logging

- Server logs API calls with duration and response size limits
- Frontend uses error boundaries for graceful degradation
- API responses follow consistent `{ message }` error format
- Comprehensive error tracking in `server/index.ts` middleware

## Testing & Validation

### Critical Test Commands
```bash
./comprehensive-test.sh                    # Full system validation
./one-time-scripts/test-quotation-crud.sh # Domain-specific testing
```

### Data Validation
- Zod schemas generated from Drizzle tables via `createInsertSchema`
- Form validation integrated with `@hookform/resolvers/zod`
- Server-side validation enforced at route level

## Performance Optimizations

### Frontend
- Lazy loading for route components
- React Query for efficient data fetching with caching
- TanStack Query with proper error boundaries

### Backend
- Modular storage architecture (950 lines vs original 4,260 lines)
- Connection pooling via Drizzle + PostgreSQL
- Efficient JSON response logging with size limits

## Development Guidelines

1. **Follow the modular pattern**: New business domains should have dedicated storage modules and route handlers
2. **Maintain audit trails**: Use `BaseStorage.logAuditEvent()` for data changes
3. **Consistent numbering**: Use `generateNumber(prefix)` for business entity IDs
4. **AI integration**: Leverage the context-aware AI service for user guidance
5. **Test comprehensively**: Run relevant test scripts before committing changes

## Business Context Awareness

This ERP system is designed for **Golden Tag WLL** operations with specific focus on:
- B2B quotation management with approval workflows
- Multi-entity customer classification (Corporate, Individual, Ministry)
- Supplier LPO processing with goods receipt tracking
- Comprehensive audit logging for business compliance

Understanding these business workflows is crucial for effective feature development and AI assistant interactions.