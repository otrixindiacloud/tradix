
import { db } from "../db";
import { eq, and, gte, lte } from "drizzle-orm";
import { quotations, quotationItems } from "@shared/schema";

export class SupplierQuoteStorage {
  static async list(params: any) {
    const whereClauses = [];
    // Filter by customerId (supplier) if provided
    if (params.supplier && params.supplier !== "" && params.supplier !== "all") {
      whereClauses.push(eq(quotations.customerId, params.supplier));
    }
    // Filter by status
    if (params.status && params.status !== "" && params.status !== "all") {
      whereClauses.push(eq(quotations.status, params.status));
    }
    // Filter by validUntil (date range)
    if (params.dateFrom) {
      whereClauses.push(gte(quotations.validUntil, params.dateFrom));
    }
    if (params.dateTo) {
      whereClauses.push(lte(quotations.validUntil, params.dateTo));
    }
    // Filter by quoteNumber search
    if (params.search && params.search.trim() !== "") {
      // Example: filter by quoteNumber containing search string
      // Uncomment and adjust if using drizzle-orm ilike
      // whereClauses.push(ilike(quotations.quoteNumber, `%${params.search}%`));
    }
    // Add search filter (by quoteNumber, supplierName, etc.)
    if (params.search && params.search.trim() !== "") {
      // Example: filter by quoteNumber or supplierName containing search string
      // This requires a 'like' operator, which may differ by ORM
      // For Drizzle, you may need to use ilike or similar
      // whereClauses.push(ilike(quotations.quoteNumber, `%${params.search}%`));
      // whereClauses.push(ilike(quotations.supplierName, `%${params.search}%`));
    }
    if (whereClauses.length > 0) {
      return await db.select().from(quotations).where(and(...whereClauses));
    }
    return await db.select().from(quotations);
  }

  static async getById(id: string) {
  const result = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
    return result[0];
  }

  static async getItems(quoteId: string) {
  return await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quoteId));
  }

  static async create(data: any) {
    // Insert quote
  const [quote] = await db.insert(quotations).values(data).returning();
    // Insert items if present
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
  await db.insert(quotationItems).values({ ...item, quotationId: quote.id });
      }
    }
    return await this.getById(quote.id);
  }

  static async update(id: string, updates: any) {
  await db.update(quotations).set(updates).where(eq(quotations.id, id));
    return await this.getById(id);
  }

  static async delete(id: string) {
  await db.delete(quotations).where(eq(quotations.id, id));
  await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    return { message: "Supplier quote deleted successfully" };
  }
}
