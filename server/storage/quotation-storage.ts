import { eq, and, gte, lte, desc, asc, isNull, isNotNull, like, or } from "drizzle-orm";
import { db } from "../db.js";
import {
  quotations,
  quotationItems,
  quotationApprovals,
  quotationItemAcceptances,
  enquiries,
  enquiryItems,
  customers,
  type Quotation,
  type QuotationItem,
  type QuotationApproval,
  type InsertQuotation,
  type InsertQuotationItem,
  type InsertQuotationApproval,
} from "@shared/schema";
import { BaseStorage } from './base.js';
import { validateUserIdOrDefault, SYSTEM_USER_ID } from "@shared/utils/uuid";

export class QuotationStorage extends BaseStorage {
  
  // Helper method to get enquiry with customer details
  async getEnquiryWithCustomer(enquiryId: string) {
    const result = await db
      .select({
        id: enquiries.id,
        enquiryNumber: enquiries.enquiryNumber,
        notes: enquiries.notes,
        customerId: enquiries.customerId,
        customer: {
          id: customers.id,
          name: customers.name,
          customerType: customers.customerType,
          email: customers.email,
          phone: customers.phone,
        }
      })
      .from(enquiries)
      .innerJoin(customers, eq(enquiries.customerId, customers.id))
      .where(eq(enquiries.id, enquiryId));
    
    return result[0];
  }
  // Quotation operations
  async getQuotations(limit = 50, offset = 0, filters?: {
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(quotations.status, filters.status as any));
    }
    
