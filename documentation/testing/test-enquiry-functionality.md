# Testing Enquiry Functionality

## Features Implemented

### 1. ✅ Enquiry List Page (/enquiries)
- **View**: Display all enquiries with status, customer, source, and creation date
- **Create**: New enquiry button opens dialog with form
- **Edit**: Edit button opens dialog with pre-filled form
- **Delete**: Delete button shows confirmation dialog
- **Filter**: Filters by status, source, customer, date range, and search
- **Navigation**: Click on row navigates to enquiry detail

### 2. ✅ Enquiry Detail Page (/enquiries/:id)
- **View**: Shows complete enquiry information
- **Edit**: Edit button (placeholder - can be connected to edit dialog)
- **Delete**: Delete button with confirmation
- **Convert to Quotation**: New button that navigates to quotation creation with enquiry context
- **Status Management**: Change status dropdown with update functionality
- **Tabs**: Details, Items, and Attachments

### 3. ✅ Enquiry Form Component
- **Create Mode**: Creates new enquiry
- **Edit Mode**: Updates existing enquiry (supports enquiryId prop)
- **Validation**: Required fields and data validation
- **Customer Selection**: Dropdown with customer list
- **Source Selection**: Email, Phone, Web Form, Walk-in

### 4. ✅ Enquiry Items Manager
- **Add Items**: Dialog form to add items with description, quantity, unit price
- **Edit Items**: Click to edit existing items
- **Delete Items**: Remove items with confirmation
- **Validation**: Required fields and proper data types

### 5. ✅ Attachment Manager
- **Upload**: Drag & drop or click to upload files
- **Preview**: Image preview in dialog
- **Download**: Download attached files
- **Remove**: Delete attachments
- **Validation**: File type and size restrictions

### 6. ✅ Convert to Quotation
- **Backend API**: `/api/quotations/generate/:enquiryId` endpoint implemented
- **Automatic Pricing**: Applies customer-type based markup (Retail: 70%, Wholesale: 40%)
- **Item Transfer**: Copies all enquiry items to quotation with calculated prices
- **Status Update**: Updates enquiry status to "Quoted"
- **Frontend Integration**: Button in enquiry detail navigates to quotation form with enquiry context

## API Endpoints Working

### Enquiry CRUD
- `GET /api/enquiries` - List enquiries with filters
- `GET /api/enquiries/:id` - Get single enquiry
- `POST /api/enquiries` - Create new enquiry
- `PUT /api/enquiries/:id` - Update enquiry
- `DELETE /api/enquiries/:id` - Delete enquiry

### Enquiry Items
- `GET /api/enquiries/:id/items` - Get enquiry items
- `POST /api/enquiry-items` - Create enquiry item
- `PUT /api/enquiry-items/:id` - Update enquiry item
- `DELETE /api/enquiry-items/:id` - Delete enquiry item

### Quotation Generation
- `POST /api/quotations/generate/:enquiryId` - Generate quotation from enquiry

## User Flow: Enquiry to Quotation

1. **Create Enquiry**: User creates enquiry with customer details and items
2. **Add Items**: User adds items to enquiry with descriptions and quantities
3. **Convert**: User clicks "Convert to Quotation" button
4. **Auto-pricing**: System applies customer-type based markup
5. **Review**: User reviews auto-generated quotation
6. **Submit**: Quotation is created and enquiry status updated to "Quoted"

## Testing URLs

- Enquiries List: http://localhost:5000/enquiries
- Create New Enquiry: Click "New Enquiry" button
- Enquiry Detail: Click on any enquiry row
- Convert to Quotation: In enquiry detail, click "Convert to Quotation"

## Error Handling

- ✅ Form validation with error messages
- ✅ API error handling with toast notifications
- ✅ Loading states for async operations
- ✅ Confirmation dialogs for destructive actions
- ✅ Not found handling for invalid enquiry IDs

## Recommendations

1. **Test Data**: Create some sample customers and enquiries to test functionality
2. **Permissions**: Consider adding role-based permissions for edit/delete actions
3. **Audit Trail**: The system already logs audit events for quotation generation
4. **Email Notifications**: Consider adding email notifications when enquiry status changes
5. **Search Enhancement**: Add advanced search with full-text search capabilities
