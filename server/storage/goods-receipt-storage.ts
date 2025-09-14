import { IGoodsReceiptStorage } from "./interfaces";
import { db } from "../db";
import { insertGoodsReceiptHeaderSchema, insertGoodsReceiptItemSchema, goodsReceiptHeaders, goodsReceiptItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export class GoodsReceiptStorage implements IGoodsReceiptStorage {
  private generateReceiptNumber() {
    return `GRN-${new Date().toISOString().slice(0,10)}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  }

  async createGoodsReceiptHeader(receipt: any) {
    try {
      // Assume upstream route already validated with insertGoodsReceiptHeaderSchema, so avoid double-parse issues
      const base: any = { ...receipt };
      if (!base.receiptNumber) base.receiptNumber = this.generateReceiptNumber();
      if (!base.status) base.status = 'Draft';
      if (!base.receiptDate) base.receiptDate = new Date().toISOString().slice(0,10);
      // Minimal re-validation but tolerant: catch and log instead of throwing mysterious undefined later
      let toInsert: any;
      try {
        toInsert = insertGoodsReceiptHeaderSchema.parse(base);
      } catch (zerr) {
        console.error('[GoodsReceiptStorage.createGoodsReceiptHeader] Validation failed before insert', zerr, { base });
        throw zerr;
      }
      // Explicitly project only known columns to prevent accidental prototype / undefined issues
      const projected = {
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
      const inserted = await db.insert(goodsReceiptHeaders).values(projected as any).returning();
      return inserted[0];
    } catch (err) {
      console.error('[GoodsReceiptStorage.createGoodsReceiptHeader] Error', err, { input: receipt });
      throw err;
    }
  }

  async createGoodsReceiptItem(item: any) {
    try {
      const base = { ...item };
      if (!base.itemDescription) base.itemDescription = base.description || 'Item';
      if (!base.quantityExpected && base.quantityReceived) base.quantityExpected = base.quantityReceived;
      const parsed = insertGoodsReceiptItemSchema.parse(base);
      const inserted = await db.insert(goodsReceiptItems).values(parsed as any).returning();
      return inserted[0];
    } catch (err) {
      console.error('[GoodsReceiptStorage.createGoodsReceiptItem] Error', err, { input: item });
      throw err;
    }
  }

  async getGoodsReceiptHeaders(filters?: any) {
    let q: any = db.select().from(goodsReceiptHeaders);
    // Minimal filtering (extend as needed)
    return q;
  }

  async getGoodsReceiptHeader(id: string) {
    const r = await db.select().from(goodsReceiptHeaders).where(eq(goodsReceiptHeaders.id, id)).limit(1); return r[0];
  }

  async getGoodsReceiptItems(headerId: string) {
    return db.select().from(goodsReceiptItems).where(eq(goodsReceiptItems.receiptHeaderId, headerId));
  }

  async createGoodsReceiptItemsBulk(itemsArr: any[]) {
    if (!itemsArr.length) return [];
    const prepared = itemsArr.map(it => {
      const base = { ...it };
      if (!base.itemDescription) base.itemDescription = base.description || 'Item';
      if (!base.quantityExpected && base.quantityReceived) base.quantityExpected = base.quantityReceived;
      return insertGoodsReceiptItemSchema.parse(base);
    });
    return db.insert(goodsReceiptItems).values(prepared as any).returning();
  }
}