    if (filters?.customerId) {
      conditions.push(eq(quotations.customerId, filters.customerId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(quotations.createdAt, new Date(filters.dateFrom)));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(quotations.createdAt, new Date(filters.dateTo)));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          like(quotations.quoteNumber, `%${filters.search}%`),
          like(quotations.notes, `%${filters.search}%`)
        )
      );
    }

    return await db
      .select()
      .from(quotations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(quotations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getQuotation(id: string) {
    const result = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id))
      .limit(1);
    
    return result[0];
  }

  async createQuotation(quotation: InsertQuotation, userId?: string) {
    // Generate unique quotation number
    let quoteNumber: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      quoteNumber = this.generateNumber("QT");
      
      // Check if this number already exists
      const existing = await db.select({ id: quotations.id }).from(quotations).where(eq(quotations.quoteNumber, quoteNumber)).limit(1);
      if (existing.length === 0) break;
      
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique quotation number");
    }
    
    const now = this.getCurrentTimestamp();

    // Ensure validUntil is a Date object if provided
    const processedQuotation = {
      ...quotation,
      validUntil: quotation.validUntil ? new Date(quotation.validUntil as unknown as string | Date) : undefined,
    };

    const newQuotation = {
      ...processedQuotation,
      quoteNumber,  // Use the correct field name from schema
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(quotations).values(newQuotation).returning();
    const inserted = (result as Quotation[])[0];

    await this.logAuditEvent(
      "quotation",
      inserted.id,
      "created",
      (userId || quotation.createdBy || "system") as string,
      null,
      inserted
    );

    return inserted as Quotation;
  }

  async updateQuotation(id: string, quotation: Partial<InsertQuotation>) {
    const existing = await this.getQuotation(id);
    if (!existing) {
      throw new Error("Quotation not found");
    }

    const updatedQuotation = {
      ...quotation,
      updatedAt: this.getCurrentTimestamp(),
    };

    await db
      .update(quotations)
      .set(updatedQuotation)
      .where(eq(quotations.id, id));

    await this.logAuditEvent(
      "quotation",
      id,
      "updated",
      (quotation.createdBy || "system") as string,
      existing,
      { ...existing, ...updatedQuotation }
    );

    return { ...existing, ...updatedQuotation } as Quotation;
  }

  async deleteQuotation(id: string) {
    const existing = await this.getQuotation(id);
    if (!existing) {
      throw new Error("Quotation not found");
    }

    // Delete related items first
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    
    // Delete the quotation
    await db.delete(quotations).where(eq(quotations.id, id));

    await this.logAuditEvent(
      "quotation",
      id,
      "deleted",
      undefined,
      existing,
      null
    );
  }

  async generateQuotationFromEnquiry(enquiryId: string, userId = "system") {
    try {
      console.log("generateQuotationFromEnquiry called with:", { enquiryId, userId });

      // Get the enquiry with customer details
      const enquiry = await this.getEnquiryWithCustomer(enquiryId);
      if (!enquiry) {
        throw new Error("Enquiry not found");
      }

      console.log("Retrieved enquiry and customer:", {
        enquiry: { id: enquiry.id, notes: enquiry.notes },
        customer: { id: enquiry.customer.id, name: enquiry.customer.name, customerType: enquiry.customer.customerType }
      });

      // Get enquiry items to copy to quotation
      const enquiryItems = await db
        .select()
        .from(enquiryItems)
        .where(eq(enquiryItems.enquiryId, enquiryId));

      console.log("Retrieved enquiry items:", enquiryItems.length, "items");

      // Calculate markup based on customer type
      const markup = enquiry.customer.customerType === "Retail" ? 0.7 : 0.4;
      console.log("Calculated markup:", markup);

      // Create quotation data
      const quotationData = {
        customerId: enquiry.customerId,
        customerType: enquiry.customer.customerType,
        enquiryId: enquiry.id,
        status: "Draft" as const,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        subtotal: "0",
        discountPercentage: "0",
        discountAmount: "0",
        taxAmount: "0",
        totalAmount: "0", // Will be calculated from items
        notes: `Generated from enquiry ${enquiry.enquiryNumber}`,
        createdBy: validateUserIdOrDefault(userId),
      };

      console.log("Creating quotation with data:", quotationData);

      // Create the quotation with userId parameter
      const quotation = await this.createQuotation(quotationData as unknown as InsertQuotation, userId);

      console.log("Successfully created quotation:", quotation);

      // Copy enquiry items to quotation items
      if (enquiryItems.length > 0) {
        let totalAmount = 0;
        
        for (const enquiryItem of enquiryItems) {
          // Calculate price with markup
          const basePrice = parseFloat(enquiryItem.unitPrice || "0");
          const quotedPrice = basePrice * (1 + markup);
          const totalPrice = quotedPrice * enquiryItem.quantity;
          totalAmount += totalPrice;

          const quotationItemData = {
            quotationId: quotation.id,
            description: enquiryItem.description,
            quantity: enquiryItem.quantity,
            unitPrice: quotedPrice.toFixed(4),
            lineTotal: totalPrice.toFixed(2),
            notes: enquiryItem.notes || "",
          };

          console.log("Creating quotation item:", quotationItemData);
          await this.createQuotationItem(quotationItemData as unknown as InsertQuotationItem);
        }

        // Update quotation totals
        const updatedQuotation = {
          subtotal: totalAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
        };

        console.log("Updating quotation totals:", updatedQuotation);
        await this.updateQuotation(quotation.id, updatedQuotation);
      }

      console.log("Successfully generated quotation with items from enquiry");
      return quotation;
    } catch (error) {
      console.error("Error generating quotation from enquiry:", error);
      throw error;
    }
  }

  // Quotation revision operations
  async createQuotationRevision(originalId: string, revisionData: any, userId: string) {
    const original = await this.getQuotation(originalId);
    if (!original) {
      throw new Error("Original quotation not found");
    }

    // Create new quotation as revision
    const revisionQuotation: InsertQuotation = {
      ...original,
      parentQuotationId: originalId,
      revision: (original.revision || 0) + 1,
      status: "Draft",
      createdBy: validateUserIdOrDefault(userId),
      ...revisionData,
    };

    delete (revisionQuotation as any).id;
    delete (revisionQuotation as any).createdAt;
    delete (revisionQuotation as any).updatedAt;

    return await this.createQuotation(revisionQuotation, userId);
  }

  async getQuotationRevisions(originalId: string) {
    return await db
      .select()
      .from(quotations)
      .where(eq(quotations.parentQuotationId, originalId))
      .orderBy(asc(quotations.revision));
  }

  async getQuotationHistory(quotationId: string) {
    // This would typically query an audit log table
    // For now, return empty array
    return [];
  }

  // Quotation Item operations
  async getQuotationItems(quotationId: string) {
    return await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId))
      .orderBy(asc(quotationItems.createdAt));
  }

  async createQuotationItem(item: InsertQuotationItem) {
    console.log("DEBUG: createQuotationItem called with:", item);
    try {
      const id = this.generateId();
      const now = this.getCurrentTimestamp();

      const newItem = {
        ...item,
        id,
        createdAt: now,
      };

      console.log("DEBUG: About to insert with data:", newItem);
      const result = await db.insert(quotationItems).values(newItem).returning();
      console.log("DEBUG: Insert successful, result:", result);

      return { ...newItem } as QuotationItem;
    } catch (error) {
      console.error("DEBUG: Database insert error:", error);
      throw error;
    }
  }

  async updateQuotationItem(id: string, item: Partial<InsertQuotationItem>) {
    const existing = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new Error("Quotation item not found");
    }

    const updatedItem = {
      ...item,
    };

    await db
      .update(quotationItems)
      .set(updatedItem)
      .where(eq(quotationItems.id, id));

    await this.logAuditEvent(
      "quotation_item",
      id,
      "updated",
      "system", // Use system as fallback since modifiedBy doesn't exist in InsertQuotationItem
      existing[0],
      { ...existing[0], ...updatedItem }
    );

    return { ...existing[0], ...updatedItem } as QuotationItem;
  }

  async deleteQuotationItem(id: string) {
    const existing = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new Error("Quotation item not found");
    }

    await db.delete(quotationItems).where(eq(quotationItems.id, id));

    await this.logAuditEvent(
      "quotation_item",
      id,
      "deleted",
      undefined,
      existing[0],
      null
    );
  }

  // Quotation Approval operations
  async getQuotationApprovals(quotationId: string) {
    return await db
      .select()
      .from(quotationApprovals)
      .where(eq(quotationApprovals.quotationId, quotationId))
      .orderBy(asc(quotationApprovals.createdAt));
  }

  async createQuotationApproval(approval: InsertQuotationApproval) {
    const id = this.generateId();
    const now = this.getCurrentTimestamp();

    const newApproval = {
      ...approval,
      id,
      createdAt: now,
    };

    await db.insert(quotationApprovals).values(newApproval);

    await this.logAuditEvent(
      "quotation_approval",
      id,
      "created",
      "system", // Use system as fallback since createdBy doesn't exist in InsertQuotationApproval
      null,
      newApproval
    );

    return { ...newApproval } as QuotationApproval;
  }
}
