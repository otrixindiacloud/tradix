import { inventoryItems, suppliers, type InventoryItem, type Supplier, type InsertInventoryItem, type InventoryVariant, type InsertInventoryVariant, type InventoryLevel, type InsertInventoryLevel, type StockMovement, type InsertStockMovement } from "@shared/schema";
import { db } from "../db.js";
import { eq, desc, and, or, like } from "drizzle-orm";
import { BaseStorage } from './base.js';
import { IInventoryStorage } from './interfaces.js';

export interface InventoryItemWithSupplier extends InventoryItem {
  supplier?: Supplier;
  supplierName?: string;
}

export class InventoryStorage extends BaseStorage implements IInventoryStorage {
  async getInventoryItems(filters?: {
    search?: string;
    supplierId?: string;
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<InventoryItemWithSupplier[]> {
    let query = db
      .select({
        ...inventoryItems,
        supplierName: suppliers.name,
        supplier: suppliers
      })
      .from(inventoryItems)
      .leftJoin(suppliers, eq(inventoryItems.supplierId, suppliers.id));
    
    const conditions = [];
    if (filters?.search) {
      conditions.push(
        or(
          like(inventoryItems.supplierCode, `%${filters.search}%`),
          like(inventoryItems.description, `%${filters.search}%`),
          like(inventoryItems.barcode, `%${filters.search}%`),
          like(suppliers.name, `%${filters.search}%`)
        )
      );
    }
    if (filters?.supplierId) {
      conditions.push(eq(inventoryItems.supplierId, filters.supplierId));
    }
    if (filters?.category) {
      conditions.push(eq(inventoryItems.category, filters.category));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(inventoryItems.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    const results = await query.orderBy(inventoryItems.description);
    
    // Transform results to include supplier information
    return results.map(row => ({
      ...row,
      supplierName: row.supplierName || undefined,
      supplier: row.supplier || undefined
    }));
  }

  async getInventoryItem(id: string): Promise<InventoryItemWithSupplier | undefined> {
    const [result] = await db
      .select({
        ...inventoryItems,
        supplierName: suppliers.name,
        supplier: suppliers
      })
      .from(inventoryItems)
      .leftJoin(suppliers, eq(inventoryItems.supplierId, suppliers.id))
      .where(eq(inventoryItems.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result,
      supplierName: result.supplierName || undefined,
      supplier: result.supplier || undefined
    };
  }

  async getInventoryItemBySupplierCode(supplierCode: string): Promise<InventoryItemWithSupplier | undefined> {
    const [result] = await db
      .select({
        ...inventoryItems,
        supplierName: suppliers.name,
        supplier: suppliers
      })
      .from(inventoryItems)
      .leftJoin(suppliers, eq(inventoryItems.supplierId, suppliers.id))
      .where(eq(inventoryItems.supplierCode, supplierCode));
    
    if (!result) return undefined;
    
    return {
      ...result,
      supplierName: result.supplierName || undefined,
      supplier: result.supplier || undefined
    };
  }

  async getInventoryItemByBarcode(barcode: string): Promise<InventoryItemWithSupplier | undefined> {
    const [result] = await db
      .select({
        ...inventoryItems,
        supplierName: suppliers.name,
        supplier: suppliers
      })
      .from(inventoryItems)
      .leftJoin(suppliers, eq(inventoryItems.supplierId, suppliers.id))
      .where(eq(inventoryItems.barcode, barcode));
    
    if (!result) return undefined;
    
    return {
      ...result,
      supplierName: result.supplierName || undefined,
      supplier: result.supplier || undefined
    };
  }

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(itemData).returning();
    await this.logAuditEvent("inventory_item", item.id, "create", undefined, undefined, item);
    return item;
  }

  async updateInventoryItem(id: string, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const oldItem = await this.getInventoryItem(id);
    const [item] = await db
      .update(inventoryItems)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    await this.logAuditEvent("inventory_item", item.id, "update", undefined, oldItem, item);
    return item;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const oldItem = await this.getInventoryItem(id);
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    await this.logAuditEvent("inventory_item", id, "delete", undefined, oldItem, undefined);
  }

  async bulkCreateInventoryItems(items: InsertInventoryItem[]): Promise<InventoryItem[]> {
    const createdItems = await db.insert(inventoryItems).values(items).returning();
    for (const item of createdItems) {
      await this.logAuditEvent("inventory_item", item.id, "create", undefined, undefined, item);
    }
    return createdItems;
  }

  // Stub implementations for the remaining interface methods
  async getItemVariants(itemId: string): Promise<InventoryVariant[]> {
    // TODO: Implement when needed
    return [];
  }

  async getItemVariant(id: string): Promise<InventoryVariant | undefined> {
    // TODO: Implement when needed
    return undefined;
  }

  async createItemVariant(variant: InsertInventoryVariant): Promise<InventoryVariant> {
    // TODO: Implement when needed
    throw new Error("Method not implemented");
  }

  async updateItemVariant(id: string, variant: Partial<InsertInventoryVariant>): Promise<InventoryVariant> {
    // TODO: Implement when needed
    throw new Error("Method not implemented");
  }

  async deleteItemVariant(id: string): Promise<void> {
    // TODO: Implement when needed
  }

  async getInventoryLevels(filters?: any): Promise<any[]> {
    // TODO: Implement when needed
    return [];
  }

  async getInventoryLevel(id: string): Promise<any> {
    // TODO: Implement when needed
    return undefined;
  }

  async getInventoryLevelByItem(itemId: string, location?: string): Promise<any> {
    // TODO: Implement when needed
    return undefined;
  }

  async createInventoryLevel(inventory: any): Promise<any> {
    // TODO: Implement when needed
    throw new Error("Method not implemented");
  }

  async updateInventoryLevel(id: string, inventory: any): Promise<any> {
    // TODO: Implement when needed
    throw new Error("Method not implemented");
  }

  async deleteInventoryLevel(id: string): Promise<void> {
    // TODO: Implement when needed
  }

  async adjustInventoryQuantity(itemId: string, quantityChange: number, location?: string, reason?: string): Promise<any> {
    // TODO: Implement when needed
    throw new Error("Method not implemented");
  }

  async getStockMovements(filters?: any): Promise<any[]> {
    // TODO: Implement when needed
    return [];
  }

  async getStockMovement(id: string): Promise<any> {
    // TODO: Implement when needed
    return undefined;
  }

  async createStockMovement(movement: any): Promise<any> {
    // TODO: Implement when needed
    throw new Error("Method not implemented");
  }

  async getItemStockHistory(itemId: string, limit?: number): Promise<any[]> {
    // TODO: Implement when needed
    return [];
  }
}