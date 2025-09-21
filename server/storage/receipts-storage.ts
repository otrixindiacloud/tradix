
import { db } from "../db";
import { goodsReceiptHeaders, insertGoodsReceiptHeaderSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { BaseStorage } from "./base-storage";
import { randomUUID } from "crypto";

export class ReceiptsStorage extends BaseStorage {
  async getAllReceipts() {
    // Fetch all receipts from goodsReceiptHeaders table
    return await db.select().from(goodsReceiptHeaders);
  }

  async createReceipt(data: any) {
    // Validate and insert new receipt into goodsReceiptHeaders
    const base: any = { ...data };
    if (!base.receiptNumber) base.receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    if (!base.id) base.id = randomUUID();
    if (!base.status) base.status = "Pending";
    if (!base.receiptDate) base.receiptDate = new Date().toISOString().slice(0,10);
    // Parse without id (schema omits id)
    const parseInput = { ...base };
    delete parseInput.id;
    let toInsert: any;
    try {
      toInsert = insertGoodsReceiptHeaderSchema.parse(parseInput);
    } catch (zerr) {
      throw zerr;
    }
    const projected = {
      id: base.id,
      receiptNumber: toInsert.receiptNumber,
      supplierLpoId: toInsert.supplierLpoId,
      supplierId: toInsert.supplierId,
      receiptDate: toInsert.receiptDate,
      expectedDeliveryDate: toInsert.expectedDeliveryDate,
      actualDeliveryDate: toInsert.actualDeliveryDate,
      receivedBy: toInsert.receivedBy,
      status: toInsert.status,
      notes: toInsert.notes,
      totalItems: toInsert.totalItems,
      totalQuantityExpected: toInsert.totalQuantityExpected,
      totalQuantityReceived: toInsert.totalQuantityReceived,
      discrepancyFlag: toInsert.discrepancyFlag
    };
    const [inserted] = await db.insert(goodsReceiptHeaders).values(projected).returning();
    return inserted;
  }

  async getReceiptById(id: string) {
    // Fetch a single receipt by ID
    const [receipt] = await db.select().from(goodsReceiptHeaders).where(eq(goodsReceiptHeaders.id, id));
    return receipt || null;
  }

  async updateReceipt(id: string, data: any) {
    // Update receipt by ID
    const parseInput = { ...data };
    delete parseInput.id;
    let toUpdate: any;
    try {
      toUpdate = insertGoodsReceiptHeaderSchema.partial().parse(parseInput);
    } catch (zerr) {
      throw zerr;
    }
    const [updated] = await db.update(goodsReceiptHeaders).set(toUpdate).where(eq(goodsReceiptHeaders.id, id)).returning();
    return updated || null;
  }

  async deleteReceipt(id: string) {
    // Delete receipt by ID
    await db.delete(goodsReceiptHeaders).where(eq(goodsReceiptHeaders.id, id));
    return { success: true };
  }
}
