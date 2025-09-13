import { db } from "../db";
import { salesOrders, salesOrderItems, quotations, quotationItems } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ISalesOrderStorage } from "./interfaces";
import { BaseStorage } from "./base";

export class SalesOrderStorage extends BaseStorage implements ISalesOrderStorage {
  async getSalesOrders(limit = 50, offset = 0, filters?: {
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    pendingSupplierLpo?: boolean;
  }) {
    let query = db.select().from(salesOrders);

    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(salesOrders.status, filters.status as any));
      }
      
      if (filters.customerId) {
        conditions.push(eq(salesOrders.customerId, filters.customerId));
      }
      
      if (filters.dateFrom) {
        conditions.push(sql`${salesOrders.orderDate} >= ${filters.dateFrom}`);
      }
      
      if (filters.dateTo) {
        conditions.push(sql`${salesOrders.orderDate} <= ${filters.dateTo}`);
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${salesOrders.orderNumber} ILIKE ${`%${filters.search}%`} OR 
              ${salesOrders.customerName} ILIKE ${`%${filters.search}%`})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return query
      .orderBy(desc(salesOrders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getSalesOrder(id: string) {
    const result = await db.select().from(salesOrders).where(eq(salesOrders.id, id)).limit(1);
    return result[0];
  }

  async createSalesOrder(salesOrder: any) {
    const orderNumber = `SO-${new Date().getFullYear()}-${String(await this.getNextSequenceNumber()).padStart(3, '0')}`;
    
    const newSalesOrder = {
      ...salesOrder,
      id: nanoid(),
      orderNumber,
      orderDate: new Date(),
      status: 'Draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(salesOrders).values(newSalesOrder).returning();
    return result[0];
  }

  async updateSalesOrder(id: string, salesOrder: any) {
    const updatedSalesOrder = {
      ...salesOrder,
      updatedAt: new Date(),
    };

    const result = await db
      .update(salesOrders)
      .set(updatedSalesOrder)
      .where(eq(salesOrders.id, id))
      .returning();
    
    return result[0];
  }

  async deleteSalesOrder(id: string) {
    await db.delete(salesOrders).where(eq(salesOrders.id, id));
  }

  async createSalesOrderFromQuotation(quotationId: string, userId?: string) {
    // Get the quotation with its items
    const quotation = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
    if (!quotation[0]) {
      throw new Error('Quotation not found');
    }

    const quotationData = quotation[0];
    const quotationItemsData = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId));

    // Generate sales order number
    const orderNumber = `SO-${new Date().getFullYear()}-${String(await this.getNextSequenceNumber()).padStart(3, '0')}`;

    // Create the sales order
    const salesOrderData = {
      id: nanoid(),
      orderNumber,
      quotationId,
      customerId: quotationData.customerId,
      customerName: quotationData.customerName,
      customerEmail: quotationData.customerEmail,
      customerPhone: quotationData.customerPhone,
      customerAddress: quotationData.customerAddress,
      orderDate: new Date(),
      status: 'Draft',
      totalAmount: quotationData.totalAmount,
      currency: quotationData.currency,
      notes: quotationData.notes,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(salesOrders).values(salesOrderData).returning();
    const createdSalesOrder = result[0];

    // Create sales order items from quotation items
    if (quotationItemsData.length > 0) {
      const salesOrderItemsData = quotationItemsData.map(item => ({
        id: nanoid(),
        salesOrderId: createdSalesOrder.id,
        itemId: item.itemId,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        currency: item.currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(salesOrderItems).values(salesOrderItemsData);
    }

    return createdSalesOrder;
  }

  async createAmendedSalesOrder(parentOrderId: string, reason: string, userId?: string) {
    // Get the parent sales order
    const parentOrder = await this.getSalesOrder(parentOrderId);
    if (!parentOrder) {
      throw new Error('Parent sales order not found');
    }

    // Create amended sales order
    const amendedOrderNumber = `${parentOrder.orderNumber}-A${String(await this.getNextSequenceNumber()).padStart(3, '0')}`;
    
    const amendedSalesOrder = {
      id: nanoid(),
      orderNumber: amendedOrderNumber,
      parentOrderId,
      customerId: parentOrder.customerId,
      customerName: parentOrder.customerName,
      customerEmail: parentOrder.customerEmail,
      customerPhone: parentOrder.customerPhone,
      customerAddress: parentOrder.customerAddress,
      orderDate: new Date(),
      status: 'Draft',
      totalAmount: parentOrder.totalAmount,
      currency: parentOrder.currency,
      notes: `${parentOrder.notes || ''}\nAmendment Reason: ${reason}`.trim(),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(salesOrders).values(amendedSalesOrder).returning();
    return result[0];
  }

  async validateCustomerLpo(id: string, validationData: { status: string; notes?: string; validatedBy: string }) {
    const salesOrder = await this.getSalesOrder(id);
    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    const updatedSalesOrder = {
      ...salesOrder,
      lpoStatus: validationData.status,
      lpoValidationNotes: validationData.notes,
      lpoValidatedBy: validationData.validatedBy,
      lpoValidatedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .update(salesOrders)
      .set(updatedSalesOrder)
      .where(eq(salesOrders.id, id))
      .returning();
    
    return result[0];
  }

  // Sales Order Item operations
  async getSalesOrderItems(salesOrderId: string) {
    return db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, salesOrderId))
      .orderBy(salesOrderItems.createdAt);
  }

  async getSalesOrderItem(id: string) {
    const result = await db.select().from(salesOrderItems).where(eq(salesOrderItems.id, id)).limit(1);
    return result[0];
  }

  async createSalesOrderItem(item: any) {
    const newItem = {
      ...item,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(salesOrderItems).values(newItem).returning();
    return result[0];
  }

  async updateSalesOrderItem(id: string, item: any) {
    const updatedItem = {
      ...item,
      updatedAt: new Date(),
    };

    const result = await db
      .update(salesOrderItems)
      .set(updatedItem)
      .where(eq(salesOrderItems.id, id))
      .returning();
    
    return result[0];
  }

  async deleteSalesOrderItem(id: string) {
    await db.delete(salesOrderItems).where(eq(salesOrderItems.id, id));
  }

  async bulkCreateSalesOrderItems(items: any[]) {
    const itemsWithIds = items.map(item => ({
      ...item,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await db.insert(salesOrderItems).values(itemsWithIds).returning();
    return result;
  }

  private async getNextSequenceNumber(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'SO-\\d{4}-(\\d+)') AS INTEGER)), 0) + 1 as next_number
      FROM sales_orders 
      WHERE order_number LIKE 'SO-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%'
    `);
    
    return result.rows[0]?.next_number || 1;
  }
}
