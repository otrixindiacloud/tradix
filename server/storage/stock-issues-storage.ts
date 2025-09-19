
import { db } from "../db";
import { stockIssue } from "../../shared/schema";
import { eq } from "drizzle-orm";

export class StockIssuesStorage {
  async getAllStockIssues() {
    return await db.select().from(stockIssue);
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
