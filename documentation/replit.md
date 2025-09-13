# Golden Tag ERP System

## Overview
A comprehensive sequential workflow ERP system following the exact 10-step process from Customer Enquiry to Invoice with strict step validation and audit compliance.

## Project Architecture

### Database Schema
- **enquiries**: Main enquiry table with customer information, status tracking, and workflow validation
- **enquiryItems**: Line items for each enquiry with quantities, descriptions, and pricing
- **customers**: Customer master data with type classification (Retail/Wholesale)
- **quotations**: Generated quotes based on approved enquiries
- **salesOrders**: Confirmed orders from accepted quotations
- Additional tables for subsequent workflow steps (inventory, delivery, invoicing)

### Frontend Structure
- React + TypeScript with Wouter for routing
- Tailwind CSS + shadcn/ui for consistent design
- TanStack Query for data fetching and state management
- Form handling with react-hook-form + Zod validation

### Backend Architecture
- Express.js with TypeScript
- Drizzle ORM for database operations
- PostgreSQL for production-grade data persistence
- RESTful API design with comprehensive validation

## Recent Implementation (December 26, 2024)

### Enquiry Management System
✅ **Complete CRUD Operations**
- Full enquiry lifecycle management with status tracking
- Multi-channel capture support (Email, Phone, Web Form, Walk-in)
- Customer type differentiation (Retail/Wholesale)
- Advanced filtering and search capabilities

✅ **Enhanced UI Components**
- `EnquiryFilters`: Advanced search with date ranges, status, source, and customer filters
- `EnquiryItemsManager`: Complete item management with add/edit/delete operations
- `AttachmentManager`: File upload with preview, download, and management capabilities
- `EnquiryDetail`: Comprehensive detail view with tabbed interface

✅ **Data Management**
- Proper TypeScript typing throughout the application
- Zod validation for all forms and API endpoints
- Error handling with user-friendly toast notifications
- Cache invalidation for real-time data updates

### Key Features Implemented
- **Multi-channel Enquiry Capture**: Support for email, phone, web form, and walk-in enquiries
- **Status Workflow**: New → In Progress → Quoted → Closed progression
- **Item Management**: Detailed line items with quantities, descriptions, and pricing
- **File Attachments**: Upload, preview, and manage supporting documents
- **Advanced Filtering**: Search by multiple criteria with date range selection
- **Audit Trail**: Comprehensive tracking of all enquiry changes

### Pricing & Costing Engine (Latest - August 26, 2025)
✅ **Complete Pricing Infrastructure**
- 8 new database tables for comprehensive pricing management
- Hierarchical markup system: System → Category → Item levels
- Automated price calculations with exact formulas:
  - Retail Price = Supplier Cost / (1 - Retail Markup %)
  - Wholesale Price = Supplier Cost / (1 - Wholesale Markup %)

✅ **Advanced Pricing Features**
- `PricingManagement`: 5-tab interface for complete pricing control
- Real-time price calculator with dynamic updates
- Customer-specific pricing rules and manual overrides
- Price list generation with CSV download functionality
- Price change history and comprehensive audit logging
- Bulk pricing operations for mass updates

✅ **API Infrastructure**
- Complete REST API with all CRUD operations
- 25+ pricing endpoints covering all functionality
- Multi-level markup configuration management
- Effective price calculation for customer scenarios

## User Preferences
- Focus on production-ready code quality
- Emphasize data integrity and validation
- Prefer comprehensive implementations over minimal examples
- Maintain strict TypeScript typing
- Use modern React patterns and hooks

## Current Development Status
- ✅ Enquiry management fully functional
- ✅ Quotation generation system complete
- ✅ Customer acceptance & PO upload complete
- ✅ Sales order management complete
- ✅ Supplier LPO management complete
- ✅ Inventory management with barcode scanning complete
- ✅ Delivery & invoicing system with barcode picking complete
- ✅ Comprehensive pricing & costing engine complete
- 📋 Complete ERP workflow operational

## Technical Decisions
- Used Drizzle ORM for type-safe database operations
- Implemented proper separation of concerns between components
- Chose shadcn/ui for consistent, accessible UI components
- Adopted TanStack Query for robust data fetching and caching

## File Structure Notes
- `/client/src/components/enquiry/`: Enquiry-specific components
- `/client/src/pages/`: Main application pages
- `/shared/schema.ts`: Database schema definitions
- `/server/routes.ts`: API endpoint definitions
- `/server/storage.ts`: Data access layer