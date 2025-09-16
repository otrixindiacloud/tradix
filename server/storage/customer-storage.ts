import { customers, auditLogs, enquiries, quotations, salesOrders, invoices, type Customer, type InsertCustomer } from "@shared/schema";
import { db } from "../db.js";
import { eq, desc, sum, count, sql, and, gte } from "drizzle-orm";
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

  async getCustomerDetails(id: string): Promise<any> {
    const customer = await this.getCustomer(id);
    if (!customer) return null;

    // Get customer transaction summary
    const transactionSummary = await this.getCustomerTransactionSummary(id);
    
    // Get recent activities
    const recentActivities = await this.getCustomerRecentActivities(id);
    
    // Get performance metrics
    const performanceMetrics = await this.getCustomerPerformanceMetrics(id);

    return {
      ...customer,
      transactionSummary,
      recentActivities,
      performanceMetrics
    };
  }

  async getCustomerTransactionSummary(customerId: string): Promise<any> {
    try {
      // Get enquiry counts
      const enquiryStats = await db
        .select({
          total: count(),
          status: enquiries.status
        })
        .from(enquiries)
        .where(eq(enquiries.customerId, customerId))
        .groupBy(enquiries.status);

      // Get quotation counts and values
      const quotationStats = await db
        .select({
          total: count(),
          totalValue: sum(quotations.totalAmount),
          status: quotations.status
        })
        .from(quotations)
        .where(eq(quotations.customerId, customerId))
        .groupBy(quotations.status);

      // Get sales order counts and values
      const salesOrderStats = await db
        .select({
          total: count(),
          totalValue: sum(salesOrders.totalAmount),
          status: salesOrders.status
        })
        .from(salesOrders)
        .where(eq(salesOrders.customerId, customerId))
        .groupBy(salesOrders.status);

      // Get invoice totals
      const invoiceStats = await db
        .select({
          total: count(),
          totalValue: sum(invoices.totalAmount),
          status: invoices.status
        })
        .from(invoices)
        .where(eq(invoices.customerId, customerId))
        .groupBy(invoices.status);

      return {
        enquiries: enquiryStats,
        quotations: quotationStats,
        salesOrders: salesOrderStats,
        invoices: invoiceStats
      };
    } catch (error) {
      console.error('Error getting customer transaction summary:', error);
      return {
        enquiries: [],
        quotations: [],
        salesOrders: [],
        invoices: []
      };
    }
  }

  async getCustomerRecentActivities(customerId: string, limit = 10): Promise<any[]> {
    try {
      // Get recent enquiries
      const recentEnquiries = await db
        .select({
          id: enquiries.id,
          type: sql<string>`'enquiry'`,
          title: sql<string>`CONCAT('Enquiry ', ${enquiries.enquiryNumber})`,
          status: enquiries.status,
          amount: sql<number>`NULL`,
          date: enquiries.createdAt
        })
        .from(enquiries)
        .where(eq(enquiries.customerId, customerId))
        .orderBy(desc(enquiries.createdAt))
        .limit(5);

      // Get recent quotations  
      const recentQuotations = await db
        .select({
          id: quotations.id,
          type: sql<string>`'quotation'`,
          title: sql<string>`CONCAT('Quotation ', ${quotations.quoteNumber})`,
          status: quotations.status,
          amount: quotations.totalAmount,
          date: quotations.createdAt
        })
        .from(quotations)
        .where(eq(quotations.customerId, customerId))
        .orderBy(desc(quotations.createdAt))
        .limit(5);

      // Get recent sales orders
      const recentSalesOrders = await db
        .select({
          id: salesOrders.id,
          type: sql<string>`'sales_order'`,
          title: sql<string>`CONCAT('Sales Order ', ${salesOrders.orderNumber})`,
          status: salesOrders.status,
          amount: salesOrders.totalAmount,
          date: salesOrders.createdAt
        })
        .from(salesOrders)
        .where(eq(salesOrders.customerId, customerId))
        .orderBy(desc(salesOrders.createdAt))
        .limit(5);

      // Combine and sort all activities
      const allActivities = [
        ...recentEnquiries,
        ...recentQuotations,
        ...recentSalesOrders
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
       .slice(0, limit);

      return allActivities;
    } catch (error) {
      console.error('Error getting customer recent activities:', error);
      return [];
    }
  }

  async getCustomerPerformanceMetrics(customerId: string): Promise<any> {
    try {
      const now = new Date();
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

      // Calculate metrics for different periods
      const yearlyMetrics = await this.getCustomerMetricsForPeriod(customerId, lastYear);
      const sixMonthMetrics = await this.getCustomerMetricsForPeriod(customerId, last6Months);
      const quarterlyMetrics = await this.getCustomerMetricsForPeriod(customerId, last3Months);

      // Calculate conversion rates
      const conversionRates = await this.getCustomerConversionRates(customerId);

      return {
        yearly: yearlyMetrics,
        sixMonth: sixMonthMetrics,
        quarterly: quarterlyMetrics,
        conversionRates
      };
    } catch (error) {
      console.error('Error getting customer performance metrics:', error);
      return {
        yearly: { totalOrders: 0, totalValue: 0, averageOrderValue: 0 },
        sixMonth: { totalOrders: 0, totalValue: 0, averageOrderValue: 0 },
        quarterly: { totalOrders: 0, totalValue: 0, averageOrderValue: 0 },
        conversionRates: { enquiryToQuote: 0, quoteToOrder: 0, overall: 0 }
      };
    }
  }

  private async getCustomerMetricsForPeriod(customerId: string, fromDate: Date): Promise<any> {
    const [orderMetrics] = await db
      .select({
        totalOrders: count(),
        totalValue: sum(salesOrders.totalAmount)
      })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.customerId, customerId),
          gte(salesOrders.createdAt, fromDate)
        )
      );

    const totalValue = Number(orderMetrics.totalValue || 0);
    const totalOrders = Number(orderMetrics.totalOrders || 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    return {
      totalOrders,
      totalValue,
      averageOrderValue
    };
  }

  private async getCustomerConversionRates(customerId: string): Promise<any> {
    try {
      // Count enquiries
      const [enquiryCount] = await db
        .select({ count: count() })
        .from(enquiries)
        .where(eq(enquiries.customerId, customerId));

      // Count quotations
      const [quotationCount] = await db
        .select({ count: count() })
        .from(quotations)
        .where(eq(quotations.customerId, customerId));

      // Count orders
      const [orderCount] = await db
        .select({ count: count() })
        .from(salesOrders)
        .where(eq(salesOrders.customerId, customerId));

      const enquiries = Number(enquiryCount.count || 0);
      const quotes = Number(quotationCount.count || 0);
      const orders = Number(orderCount.count || 0);

      const enquiryToQuote = enquiries > 0 ? (quotes / enquiries) * 100 : 0;
      const quoteToOrder = quotes > 0 ? (orders / quotes) * 100 : 0;
      const overall = enquiries > 0 ? (orders / enquiries) * 100 : 0;

      return {
        enquiryToQuote: Math.round(enquiryToQuote * 100) / 100,
        quoteToOrder: Math.round(quoteToOrder * 100) / 100,
        overall: Math.round(overall * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating conversion rates:', error);
      return { enquiryToQuote: 0, quoteToOrder: 0, overall: 0 };
    }
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
