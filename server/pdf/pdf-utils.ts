import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceItem, Item, Customer, Quotation, QuotationItem } from '@shared/schema';

// Core reusable interfaces
export interface PdfGenerateResult {
  buffer: Buffer;
  byteLength: number;
  fileName: string;
  contentType: string; // always application/pdf for now
}

export interface InvoicePdfContext {
  invoice: Invoice;
  items: (InvoiceItem & { item?: Item })[];
  customer: Customer;
  related?: { salesOrder?: any; delivery?: any };
  mode?: 'enhanced' | 'simple';
}

export interface QuotationPdfContext {
  quotation: Quotation;
  items: (QuotationItem & { item?: Item })[];
  customer: Customer;
  mode?: 'simple'; // only simple for now
}

// Currency formatting centralised
export function fmtCurrency(amount: number | string | null | undefined, currency = 'USD') {
  const n = amount == null ? 0 : (typeof amount === 'string' ? parseFloat(amount) : amount);
  if (Number.isNaN(n)) return `${currency} 0.00`;
  return `${currency} ${n.toFixed(2)}`;
}

export function fmtDate(date: string | Date | null | undefined) {
  if (!date) return '';
  try { return new Date(date).toLocaleDateString('en-GB'); } catch { return ''; }
}

function baseDoc(): jsPDF { return new jsPDF(); }

