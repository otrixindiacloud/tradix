import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { Quotation, QuotationItem, Customer, Invoice, InvoiceItem, Item } from '@shared/schema';

// Company information
const COMPANY_INFO = {
  name: "Golden Tag WLL",
  arabicName: "الشركة العربية للتجارة",
  address: "P.O. Box 12345, Doha, Qatar",
  phone: "+974 4444 5555",
  mobile: "+974 5555 6666",
  email: "info@goldentag.com",
  website: "www.goldentag.com",
  crNumber: "CR-123456789",
  taxNumber: "TAX-987654321"
};

export interface EnhancedInvoicePDFData {
  invoice: Invoice;
  items: (InvoiceItem & { item?: Item })[];
  customer: Customer;
  salesOrder?: any;
  delivery?: any;
}

export interface QuotationPDFData {
  quotation: Quotation;
  items: QuotationItem[];
  customer: Customer;
}

export interface InvoicePDFData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer;
}

export class PDFService {
  private static instance: PDFService;

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * Generate comprehensive invoice PDF with all client material requirements
   */
  generateComprehensiveInvoicePDF(data: EnhancedInvoicePDFData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    try {
      // Company Header with Logo and Complete Information
      this.addEnhancedCompanyHeader(doc);
      
      // Document Title and Type
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(212, 175, 55); // Golden color
      const docTitle = data.invoice.invoiceType === 'Proforma' ? 'PROFORMA INVOICE' : 'COMMERCIAL INVOICE';
      doc.text(docTitle, pageWidth - 20, 60, { align: 'right' });
      
      // Invoice Information Panel
      this.addInvoiceInfoPanel(doc, data.invoice, pageWidth);
      
      // Customer Information Panel
      this.addCustomerInfoPanel(doc, data.customer, 20, 110);
      
      // Items Table with Material Specifications
      const itemsStartY = 180;
      this.addEnhancedItemsTable(doc, data.items, itemsStartY, data.invoice.currency || 'USD');
      
      // Financial Summary with Multi-Currency Support
      const finalY = (doc as any).lastAutoTable?.finalY || itemsStartY + 100;
      this.addFinancialSummary(doc, data.invoice, pageWidth, finalY + 15);
      
      // Banking Information for Payment
      const bankingY = finalY + 80;
      this.addBankingInformation(doc, data.invoice.currency || 'USD', bankingY);
      
      // Terms and Conditions
      const termsY = bankingY + 60;
      this.addTermsAndConditions(doc, termsY, pageHeight);
      
      // Footer with Legal Information
      this.addEnhancedFooter(doc, pageHeight);
      
      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating comprehensive invoice PDF:', error);
      // Fallback to simple PDF
      return this.generateSimpleInvoicePDF(data);
    }
  }

  /**
   * Generate simple invoice PDF as fallback
   */
  private generateSimpleInvoicePDF(data: EnhancedInvoicePDFData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Simple header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, 20, 30);
    
