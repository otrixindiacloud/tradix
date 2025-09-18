/**
 * LEGACY SIMPLE PDF SERVICE - replaced by pdf/pdf-utils.ts
 * Retained temporarily for comparison and rollback.
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { Quotation, QuotationItem, Customer, Invoice, InvoiceItem, Item } from '@shared/schema';
import { GOLDEN_TAG_COMPANY_INFO, getBankingInfoForCurrency, getFormattedAddress, getFormattedContactInfo, getFormattedLegalInfo } from './config/company-info';

// Type declaration for autoTable
declare global {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface EnhancedInvoicePDFData {
  invoice: Invoice;
  items: (InvoiceItem & { item?: Item })[];
  customer: Customer;
  salesOrder?: any;
  delivery?: any;
}

export function formatCurrency(amount: number | string, currency = 'AED'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
  }).format(numAmount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Create a simple, reliable PDF for testing
 */
export function createSimpleTestInvoicePDF(invoiceData: EnhancedInvoicePDFData): Buffer {
  try {
    // Use default jsPDF constructor which should work with any version
    const doc = new (jsPDF as any)('p', 'mm', 'a4');
    
    // Set basic fonts and colors
    doc.setFontSize(20);
    doc.setTextColor(40);
    
    // Header
    doc.text('INVOICE', 20, 30);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoiceData.invoice.invoiceNumber}`, 20, 40);
  doc.text(`Date: ${formatDate((invoiceData.invoice as any).invoiceDate || new Date())}`, 20, 50);
    
    // Company Information
    doc.setFontSize(14);
    doc.text('Golden Tag WLL', 120, 30);
    doc.setFontSize(10);
    doc.text('Building 123, Industrial Area', 120, 40);
    doc.text('Doha, Qatar', 120, 45);
    doc.text('Tel: +974 1234 5678', 120, 50);
    doc.text('Email: info@goldentag.qa', 120, 55);
    
    // Customer Information
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 70);
    doc.setFontSize(10);
    doc.text(`Customer ID: ${invoiceData.customer?.id || 'N/A'}`, 20, 80);
  doc.text(`Name: ${(invoiceData.customer as any)?.customerName || invoiceData.customer?.name || 'N/A'}`, 20, 85);
    doc.text(`Email: ${invoiceData.customer?.email || 'N/A'}`, 20, 90);
    
    // Items Table Header
    let yPos = 110;
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 10, 'F');
    doc.text('Description', 25, yPos + 7);
    doc.text('Qty', 120, yPos + 7);
    doc.text('Unit Price', 140, yPos + 7);
    doc.text('Total', 170, yPos + 7);
    
    // Items
    yPos += 15;
    let itemTotal = 0;
    
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item, index) => {
        const lineTotal = parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString());
        itemTotal += lineTotal;
        
        doc.text(`Item ${index + 1}: ${item.description || 'Product'}`, 25, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
  const cur = (invoiceData.invoice as any).currency || 'BHD';
  doc.text(formatCurrency(parseFloat(item.unitPrice.toString()), cur), 140, yPos);
  doc.text(formatCurrency(lineTotal, cur), 170, yPos);
        yPos += 10;
      });
    } else {
      doc.text('No items found', 25, yPos);
      yPos += 10;
    }
    
    // Totals
    yPos += 10;
    doc.setFontSize(12);
    doc.text('Subtotal:', 130, yPos);
  doc.text(formatCurrency(parseFloat((invoiceData.invoice as any).subtotal || 0), (invoiceData.invoice as any).currency || 'BHD'), 170, yPos);
    
    yPos += 10;
    doc.text('Tax:', 130, yPos);
  doc.text(formatCurrency(parseFloat((invoiceData.invoice as any).taxAmount || 0), (invoiceData.invoice as any).currency || 'BHD'), 170, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 130, yPos);
  doc.text(formatCurrency(parseFloat((invoiceData.invoice as any).totalAmount || 0), (invoiceData.invoice as any).currency || 'BHD'), 170, yPos);
    
    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 20, 280);
    doc.text('This is a computer generated invoice.', 20, 285);
    
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error creating simple PDF:', error);
    throw new Error(`Failed to create simple PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced PDF with comprehensive company information and material details
 */
export function createEnhancedInvoicePDF(invoiceData: EnhancedInvoicePDFData): Buffer {
  try {
    const doc = new (jsPDF as any)('p', 'mm', 'a4');
    const pageHeight = 297;
    const pageWidth = 210;
    let yPos = 20;
    
    // Enhanced Header with Company Branding
    doc.setFillColor(25, 118, 210); // Blue header
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 25);
    
    doc.setFontSize(14);
    doc.text(GOLDEN_TAG_COMPANY_INFO.name, 120, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const companyLines = getFormattedAddress().split('\n');
    companyLines.forEach((line, index) => {
      doc.text(line, 120, 25 + (index * 4));
    });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPos = 50;
    
    // Invoice Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoiceData.invoice.invoiceNumber}`, 20, yPos);
  doc.text(`Invoice Date: ${formatDate((invoiceData.invoice as any).invoiceDate || new Date())}`, 120, yPos);
    yPos += 6;
    
    if (invoiceData.invoice.dueDate) {
      doc.text(`Due Date: ${formatDate(invoiceData.invoice.dueDate)}`, 20, yPos);
    }
    doc.text(`Currency: ${invoiceData.invoice.currency}`, 120, yPos);
    yPos += 6;
    
    doc.text(`Status: ${invoiceData.invoice.status}`, 20, yPos);
    yPos += 15;
    
    // Customer Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (invoiceData.customer) {
  doc.text(`${(invoiceData.customer as any).customerName || invoiceData.customer.name || 'N/A'}`, 20, yPos);
      yPos += 6;
      if (invoiceData.customer.email) {
        doc.text(`Email: ${invoiceData.customer.email}`, 20, yPos);
        yPos += 6;
      }
      if (invoiceData.customer.phone) {
        doc.text(`Phone: ${invoiceData.customer.phone}`, 20, yPos);
        yPos += 6;
      }
      if (invoiceData.customer.address) {
        const addressLines = invoiceData.customer.address.split('\n');
        addressLines.forEach(line => {
          doc.text(line, 20, yPos);
          yPos += 4;
        });
      }
    }
    yPos += 10;
    
    // Items Table with Material Details
    const tableData: any[] = [];
    const headers = ['Description', 'Material Specs', 'Qty', 'Unit Price', 'Total'];
    
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item) => {
        const lineTotal = parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString());
        
        // Material specifications (mock data for comprehensive display)
        const materialSpecs = [
          // TODO: Update to use supplier name once invoice items include supplier data
          `Supplier Code: ${item.supplierCode || 'N/A'}`,
          `Barcode: ${item.barcode || 'N/A'}`,
          'Material: Premium Grade',
          'Dimensions: As specified',
          'Quality: ISO certified'
        ].join('\n');
        
        tableData.push([
          item.description || 'Product',
          materialSpecs,
          item.quantity.toString(),
          formatCurrency(parseFloat(item.unitPrice.toString()), (invoiceData.invoice as any).currency || 'BHD'),
          formatCurrency(lineTotal, (invoiceData.invoice as any).currency || 'BHD')
        ]);
      });
    }
    
    // Use autoTable if available, otherwise create a simple table
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable({
        startY: yPos,
        head: [headers],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 60 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
        },
        didDrawPage: function(data: any) {
          yPos = data.cursor.y;
        }
      });
      yPos += 10;
    } else {
      // Fallback simple table
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos, 170, 10, 'F');
      doc.text('Description', 25, yPos + 7);
      doc.text('Qty', 120, yPos + 7);
      doc.text('Unit Price', 140, yPos + 7);
      doc.text('Total', 170, yPos + 7);
      yPos += 15;
      
      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item, index) => {
          const lineTotal = parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString());
          doc.text(item.description || `Product ${index + 1}`, 25, yPos);
          doc.text(item.quantity.toString(), 120, yPos);
          const cur2 = (invoiceData.invoice as any).currency || 'BHD';
          doc.text(formatCurrency(parseFloat(item.unitPrice.toString()), cur2), 140, yPos);
          doc.text(formatCurrency(lineTotal, cur2), 170, yPos);
          yPos += 10;
        });
      }
      yPos += 20;
    }
    
    // Totals Section
    const totalsStartY = yPos;
    doc.setFontSize(11);
    
    doc.text('Subtotal:', 130, yPos);
  doc.text(formatCurrency(parseFloat((invoiceData.invoice as any).subtotal || 0), (invoiceData.invoice as any).currency || 'BHD'), 170, yPos);
    yPos += 8;
    
  if (parseFloat((invoiceData.invoice as any).discountAmount || 0) > 0) {
      doc.text('Discount:', 130, yPos);
  doc.text(`-${formatCurrency(parseFloat((invoiceData.invoice as any).discountAmount || 0), (invoiceData.invoice as any).currency || 'BHD')}`, 170, yPos);
      yPos += 8;
    }
    
  doc.text('Tax:', 130, yPos);
  doc.text(formatCurrency(parseFloat((invoiceData.invoice as any).taxAmount || 0), (invoiceData.invoice as any).currency || 'BHD'), 170, yPos);
    yPos += 8;
    
    // Total with emphasis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
  doc.text('Total Amount:', 130, yPos);
  doc.text(formatCurrency(parseFloat((invoiceData.invoice as any).totalAmount || 0), (invoiceData.invoice as any).currency || 'BHD'), 170, yPos);
    
    // Banking Information
    yPos += 20;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Banking Information', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    // Banking info removed in deprecated file
    
    // Terms and Conditions
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Terms & Conditions:', 20, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    // Terms removed in deprecated file
    
    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business! | This is a computer-generated invoice.', 20, footerY);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY + 4);
    
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error creating enhanced PDF:', error);
    // Fallback to simple PDF
    return createSimpleTestInvoicePDF(invoiceData);
  }
}

/**
 * Main function to generate invoice PDF - tries enhanced version first, falls back to simple
 */
export function generateInvoicePDF(invoiceData: EnhancedInvoicePDFData): Buffer {
  try {
    return createEnhancedInvoicePDF(invoiceData);
  } catch (error) {
    console.warn('Enhanced PDF generation failed, falling back to simple PDF:', error);
    return createSimpleTestInvoicePDF(invoiceData);
  }
}

// Legacy function for quotations (keeping existing functionality)
export function generateQuotationPDF(quotation: Quotation, customer: Customer, items: (QuotationItem & { item?: Item })[]): Buffer {
  const doc = new (jsPDF as any)('p','mm','a4');
  doc.setFontSize(14).text('QUOTATION (Legacy Service)',20,20);
  doc.setFontSize(8).text('Refer to unified pdf-utils for current implementation',20,26);
  return Buffer.from(doc.output('arraybuffer'));
}