// Enhanced invoice PDF (condensed version referencing existing design)
export function buildEnhancedInvoicePdf(ctx: InvoicePdfContext): Buffer {
  const { invoice, items, customer } = ctx;
  const doc = baseDoc();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(18).setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Golden Tag WLL', 20, 20);
  doc.setFontSize(22).setTextColor(212, 175, 55).text(invoice.invoiceType === 'Proforma' ? 'PROFORMA INVOICE' : 'INVOICE', pageWidth - 20, 20, { align: 'right' });

  // Invoice meta
  doc.setFontSize(10).setTextColor(0,0,0).setFont('helvetica','normal');
  const metaY = 32;
  const metaPairs: [string,string][] = [
    ['Invoice #', invoice.invoiceNumber],
    ['Date', fmtDate((invoice as any).invoiceDate || invoice.createdAt)],
    ['Due', fmtDate((invoice as any).dueDate) || 'Upon Receipt'],
    ['Currency', (invoice as any).currency || 'USD'],
    ['Status', (invoice as any).status || '']
  ];
  metaPairs.forEach((p,i)=>{
    doc.text(p[0]+':', pageWidth-80, metaY + i*6);
    doc.setFont('helvetica','bold');
    doc.text(p[1] || '', pageWidth-50, metaY + i*6);
    doc.setFont('helvetica','normal');
  });

  // Customer panel
  const custY = 32;
  doc.setFont('helvetica','bold').setTextColor(212,175,55).text('BILL TO:',20,custY);
  doc.setTextColor(0,0,0).setFontSize(11).text((customer as any).customerName || customer.name || 'Customer',20,custY+8);
  doc.setFontSize(9).setFont('helvetica','normal');
  const custLines: string[] = [customer.email, customer.phone, customer.address, customer.taxId && `Tax: ${customer.taxId}`, `Type: ${customer.customerType}`, `Class: ${customer.classification}`].filter(Boolean) as string[];
  custLines.forEach((line,idx)=>{ doc.text(doc.splitTextToSize(line, 80),20,custY+16+idx*5); });

  // Items table
  const tableStartY = 90;
  const currency = invoice.currency || 'USD';
  const rows = items.map((it,i)=>{
    const specs: string[] = [];
    if (it.supplierCode) specs.push(`Sup:${it.supplierCode}`);
    if (it.barcode) specs.push(`BC:${it.barcode}`);
    if (it.item?.category) specs.push(it.item.category);
    return [
      (i+1).toString(),
      (it.description||'') + (specs.length? ('\n'+specs.join(' | ')) : ''),
      it.quantity.toString(),
      fmtCurrency(it.unitPrice, currency),
      it.discountPercentage? `${it.discountPercentage}%`:'0%',
      it.taxRate? `${it.taxRate}%`:'0%',
      fmtCurrency(it.totalPrice, currency)
    ];
  });
  autoTable(doc, {
    startY: tableStartY,
    head: [['#','Description & Specs','Qty','Unit','Disc','Tax','Total']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [212,175,55], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0:{cellWidth:8},1:{cellWidth:78},2:{cellWidth:12,halign:'center'},3:{cellWidth:20,halign:'right'},4:{cellWidth:12,halign:'center'},5:{cellWidth:12,halign:'center'},6:{cellWidth:25,halign:'right'} },
    alternateRowStyles: { fillColor: [250,250,250] }
  });
  const afterTableY = (doc as any).lastAutoTable?.finalY || tableStartY + 40;

  // Financial summary
  const summaryPairs: [string,string,boolean?][] = [
    ['Subtotal', fmtCurrency(invoice.subtotal, currency)],
    ['Discount', fmtCurrency(`-${invoice.discountAmount||0}`, currency)],
    ['Tax', fmtCurrency(invoice.taxAmount, currency)],
    ['Total', fmtCurrency(invoice.totalAmount, currency), true],
    ['Paid', fmtCurrency(invoice.paidAmount, currency)],
    ['Outstanding', fmtCurrency(invoice.outstandingAmount, currency)]
  ];
  let y = afterTableY + 10;
  summaryPairs.forEach(([label,val,em])=>{
    if (em) { doc.setFont('helvetica','bold'); } else { doc.setFont('helvetica','normal'); }
    doc.text(label+':', pageWidth-70, y);
    doc.text(val, pageWidth-20, y, { align: 'right' });
    if (em) doc.line(pageWidth-70, y+1, pageWidth-20, y+1);
    y += 6;
  });

  // Terms (minimal)
  y += 6;
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFont('helvetica','bold').setTextColor(212,175,55).text('TERMS',20,y); y+=6;
  doc.setFont('helvetica','normal').setTextColor(0,0,0).setFontSize(8);
  ['Payment within 30 days','Goods remain property until paid','Disputes within 7 days'].forEach(t=>{ if (y>pageHeight-20){doc.addPage(); y=20;} doc.text('\u2022 '+t,20,y); y+=4; });

  // Footer
  const footerY = pageHeight - 12;
  doc.setFontSize(7).setTextColor(100).text('Generated by GT ERP',20,footerY);
  doc.text(new Date().toLocaleDateString(), pageWidth-20, footerY, { align:'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

export function buildSimpleInvoicePdf(ctx: InvoicePdfContext): Buffer {
  const { invoice } = ctx;
  const doc = baseDoc();
  doc.setFontSize(16).setFont('helvetica','bold').text('INVOICE',20,20);
  doc.setFontSize(10).setFont('helvetica','normal').text(`Invoice #: ${invoice.invoiceNumber}`,20,30);
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateInvoicePdf(ctx: InvoicePdfContext): PdfGenerateResult {
  const buffer = (ctx.mode === 'simple' ? buildSimpleInvoicePdf(ctx) : buildEnhancedInvoicePdf(ctx));
  return { buffer, byteLength: buffer.length, fileName: `invoice-${ctx.invoice.invoiceNumber}.pdf`, contentType: 'application/pdf' };
}

export function generateQuotationPdf(ctx: QuotationPdfContext): PdfGenerateResult {
  const { quotation, items, customer } = ctx;
  const doc = baseDoc();
  doc.setFontSize(18).setFont('helvetica','bold').text('QUOTATION',20,20);
  doc.setFontSize(10).setFont('helvetica','normal');
  doc.text(`Quote #: ${(quotation as any).quotationNumber || quotation.quoteNumber}`,20,30);
  doc.text(`Date: ${fmtDate((quotation as any).quotationDate || quotation.createdAt)}`,20,36);
  doc.setFont('helvetica','bold').text('Customer:',20,48);
  doc.setFont('helvetica','normal').text((customer as any).customerName || customer.name || '',20,54);
  const rows = items.map((it,i)=>[
    (i+1).toString(),
    it.description || '',
    it.quantity.toString(),
    fmtCurrency(it.unitPrice, (quotation as any).currency || 'USD'),
    fmtCurrency(it.lineTotal, (quotation as any).currency || 'USD')
  ]);
  autoTable(doc, { startY: 70, head: [['#','Description','Qty','Unit','Total']], body: rows, styles:{fontSize:8}, headStyles:{fillColor:[212,175,55], textColor:255}});
  const buffer = Buffer.from(doc.output('arraybuffer'));
  return { buffer, byteLength: buffer.length, fileName: `quotation-${(quotation as any).quotationNumber || quotation.quoteNumber}.pdf`, contentType: 'application/pdf' };
}

export type { InvoicePdfContext as InvoicePdfOptions, QuotationPdfContext as QuotationPdfOptions };
