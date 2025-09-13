import jsPDF from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { Quotation, QuotationItem, Customer, Invoice, InvoiceItem } from '@shared/schema';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface QuotationPDFData {
  quotation: Quotation;
  items: QuotationItem[];
  customer: Customer;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export interface InvoicePDFData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export class PDFService {
  private defaultCompanyInfo = {
    name: "Golden Tag WLL",
    address: "Your Company Address\nCity, State, ZIP\nCountry",
    phone: "+1 (555) 123-4567",
    email: "info@goldentag.com"
  };

  generateQuotationPDF(data: QuotationPDFData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Company Info Header - Simplified
    this.addCompanyHeader(doc, data.companyInfo || this.defaultCompanyInfo);
    
    // Document Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('QUOTATION', pageWidth - 20, 50, { align: 'right' });
    
    // Essential Quotation Details Only
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const quotationDetails = [
      ['Quotation Number:', data.quotation.quoteNumber],
      ['Date:', new Date(data.quotation.quoteDate || data.quotation.createdAt).toLocaleDateString()],
      ['Valid Until:', data.quotation.validUntil ? new Date(data.quotation.validUntil).toLocaleDateString() : 'N/A']
    ];
    
    // Customer Information - Essential only
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 80);
    doc.setFont(undefined, 'normal');
    
    const customerInfo = [
      data.customer.name,
      data.customer.email || '',
      data.customer.phone || ''
    ].filter(Boolean);
    
    customerInfo.forEach((line, index) => {
      doc.text(line, 20, 90 + (index * 5));
    });
    
    // Quotation Details Table
    doc.setFont(undefined, 'bold');
    doc.text('Quotation Details:', 20, 120);
    doc.setFont(undefined, 'normal');
    
    quotationDetails.forEach(([label, value], index) => {
      doc.text(`${label} ${value}`, 20, 130 + (index * 5));
    });
    
    // Items Table - Essential columns only
    const tableData = data.items.map((item, index) => [
      index + 1,
      item.description,
      item.quantity.toString(),
      `$${parseFloat(item.unitPrice).toFixed(2)}`,
      `$${parseFloat(item.lineTotal).toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: 160,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 90 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      }
    });
    
    // Totals - Essential only
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const subtotal = parseFloat(data.quotation.subtotal || '0');
    const discountAmount = parseFloat(data.quotation.discountAmount || '0');
    const taxAmount = parseFloat(data.quotation.taxAmount || '0');
    const totalAmount = parseFloat(data.quotation.totalAmount || '0');
    
    const totals = [
      ['Subtotal:', `$${subtotal.toFixed(2)}`],
      ['Discount:', `-$${discountAmount.toFixed(2)}`],
      ['Tax:', `$${taxAmount.toFixed(2)}`],
      ['Total:', `$${totalAmount.toFixed(2)}`]
    ];
    
    totals.forEach(([label, value], index) => {
      const y = finalY + (index * 8);
      doc.text(label, pageWidth - 60, y);
      doc.text(value, pageWidth - 20, y, { align: 'right' });
    });
    
    // Terms - Only if essential
    if (data.quotation.terms && data.quotation.terms.length > 0) {
      const termsY = finalY + 40;
      doc.setFont(undefined, 'bold');
      doc.text('Terms & Conditions:', 20, termsY);
      doc.setFont(undefined, 'normal');
      
      const splitTerms = doc.splitTextToSize(data.quotation.terms, pageWidth - 40);
      doc.text(splitTerms, 20, termsY + 10);
    }
    
    // Simplified Footer
    this.addFooter(doc, pageHeight);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  generateInvoicePDF(data: InvoicePDFData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Company Info Header - Simplified
    this.addCompanyHeader(doc, data.companyInfo || this.defaultCompanyInfo);
    
    // Document Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', pageWidth - 20, 50, { align: 'right' });
    
    // Essential Invoice Details Only
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const invoiceDetails = [
      ['Invoice Number:', data.invoice.invoiceNumber],
      ['Invoice Date:', new Date(data.invoice.invoiceDate || data.invoice.createdAt).toLocaleDateString()],
      ['Due Date:', data.invoice.dueDate ? new Date(data.invoice.dueDate).toLocaleDateString() : 'N/A']
    ];
    
    // Customer Information - Essential only
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 80);
    doc.setFont(undefined, 'normal');
    
    const customerInfo = [
      data.customer.name,
      data.customer.email || '',
      data.customer.phone || ''
    ].filter(Boolean);
    
    customerInfo.forEach((line, index) => {
      doc.text(line, 20, 90 + (index * 5));
    });
    
    // Invoice Details Table
    doc.setFont(undefined, 'bold');
    doc.text('Invoice Details:', 20, 120);
    doc.setFont(undefined, 'normal');
    
    invoiceDetails.forEach(([label, value], index) => {
      doc.text(`${label} ${value}`, 20, 130 + (index * 5));
    });
    
    // Items Table - Essential columns only
    const tableData = data.items.map((item, index) => [
      index + 1,
      item.description,
      item.quantity.toString(),
      `${data.invoice.currency || 'USD'} ${parseFloat(item.unitPrice).toFixed(2)}`,
      `${data.invoice.currency || 'USD'} ${parseFloat(item.totalPrice).toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: 160,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 90 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      }
    });
    
    // Totals - Essential only
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const subtotal = parseFloat(data.invoice.subtotal || '0');
    const discountAmount = parseFloat(data.invoice.discountAmount || '0');
    const taxAmount = parseFloat(data.invoice.taxAmount || '0');
    const totalAmount = parseFloat(data.invoice.totalAmount || '0');
    const paidAmount = parseFloat(data.invoice.paidAmount || '0');
    const outstandingAmount = parseFloat(data.invoice.outstandingAmount || '0');
    
    const totals = [
      ['Subtotal:', `${data.invoice.currency || 'USD'} ${subtotal.toFixed(2)}`],
      ['Discount:', `-${data.invoice.currency || 'USD'} ${discountAmount.toFixed(2)}`],
      ['Tax:', `${data.invoice.currency || 'USD'} ${taxAmount.toFixed(2)}`],
      ['Total Amount:', `${data.invoice.currency || 'USD'} ${totalAmount.toFixed(2)}`],
      ['Paid Amount:', `${data.invoice.currency || 'USD'} ${paidAmount.toFixed(2)}`],
      ['Outstanding:', `${data.invoice.currency || 'USD'} ${outstandingAmount.toFixed(2)}`]
    ];
    
    totals.forEach(([label, value], index) => {
      const y = finalY + (index * 8);
      doc.text(label, pageWidth - 60, y);
      doc.text(value, pageWidth - 20, y, { align: 'right' });
    });
    
    // Payment Information - Only if essential
    if (data.invoice.paymentTerms) {
      const paymentY = finalY + 60;
      doc.setFont(undefined, 'bold');
      doc.text('Payment Terms:', 20, paymentY);
      doc.setFont(undefined, 'normal');
      doc.text(data.invoice.paymentTerms, 20, paymentY + 10);
    }
    
    // Simplified Footer
    this.addFooter(doc, pageHeight);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  private addCompanyHeader(doc: jsPDF, companyInfo: any) {
    try {
      // Add Golden Tag Logo
      const logoPath = path.join(process.cwd(), 'public', 'logo golden tag.jpg');
      const logoWidth = 40;
      const logoHeight = 20;
      
      // Read logo file and convert to base64
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      const logoDataUrl = `data:image/jpeg;base64,${logoBase64}`;
      
      // Add logo image
      doc.addImage(logoDataUrl, 'JPEG', 20, 20, logoWidth, logoHeight);
      
      // Company Name (positioned next to logo)
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(companyInfo.name, 70, 32);

      // Company Details - Essential only
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const companyDetails = [
        companyInfo.address,
        `Phone: ${companyInfo.phone}`,
        `Email: ${companyInfo.email}`
      ].filter(Boolean);

      companyDetails.forEach((line, index) => {
        doc.text(line, 70, 40 + (index * 4));
      });
    } catch (error) {
      console.warn('Could not load logo, using fallback header:', error);
      
      // Fallback: Company Logo Area (placeholder)
      doc.setFillColor(41, 128, 185);
      doc.rect(20, 20, 60, 20, 'F');

      // Company Name
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(companyInfo.name, 25, 32);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Company Details - Essential only
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const companyDetails = [
        companyInfo.address,
        `Phone: ${companyInfo.phone}`,
        `Email: ${companyInfo.email}`
      ].filter(Boolean);

      companyDetails.forEach((line, index) => {
        doc.text(line, 20, 50 + (index * 4));
      });
    }
  }

  private addFooter(doc: jsPDF, pageHeight: number) {
    const footerY = pageHeight - 20;
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY - 10, doc.internal.pageSize.getWidth() - 20, footerY - 10);
    
    // Simplified Footer text
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', 20, footerY);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() - 20, footerY, { align: 'right' });
  }
}

export const pdfService = new PDFService();
