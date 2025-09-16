#!/usr/bin/env node
// Simple test to generate enhanced quotation PDF
import { generateQuotationPdf } from './server/pdf/pdf-utils.ts';
import fs from 'fs';

// Mock minimal quotation/customer/items
const quotation = {
  id: 'q1', quoteNumber: 'QST/2025/0001', quotationNumber: 'QST/2025/0001', quoteDate: new Date().toISOString(),
  subtotal: '100.00', discountPercentage: '5', discountAmount: '5.00', taxAmount: '5.00', totalAmount: '100.00',
  notes: 'Please make payment in the name of Golden Style W.L.L.', terms: '30 Days', validUntil: new Date(Date.now()+15*86400000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
};
const customer = { id: 'c1', name: 'DEKYTE PLUS DIVISION SAAR', address: 'Building, Road , Town , Block ,', email: 'info@example.com', phone: '+973 39997777' };
const items = [
  { id: 'i1', quotationId: 'q1', description: 'INTRUDER 261865R3 SP311 BLACK', quantity: 10, unitPrice: '10.000', lineTotal: '100.00' }
];

const pdf = generateQuotationPdf({ quotation, items, customer, mode: 'enhanced' });
fs.writeFileSync('test_quotation_enhanced.pdf', pdf.buffer);
console.log('Generated test_quotation_enhanced.pdf size', pdf.byteLength/1024,'KB');
