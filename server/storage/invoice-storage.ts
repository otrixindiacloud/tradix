import { db } from '../db';
import { invoices, invoiceItems, InsertInvoice, InsertInvoiceItem, salesOrders, deliveryItems, deliveries, salesOrderItems } from '@shared/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { BaseStorage } from './base';

// Helper to coerce numeric strings -> number safely
function num(val: any): number { if (val === null || val === undefined) return 0; const n = typeof val === 'number' ? val : parseFloat(val); return isNaN(n) ? 0 : n; }

export class InvoiceStorage extends BaseStorage {
  // Basic list with lightweight filtering & pagination
  async getInvoices(filters?: { status?: string; customerId?: string; type?: string; salesOrderId?: string; dateFrom?: string; dateTo?: string; search?: string; currency?: string; limit?: number; offset?: number; }) {
    const limit = filters?.limit ?? 50; const offset = filters?.offset ?? 0;
    let q: any = db.select().from(invoices);
    const conds: any[] = [];
    if (filters) {
      if (filters.status) conds.push(eq(invoices.status, filters.status as any));
      if (filters.type) conds.push(eq(invoices.invoiceType, filters.type as any));
      if (filters.customerId) conds.push(eq(invoices.customerId, filters.customerId));
      if (filters.salesOrderId) conds.push(eq(invoices.salesOrderId, filters.salesOrderId));
      if (filters.currency) conds.push(eq(invoices.currency, filters.currency));
      if (filters.dateFrom) conds.push(sql`${invoices.invoiceDate} >= ${filters.dateFrom}`);
      if (filters.dateTo) conds.push(sql`${invoices.invoiceDate} <= ${filters.dateTo}`);
      if (filters.search) conds.push(sql`${invoices.invoiceNumber} ILIKE ${`%${filters.search}%`}`);
      if (conds.length) q = (q as any).where(and(...conds));
    }
    return (q as any).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset);
  }

  async getInvoice(id: string) {
    const r = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1); return r[0];
  }

  async getInvoiceByNumber(invoiceNumber: string) {
    const r = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1); return r[0];
  }

  async createInvoice(data: InsertInvoice) {
    const invoiceNumber = data.invoiceNumber || this.generateNumber('INV');
    const now = new Date();
    const record: any = { ...data, invoiceNumber, createdAt: now, updatedAt: now };
    try {
      const inserted = await db.insert(invoices).values(record).returning();
      return inserted[0];
    } catch (err: any) {
      // If FK constraint on created_by fails (system test user not in users table), retry with null
      if (err?.code === '23503' && String(err?.detail || '').includes('created_by')) {
        const fallback = { ...record, createdBy: null };
        const inserted = await db.insert(invoices).values(fallback).returning();
        return inserted[0];
      }
      throw err;
    }
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>) {
    const updated = await db.update(invoices).set({ ...data, updatedAt: new Date() }).where(eq(invoices.id, id)).returning();
    return updated[0];
  }

  async deleteInvoice(id: string) {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // Generation from delivery: derive customer, sales order, sums from delivered items
  async generateInvoiceFromDelivery(deliveryId: string, invoiceType: string = 'Final', userId?: string) {
    const deliveryRecArr = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
    const deliveryRec: any = deliveryRecArr[0];
    if (!deliveryRec) throw new Error('Delivery not found');
    const soId = deliveryRec.salesOrderId;
    const soArr = soId ? await db.select().from(salesOrders).where(eq(salesOrders.id, soId)).limit(1) : [];
    const so: any = soArr[0];
    const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, deliveryId));
    // Attempt to get pricing from related sales order items if present
    let subtotal = 0;
    const invoiceItemsToInsert: any[] = [];
    let lineNumber = 1;
    for (const di of items as any[]) {
      const soItemArr = di.salesOrderItemId ? await db.select().from(salesOrderItems).where(eq(salesOrderItems.id, di.salesOrderItemId)).limit(1) : [];
      const soItem: any = soItemArr[0];
      const qty = num(di.deliveredQuantity || di.pickedQuantity || di.orderedQuantity || soItem?.quantity || 0);
      const unitPrice = num(soItem?.unitPrice || di.unitPrice || 0);
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      const barcode = di.barcode || soItem?.barcode || `AUTO-${lineNumber}`;
      const supplierCode = di.supplierCode || soItem?.supplierCode || 'AUTO-SUP';
      invoiceItemsToInsert.push({
        invoiceId: 'TEMP',
        deliveryItemId: di.id,
        salesOrderItemId: di.salesOrderItemId || soItem?.id || null,
        itemId: soItem?.itemId || di.itemId || null,
        barcode,
        supplierCode,
        description: soItem?.description || di.description || 'Item',
        lineNumber,
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: lineTotal,
        discountPercentage: '0',
        discountAmount: 0,
        taxRate: '0',
        taxAmount: 0,
        unitPriceBase: unitPrice,
        totalPriceBase: lineTotal,
        discountAmountBase: 0,
        taxAmountBase: 0,
        returnQuantity: 0,
        notes: null
      });
      lineNumber++;
    }
    const invoiceNumber = this.generateNumber('INV');
    const invoiceInsert: any = {
      invoiceNumber,
      invoiceType,
      salesOrderId: soId,
      deliveryId,
      customerId: so?.customerId || deliveryRec.customerId,
      status: 'Draft',
      currency: so?.currency || 'BHD',
      exchangeRate: so?.exchangeRate || '1.0000',
      baseCurrency: so?.baseCurrency || 'BHD',
      subtotal: subtotal,
      taxRate: '0',
      taxAmount: 0,
      discountPercentage: '0',
      discountAmount: 0,
      totalAmount: subtotal,
      paidAmount: 0,
      outstandingAmount: subtotal,
      subtotalBase: subtotal,
      taxAmountBase: 0,
      discountAmountBase: 0,
      totalAmountBase: subtotal,
      autoGenerated: true,
      generatedFromDeliveryId: deliveryId,
      createdBy: userId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    let invoice: any;
    try {
      const inserted = await db.insert(invoices).values(invoiceInsert).returning();
      invoice = inserted[0];
    } catch (err: any) {
      if (err?.code === '23503' && String(err?.detail || '').includes('created_by')) {
        const inserted = await db.insert(invoices).values({ ...invoiceInsert, createdBy: null }).returning();
        invoice = inserted[0];
      } else {
        throw err;
      }
    }
    // Insert items
    for (const it of invoiceItemsToInsert) it.invoiceId = invoice.id;
    if (invoiceItemsToInsert.length) await db.insert(invoiceItems).values(invoiceItemsToInsert as any).returning();
    return invoice;
  }

  async generateProformaInvoice(salesOrderId: string, userId?: string) {
    // Get sales order to extract customer ID
    const salesOrder = await db.select().from(salesOrders).where(eq(salesOrders.id, salesOrderId)).limit(1);
    if (!salesOrder.length) {
      throw new Error('Sales order not found');
    }

    // Create proforma invoice referencing SO with proper customer ID
    const invoiceNumber = this.generateNumber('PFINV');
    const record: any = {
      invoiceNumber,
      invoiceType: 'Proforma',
      salesOrderId,
      customerId: salesOrder[0].customerId,
      status: 'Draft',
      currency: (salesOrder[0] as any).currency || 'BHD',
      exchangeRate: (salesOrder[0] as any).exchangeRate || '1.0000',
      baseCurrency: (salesOrder[0] as any).baseCurrency || 'BHD',
      subtotal: 0,
      taxRate: '0',
      taxAmount: 0,
      discountPercentage: '0',
      discountAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      subtotalBase: 0,
      taxAmountBase: 0,
      discountAmountBase: 0,
      totalAmountBase: 0,
      autoGenerated: true,
      createdBy: userId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    try {
      const inserted = await db.insert(invoices).values(record).returning();
      return inserted[0];
    } catch (err: any) {
      if (err?.code === '23503' && String(err?.detail || '').includes('created_by')) {
        const inserted = await db.insert(invoices).values({ ...record, createdBy: null }).returning();
        return inserted[0];
      }
      throw err;
    }
  }

  async sendInvoice(invoiceId: string, email?: string, userId?: string) {
    // Mark as sent; in a real implementation, trigger email sending here using provided email or customer email on record
    const updated = await this.updateInvoice(invoiceId, { status: 'Sent' } as any);
    return {
      message: 'Invoice marked as sent',
      invoice: updated,
      email: email || null,
    };
  }

  async markInvoicePaid(invoiceId: string, paidAmount: number, paymentMethod?: string, paymentReference?: string, userId?: string) {
    const inv = await this.getInvoice(invoiceId);
    if (!inv) throw new Error('Invoice not found');
    const newPaid = num(inv.paidAmount) + paidAmount;
    const outstanding = Math.max(0, num(inv.totalAmount) - newPaid);
    const status = outstanding === 0 ? 'Paid' : inv.status;
    return this.updateInvoice(invoiceId, { paidAmount: newPaid as any, outstandingAmount: outstanding as any, status } as any);
  }

  // Items
  async getInvoiceItems(invoiceId: string) { return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)); }
  async getInvoiceItem(id: string) { const r = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id)).limit(1); return r[0]; }
  async createInvoiceItem(item: InsertInvoiceItem) { const r = await db.insert(invoiceItems).values(item as any).returning(); return r[0]; }
  async updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>) { const r = await db.update(invoiceItems).set({ ...(item as any), updatedAt: new Date() }).where(eq(invoiceItems.id, id)).returning(); return r[0]; }
  async deleteInvoiceItem(id: string) { await db.delete(invoiceItems).where(eq(invoiceItems.id, id)); }
  async bulkCreateInvoiceItems(itemsArr: InsertInvoiceItem[]) { if (!itemsArr.length) return []; return await db.insert(invoiceItems).values(itemsArr as any).returning(); }

  // Currency helpers (VERY simplified placeholder FX logic)
  async getExchangeRate(fromCurrency: string, toCurrency: string) { if (fromCurrency === toCurrency) return 1; return 1; }
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string, exchangeRate?: number) { const rate = exchangeRate || await this.getExchangeRate(fromCurrency, toCurrency); return amount * rate; }
  async updateInvoiceCurrency(invoiceId: string, newCurrency: string, exchangeRate: number, userId: string) {
    const inv = await this.getInvoice(invoiceId); if (!inv) throw new Error('Invoice not found');
    const subtotalBase = await this.convertCurrency(num(inv.subtotal), inv.currency as any, newCurrency, exchangeRate);
    const taxAmountBase = await this.convertCurrency(num(inv.taxAmount), inv.currency as any, newCurrency, exchangeRate);
    const discountAmountBase = await this.convertCurrency(num(inv.discountAmount), inv.currency as any, newCurrency, exchangeRate);
    const totalAmountBase = await this.convertCurrency(num(inv.totalAmount), inv.currency as any, newCurrency, exchangeRate);
    return this.updateInvoice(invoiceId, { currency: newCurrency as any, exchangeRate: exchangeRate as any, subtotalBase: subtotalBase as any, taxAmountBase: taxAmountBase as any, discountAmountBase: discountAmountBase as any, totalAmountBase: totalAmountBase as any } as any);
  }
}