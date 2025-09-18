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
  id: 'invP1',
  invoiceNumber: 'PINV/2025/0001',
  invoiceDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'Draft',
  invoiceType: 'Proforma',
  currency: 'BHD',
  subtotal: '200.00',
  discountPercentage: '0',
  discountAmount: '0.00',
  taxRate: '10',
  taxAmount: '20.00',
  totalAmount: '220.00',
  paidAmount: '0.00',
  outstandingAmount: '220.00',
  notes: 'Proforma for approval.'
};
const customer = { id: 'c1', name: 'Proforma Customer', address: 'Road 1, Town', email: 'proforma@test.com', phone: '+973 3111 1111' };
const items = [
  { id: 'it1', invoiceId: 'invP1', description: 'Proforma Item A', quantity: 4, unitPrice: '25.000', discountPercentage: '0', taxRate: '10', totalPrice: '110.00' },
  { id: 'it2', invoiceId: 'invP1', description: 'Proforma Item B', quantity: 2, unitPrice: '45.000', discountPercentage: '0', taxRate: '10', totalPrice: '99.00' }
];

const pdf = generateInvoicePdf({ invoice, items, customer, mode: 'enhanced' });
fs.writeFileSync('test_proforma_enhanced.pdf', pdf.buffer);
console.log('Generated test_proforma_enhanced.pdf size', (pdf.byteLength/1024).toFixed(2),'KB');
