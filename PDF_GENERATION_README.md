# PDF Generation for Tradix for Golden Tag

This document describes the PDF generation functionality implemented for quotations and invoices in the Tradix for Golden Tag system.

## Features

### Quotation PDF Generation
- **Endpoint**: `GET /api/quotations/:id/pdf`
- **Features**:
  - Professional quotation layout with company branding
  - Customer information section
  - Detailed item listing with quantities and pricing
  - Financial summary (subtotal, discount, tax, total)
  - Terms and conditions
  - Company information header
  - Auto-generated filename: `quotation-{quoteNumber}.pdf`

### Invoice PDF Generation
- **Endpoint**: `GET /api/invoices/:id/pdf`
- **Features**:
  - Professional invoice layout with company branding
  - Customer billing information
  - Detailed item listing with quantities and pricing
  - Financial summary including payment tracking
  - Payment information section
  - Notes and internal notes
  - Company information header
  - Auto-generated filename: `invoice-{invoiceNumber}.pdf`

## Technical Implementation

### Backend (Server-side)
- **PDF Service**: `server/pdf-service.ts`
  - Uses jsPDF and jsPDF-autotable libraries
  - Generates professional PDF documents
  - Handles company branding and formatting
  - Supports multi-currency display

- **API Routes**:
  - `server/routes/quotations.ts` - Added PDF generation endpoint
  - `server/routes/invoice.ts` - Added PDF generation endpoint

### Frontend (Client-side)
- **Quotation Detail Page**: `client/src/pages/quotation-detail.tsx`
  - Updated to use server-side PDF generation
  - Download button triggers PDF generation API call
  - Automatic file download with proper filename

- **Invoice Management Page**: `client/src/pages/invoicing.tsx`
  - Added PDF download functionality to invoice details dialog
  - Added PDF download button to invoice table actions
  - Server-side PDF generation for better performance

## Usage

### For Quotations
1. Navigate to the Quotations page
2. Click on any quotation to view details
3. Click the "Download PDF" button
4. PDF will be automatically downloaded with filename: `quotation-{quoteNumber}.pdf`

### For Invoices
1. Navigate to the Invoicing page
2. Either:
   - Click the download icon in the actions column of any invoice row
   - Click on an invoice to view details, then click "Download PDF"
3. PDF will be automatically downloaded with filename: `invoice-{invoiceNumber}.pdf`

## PDF Layout Features

### Company Header
- Company logo area (placeholder for future logo integration)
- Company name: "Golden Tag WLL"
- Contact information (address, phone, email, website, tax ID)
- Professional blue color scheme

### Document Content
- **Quotation PDF**:
  - Document title: "QUOTATION"
  - Quotation number, date, validity period
  - Customer information section
  - Itemized product/service list with pricing
  - Financial calculations (subtotal, discount, tax, total)
  - Terms and conditions
  - Notes section

- **Invoice PDF**:
  - Document title: "INVOICE"
  - Invoice number, date, due date
  - Customer billing information
  - Itemized product/service list with pricing
  - Financial calculations including payment tracking
  - Payment information
  - Notes and internal notes

### Footer
- "Thank you for your business!" message
- Generation timestamp
- Professional styling

## Configuration

### Company Information
The company information is currently hardcoded in the PDF service. To customize:

1. Edit `server/pdf-service.ts`
2. Update the `defaultCompanyInfo` object:
```typescript
private defaultCompanyInfo = {
  name: "Your Company Name",
  address: "Your Company Address\nCity, State, ZIP\nCountry",
  phone: "+1 (555) 123-4567",
  email: "info@yourcompany.com",
  website: "www.yourcompany.com",
  taxId: "TAX123456789"
};
```

### Styling
- Colors: Blue theme (#2980b9)
- Fonts: Default jsPDF fonts
- Layout: Professional business document format
- Tables: Auto-formatted with proper alignment

## Dependencies

### Backend
- `jspdf`: ^3.0.2 - PDF generation library
- `jspdf-autotable`: ^5.0.2 - Table generation for PDFs
- `@types/jspdf`: ^2.0.0 - TypeScript definitions

### Frontend
- Uses native fetch API for PDF download
- No additional dependencies required

## Error Handling

- **Server-side**: Proper error responses with appropriate HTTP status codes
- **Client-side**: Toast notifications for success/error states
- **File download**: Automatic cleanup of blob URLs to prevent memory leaks

## Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Navigate to quotations or invoices in the browser
3. Click "Download PDF" on any document
4. Verify PDF downloads with correct content and formatting

### Automated Testing
Run the test script:
```bash
node test-pdf-generation.js
```

## Future Enhancements

1. **Company Logo Integration**: Add support for company logo in PDF header
2. **Custom Templates**: Allow customization of PDF layouts
3. **Email Integration**: Send PDFs directly via email
4. **Batch Generation**: Generate multiple PDFs at once
5. **Watermarking**: Add draft/confidential watermarks
6. **Digital Signatures**: Add digital signature support
7. **Multi-language Support**: Support for different languages
8. **Custom Styling**: User-configurable colors and fonts

## Troubleshooting

### Common Issues

1. **PDF not downloading**:
   - Check browser console for errors
   - Verify server is running
   - Check network tab for API call status

2. **PDF content missing**:
   - Ensure quotation/invoice has items
   - Check customer information is complete
   - Verify data is properly loaded

3. **Styling issues**:
   - Check jsPDF version compatibility
   - Verify autoTable plugin is loaded
   - Check for console errors

### Debug Mode
Enable debug logging by adding console.log statements in the PDF service methods to trace generation process.

## Security Considerations

- PDF generation is server-side to prevent client-side data exposure
- No sensitive data is logged during PDF generation
- Proper error handling prevents information leakage
- File downloads use secure blob URLs with automatic cleanup

## Performance

- PDF generation is server-side for better performance
- Minimal memory usage with proper cleanup
- Fast generation for typical business documents
- Efficient table rendering with autoTable plugin

---

**Note**: This PDF generation system is designed for the Tradix for Golden Tag system and follows professional business document standards. The implementation is scalable and can be extended for additional document types as needed.
