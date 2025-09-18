#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function loadPdfUtil() {
  try {
    const mod = await import(pathToFileURL(path.resolve('./server/pdf/pdf-utils.ts')).href);
    return mod;
  } catch (e) {
    console.error('Failed to import pdf-utils.ts directly. You may need a build step. Error:', e.message);
    process.exit(1);
  }
}

const { generateInvoicePdf } = await loadPdfUtil();

const invoice = {
  id: 'inv1',
  invoiceNumber: 'INV/2025/0001',
  invoiceDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'Draft',
  invoiceType: 'Final',
  currency: 'BHD',
  subtotal: '100.00',
  discountPercentage: '5',
  discountAmount: '5.00',
  taxRate: '10',
  taxAmount: '9.50',
  totalAmount: '104.50',
  paidAmount: '0.00',
  outstandingAmount: '104.50',
  notes: 'Thank you for your business.'
};
const customer = { id: 'c1', name: 'Test Customer W.L.L', address: 'Road 123, Block 456, Manama', email: 'accounts@test.com', phone: '+973 3000 0000' };
const items = [
  { id: 'it1', invoiceId: 'inv1', description: 'Sample Product A', quantity: 2, unitPrice: '25.000', discountPercentage: '0', taxRate: '10', totalPrice: '55.00', supplierCode: 'SUP-A', barcode: '1234567890123' },
  { id: 'it2', invoiceId: 'inv1', description: 'Sample Product B', quantity: 1, unitPrice: '50.000', discountPercentage: '5', taxRate: '10', totalPrice: '49.50', supplierCode: 'SUP-B', barcode: '9876543210987' }
];

const pdf = generateInvoicePdf({ invoice, items, customer, mode: 'enhanced' });
fs.writeFileSync('test_invoice_enhanced.pdf', pdf.buffer);
console.log('Generated test_invoice_enhanced.pdf size', (pdf.byteLength/1024).toFixed(2),'KB');