    doc.setFontSize(16);
    doc.text('INVOICE', pageWidth - 20, 30, { align: 'right' });
    
    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Number: ${data.invoice.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${new Date(data.invoice.invoiceDate || data.invoice.createdAt!).toLocaleDateString()}`, 20, 60);
    
    // Customer info
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customer.name, 20, 90);
    if (data.customer.email) doc.text(data.customer.email, 20, 100);
    
    // Simple items table
    const tableData = data.items.map((item, index) => [
      (index + 1).toString(),
      item.description || '',
      item.quantity.toString(),
      `${data.invoice.currency || 'USD'} ${parseFloat(item.unitPrice.toString()).toFixed(2)}`,
      `${data.invoice.currency || 'USD'} ${parseFloat(item.totalPrice.toString()).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: 120,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${data.invoice.currency || 'USD'} ${parseFloat(data.invoice.totalAmount?.toString() || '0').toFixed(2)}`, 
             pageWidth - 20, finalY + 20, { align: 'right' });
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Enhanced company header with Golden Tag branding
   */
  private addEnhancedCompanyHeader(doc: jsPDF) {
    try {
      // Try to add logo
      const logoPath = path.join(process.cwd(), 'public', 'logo golden tag.jpg');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString('base64');
        const logoDataUrl = `data:image/jpeg;base64,${logoBase64}`;
        doc.addImage(logoDataUrl, 'JPEG', 20, 15, 50, 25);
      }
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
    
    // Company Name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text(COMPANY_INFO.name, 80, 25);
    
    // Arabic name
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(COMPANY_INFO.arabicName, 80, 32);
    
    // Company details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    const details = [
      COMPANY_INFO.address,
      `Phone: ${COMPANY_INFO.phone} | Mobile: ${COMPANY_INFO.mobile}`,
      `Email: ${COMPANY_INFO.email} | Website: ${COMPANY_INFO.website}`,
      `CR: ${COMPANY_INFO.crNumber} | Tax: ${COMPANY_INFO.taxNumber}`
    ];
    
    details.forEach((line, index) => {
      doc.text(line, 80, 42 + (index * 4));
    });
  }

  /**
   * Add invoice information panel
   */
  private addInvoiceInfoPanel(doc: jsPDF, invoice: Invoice, pageWidth: number) {
    const startX = pageWidth - 85;
    const startY = 80;
    
    // Background panel
    doc.setFillColor(248, 249, 250);
    doc.rect(startX - 5, startY - 5, 80, 45, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(startX - 5, startY - 5, 80, 45, 'S');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const invoiceInfo = [
      ['Invoice Number:', invoice.invoiceNumber],
      ['Date:', new Date(invoice.invoiceDate || invoice.createdAt!).toLocaleDateString()],
      ['Due Date:', invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'],
      ['Currency:', invoice.currency || 'USD'],
      ['Status:', invoice.status]
    ];
    
    invoiceInfo.forEach(([label, value], index) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label || '', startX, startY + (index * 6));
      doc.setFont('helvetica', 'bold');
      doc.text(value || '', startX + 35, startY + (index * 6));
    });
  }

  /**
   * Add customer information panel
   */
  private addCustomerInfoPanel(doc: jsPDF, customer: Customer, x: number, y: number) {
    doc.setFillColor(248, 249, 250);
    doc.rect(x - 5, y - 5, 120, 55, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(x - 5, y - 5, 120, 55, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text('BILL TO:', x, y);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(customer.name, x, y + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const customerInfo = [
      customer.email ? `Email: ${customer.email}` : '',
      customer.phone ? `Phone: ${customer.phone}` : '',
      customer.address ? customer.address : '',
      customer.taxId ? `Tax ID: ${customer.taxId}` : '',
      `Customer Type: ${customer.customerType}`,
      `Classification: ${customer.classification}`
    ].filter(Boolean);
    
    customerInfo.forEach((line, index) => {
      if (line.length > 40) {
        const splitText = doc.splitTextToSize(line, 110);
        splitText.forEach((splitLine: string, splitIndex: number) => {
          doc.text(splitLine, x, y + 18 + (index * 6) + (splitIndex * 4));
        });
      } else {
        doc.text(line, x, y + 18 + (index * 6));
      }
    });
  }

  /**
   * Enhanced items table with material specifications
   */
  private addEnhancedItemsTable(doc: jsPDF, items: (InvoiceItem & { item?: Item })[], startY: number, currency: string) {
    const tableData = items.map((item, index) => {
      const materialSpecs = [];
      if (item.supplierCode) materialSpecs.push(`Supplier: ${item.supplierCode}`);
      if (item.barcode) materialSpecs.push(`Barcode: ${item.barcode}`);
      if (item.item?.category) materialSpecs.push(`Category: ${item.item.category}`);
      if (item.item?.unitOfMeasure) materialSpecs.push(`UOM: ${item.item.unitOfMeasure}`);
      
      const descriptionWithSpecs = item.description + 
        (materialSpecs.length > 0 ? `\n${materialSpecs.join(' | ')}` : '');
      
      return [
        (index + 1).toString(),
        descriptionWithSpecs,
        item.quantity.toString(),
        `${currency} ${parseFloat(item.unitPrice.toString()).toFixed(2)}`,
        item.discountPercentage ? `${item.discountPercentage}%` : '0%',
        item.taxRate ? `${item.taxRate}%` : '0%',
        `${currency} ${parseFloat(item.totalPrice.toString()).toFixed(2)}`
      ];
    });
    
    autoTable(doc, {
      startY: startY,
      head: [['#', 'Description & Material Specs', 'Qty', 'Unit Price', 'Disc.', 'Tax', 'Total']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [212, 175, 55],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 70 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'right', cellWidth: 25 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });
  }

  /**
   * Financial summary with multi-currency support
   */
  private addFinancialSummary(doc: jsPDF, invoice: Invoice, pageWidth: number, startY: number) {
    const currency = invoice.currency || 'USD';
    const summaryX = pageWidth - 90;
    
    // Background
    doc.setFillColor(248, 249, 250);
    doc.rect(summaryX - 5, startY - 5, 85, 60, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(summaryX - 5, startY - 5, 85, 60, 'S');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const financials = [
      ['Subtotal:', `${currency} ${parseFloat(invoice.subtotal?.toString() || '0').toFixed(2)}`],
      ['Discount:', `-${currency} ${parseFloat(invoice.discountAmount?.toString() || '0').toFixed(2)}`],
      ['Tax Amount:', `${currency} ${parseFloat(invoice.taxAmount?.toString() || '0').toFixed(2)}`],
      ['Total Amount:', `${currency} ${parseFloat(invoice.totalAmount?.toString() || '0').toFixed(2)}`],
      ['Paid Amount:', `${currency} ${parseFloat(invoice.paidAmount?.toString() || '0').toFixed(2)}`],
      ['Outstanding:', `${currency} ${parseFloat(invoice.outstandingAmount?.toString() || '0').toFixed(2)}`]
    ];
    
    financials.forEach(([label, value], index) => {
      const y = startY + (index * 8);
      const isTotal = label === 'Total Amount:';
      
      if (isTotal) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      
      doc.text(label, summaryX, y);
      doc.text(value, pageWidth - 10, y, { align: 'right' });
      
      if (isTotal) {
        doc.setDrawColor(212, 175, 55);
        doc.line(summaryX, y + 2, pageWidth - 10, y + 2);
      }
    });
  }

  /**
   * Banking information for payment
   */
  private addBankingInformation(doc: jsPDF, currency: string, startY: number) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text('BANKING INFORMATION FOR PAYMENT:', 20, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const bankingDetails = [
      'Bank Name: Commercial Bank of Qatar',
      'Account Name: Golden Tag WLL',
      'Account Number: 123456789012',
      'IBAN: QA12CBQK000000001234567890',
      'SWIFT Code: CBQKQAQA',
      `Currency: ${currency}`
    ];
    
    bankingDetails.forEach((detail, index) => {
      doc.text(detail, 20, startY + 10 + (index * 6));
    });
  }

  /**
   * Terms and conditions
   */
  private addTermsAndConditions(doc: jsPDF, startY: number, pageHeight: number) {
    if (startY > pageHeight - 60) {
      doc.addPage();
      startY = 30;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text('TERMS & CONDITIONS:', 20, startY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const terms = [
      'Payment is due within 30 days of invoice date.',
      'All prices are quoted in the specified currency.',
      'Goods remain the property of Golden Tag WLL until full payment is received.',
      'Any disputes must be raised within 7 days of delivery.',
      'Interest may be charged on overdue accounts at 2% per month.',
      'Golden Tag WLL reserves the right to charge for storage of undelivered goods.'
    ];
    
    let currentY = startY + 10;
    terms.forEach((term, index) => {
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 30;
      }
      doc.text(`${index + 1}. ${term}`, 20, currentY);
      currentY += 6;
    });
  }

  /**
   * Enhanced footer with legal information
   */
  private addEnhancedFooter(doc: jsPDF, pageHeight: number) {
    const footerY = pageHeight - 25;
    
    // Footer line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 15, doc.internal.pageSize.getWidth() - 20, footerY - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    doc.text('Thank you for your business with Golden Tag WLL', 20, footerY - 8);
    doc.text(`Generated on ${new Date().toLocaleDateString()} - This is a computer generated document.`, 20, footerY - 4);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text('Authorized Signature: ___________________', pageWidth - 80, footerY - 8, { align: 'right' });
  }

  // Legacy methods for backward compatibility
  generateQuotationPDF(data: QuotationPDFData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Simple quotation PDF
    this.addEnhancedCompanyHeader(doc);
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth - 20, 50, { align: 'right' });
    
    // Add quotation details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Customer Information
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 80);
    doc.setFont('helvetica', 'normal');
    
    const customerInfo = [
      data.customer.name,
      data.customer.email || '',
      data.customer.phone || ''
    ].filter(Boolean);
    
    customerInfo.forEach((line, index) => {
      doc.text(line, 20, 90 + (index * 5));
    });
    
    // Basic table for items
    const tableData = data.items.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      `$${parseFloat(item.unitPrice.toString()).toFixed(2)}`,
      `$${parseFloat(item.lineTotal.toString()).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: 120,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  generateInvoicePDF(data: InvoicePDFData): Buffer {
    // Convert to enhanced format and use comprehensive generator
    const enhancedData: EnhancedInvoicePDFData = {
      invoice: data.invoice,
      items: data.items,
      customer: data.customer
    };
    
    return this.generateComprehensiveInvoicePDF(enhancedData);
  }
}

export const pdfService = new PDFService();