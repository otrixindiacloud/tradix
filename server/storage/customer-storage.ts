import { customers, auditLogs, type Customer, type InsertCustomer } from "@shared/schema";
import { db } from "../db.js";
import { eq, desc } from "drizzle-orm";
import { BaseStorage } from './base.js';
import { ICustomerStorage } from './interfaces.js';

export class CustomerStorage extends BaseStorage implements ICustomerStorage {
  async getCustomers(limit = 50, offset = 0): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    await this.logAuditEvent("customer", customer.id, "create", undefined, undefined, customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const oldCustomer = await this.getCustomer(id);
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    await this.logAuditEvent("customer", id, "update", undefined, oldCustomer, customer);
    return customer;
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
