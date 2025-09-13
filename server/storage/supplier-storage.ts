import { suppliers, auditLogs, type Supplier, type InsertSupplier } from "@shared/schema";
import { db } from "../db.js";
import { eq, desc } from "drizzle-orm";
import { BaseStorage } from './base.js';
import { ISupplierStorage } from './interfaces.js';

export class SupplierStorage extends BaseStorage implements ISupplierStorage {
  async getSuppliers(): Promise<Supplier[]> {
    return db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
      .orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(supplierData).returning();
    // TODO: Re-enable audit logging once audit table is properly set up
    // await this.logAuditEvent("supplier", supplier.id, "create", undefined, undefined, supplier);
    return supplier;
  }

  async updateSupplier(id: string, supplierData: Partial<InsertSupplier>): Promise<Supplier> {
    const oldSupplier = await this.getSupplier(id);
    const [supplier] = await db.update(suppliers).set({
      ...supplierData,
      updatedAt: new Date()
    }).where(eq(suppliers.id, id)).returning();
    
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    
    // TODO: Re-enable audit logging once audit table is properly set up
    // await this.logAuditEvent("supplier", supplier.id, "update", undefined, oldSupplier, supplier);
    return supplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    const oldSupplier = await this.getSupplier(id);
    await db.update(suppliers).set({
      isActive: false,
      updatedAt: new Date()
    }).where(eq(suppliers.id, id));
    
    // TODO: Re-enable audit logging once audit table is properly set up
    // await this.logAuditEvent("supplier", id, "delete", undefined, oldSupplier, { isActive: false });
  }

  async logAuditEvent(
    entityType: string,
    entityId: string,
    action: string,
    userId?: string,
    oldData?: any,
    newData?: any
  ): Promise<void> {
    await db.insert(auditLogs).values({
      entityType,
      entityId,
      action,
      oldData,
      newData,
      userId,
    });
  }
}
