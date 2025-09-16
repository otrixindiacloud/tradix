const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const fs = require('fs');

// Simple test to verify the enhanced PDF design
console.log('🎨 Testing Enhanced Invoice PDF Generation (Simple Test)...');

try {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colorful header background - Golden
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Company name in white on golden background
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Golden Tag WLL', 20, 22);
  
  // INVOICE text
  doc.setFontSize(24);
  doc.text('INVOICE', pageWidth - 20, 22, { align: 'right' });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Invoice details with colored box
  doc.setFillColor(240, 240, 240);
  doc.rect(pageWidth - 90, 40, 85, 25, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.rect(pageWidth - 90, 40, 85, 25, 'S');
  
  doc.setFontSize(9);
  doc.text('Invoice #: INV-48024KX758', pageWidth - 85, 48);
  doc.text('Date: ' + new Date().toLocaleDateString(), pageWidth - 85, 54);
  doc.text('Currency: USD', pageWidth - 85, 60);
  
  // BILL TO section with colored header
  doc.setFillColor(212, 175, 55);
  doc.rect(20, 75, 40, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BILL TO:', 22, 80);
  
  // Customer box
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.rect(20, 83, pageWidth - 40, 25, 'S');
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('E2E Customer', 25, 92);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('e2e@customer.com', 25, 97);
  doc.text('Type: Retail | Class: Corporate', 25, 102);
  
  // Enhanced table with golden header
  const tableY = 115;
  doc.setFillColor(212, 175, 55);
  doc.rect(20, tableY, pageWidth - 40, 10, 'F');
  
  // Table headers
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('#', 25, tableY + 6);
  doc.text('Description & Specs', 60, tableY + 6);
  doc.text('Qty', 130, tableY + 6);
  doc.text('Unit Price', 150, tableY + 6);
  doc.text('Total', 175, tableY + 6);
  
  // Table row with border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(20, tableY + 10, pageWidth - 40, 15, 'S');
  
  // Row content
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('1', 25, tableY + 18);
  doc.text('INTRUDER 261865R3 SP311 BLACK', 30, tableY + 18);
  doc.text('Supplier: SUP001 | Barcode: BC123456789', 30, tableY + 22);
  doc.text('3', 130, tableY + 18);
  doc.text('$8.38', 150, tableY + 18);
  doc.text('$25.14', 175, tableY + 18);
  
  // Summary section with golden border
  const summaryY = tableY + 35;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.rect(pageWidth - 100, summaryY, 90, 40, 'S');
  
  doc.setFillColor(212, 175, 55);
  doc.rect(pageWidth - 100, summaryY, 90, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SUMMARY', pageWidth - 55, summaryY + 5, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 95, summaryY + 15);
  doc.text('USD 25.14', pageWidth - 15, summaryY + 15, { align: 'right' });
  doc.text('Tax (VAT):', pageWidth - 95, summaryY + 21);
  doc.text('USD 2.51', pageWidth - 15, summaryY + 21, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 95, summaryY + 27);
  doc.text('USD 27.65', pageWidth - 15, summaryY + 27, { align: 'right' });
  
  // Terms section
  const termsY = summaryY + 50;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, termsY, pageWidth - 40, 20, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.rect(20, termsY, pageWidth - 40, 20, 'S');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text('TERMS & CONDITIONS', 22, termsY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('• Payment within 30 days', 22, termsY + 15);
  doc.text('• Golden Tag WLL reserves all rights', 110, termsY + 15);
  
  // Save the PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync('./test_invoice_enhanced_simple.pdf', pdfBuffer);
  
  console.log('✅ Enhanced Invoice PDF generated successfully!');
  console.log('📄 File saved as: test_invoice_enhanced_simple.pdf');
  console.log('📊 PDF Size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
  console.log('');
  console.log('🎨 Features included:');
  console.log('  ✓ Golden header background with white text');
  console.log('  ✓ Styled invoice details box with border');
  console.log('  ✓ Colorful BILL TO section');
  console.log('  ✓ Enhanced table with golden header');
  console.log('  ✓ Bordered table rows with specifications');
  console.log('  ✓ Professional summary box with golden theme');
  console.log('  ✓ Styled terms & conditions section');
  
} catch (error) {
  console.error('❌ Error generating enhanced invoice PDF:', error);
  console.error(error.stack);
}