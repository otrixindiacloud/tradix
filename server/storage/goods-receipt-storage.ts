import { IGoodsReceiptStorage } from "./interfaces";
import { db } from "../db";
import { insertGoodsReceiptHeaderSchema, insertGoodsReceiptItemSchema } from "@shared/schema";

export class GoodsReceiptStorage implements IGoodsReceiptStorage {
  async createGoodsReceiptHeader(receipt) {
    // Validate and insert header
    const header = insertGoodsReceiptHeaderSchema.parse(receipt);
    // Insert into DB (replace with Drizzle ORM logic)
    const result = await db.insert("goods_receipt_headers").values(header).returning();
    return result[0];
  }

  async createGoodsReceiptItem(item) {
    // Validate and insert item
    const itemData = insertGoodsReceiptItemSchema.parse(item);
    const result = await db.insert("goods_receipt_items").values(itemData).returning();
    return result[0];
  }

  // ...other methods (get, update, delete) can be added as needed
}
