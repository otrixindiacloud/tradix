
import { db } from "../db";
import { stockIssue, inventoryItem } from "../../shared/schema";
import { eq } from "drizzle-orm";

export class StockIssuesStorage {
  async getAllStockIssues() {
    // Join stockIssue with inventoryItem to get item description
    const results = await db
      .select({
        id: stockIssue.id,
        issueNumber: stockIssue.issueNumber,
        itemId: stockIssue.itemId,
        quantity: stockIssue.quantity,
        // issuedBy: stockIssue.issuedBy, // Removed: not present in schema
        issueDate: stockIssue.issueDate,
        status: stockIssue.status,
        itemName: inventoryItem.description,
        itemCode: inventoryItem.barcode,
      })
      .from(stockIssue)
      .leftJoin(inventoryItem, eq(stockIssue.itemId, inventoryItem.id));
    return results;
  }

  async getStockIssueById(id: string) {
    const result = await db.select().from(stockIssue).where(eq(stockIssue.id, id));
    return result[0] || null;
  }

  async createStockIssue(data: any) {
    const [created] = await db.insert(stockIssue).values(data).returning();
    return created;
  }

  async updateStockIssue(id: string, data: any) {
    const [updated] = await db.update(stockIssue).set(data).where(eq(stockIssue.id, id)).returning();
    return updated || null;
  }

  async deleteStockIssue(id: string) {
    await db.delete(stockIssue).where(eq(stockIssue.id, id));
  }
}
