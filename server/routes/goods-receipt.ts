import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertGoodsReceiptHeaderSchema,
  insertGoodsReceiptItemSchema,
  insertScanningSessionSchema,
  insertScannedItemSchema,
  insertSupplierReturnSchema,
  insertSupplierReturnItemSchema
} from "@shared/schema";
import { z } from "zod";

export function registerGoodsReceiptRoutes(app: Express) {
  // Batch create goods receipt header and items
  app.post("/api/goods-receipts", async (req, res) => {
    try {
      const { header, items } = req.body; // Expect { header, items }
      const headerData = insertGoodsReceiptHeaderSchema.parse(header);
      const itemsData = z.array(insertGoodsReceiptItemSchema).parse(items);
      const createdHeader = await storage.createGoodsReceiptHeader(headerData);
      const itemsWithHeaderId = itemsData.map(item => ({ ...item, goodsReceiptId: createdHeader.id }));
      const createdItems = await storage.bulkCreateGoodsReceiptItems(itemsWithHeaderId);
      for (const item of createdItems) {
        const qtyMoved = item.quantityReceived || item.quantityExpected || 0;
        await storage.createStockMovement({
          movementType: "IN",
          itemId: item.itemId,
          quantityBefore: 0,
          quantityMoved: qtyMoved,
          quantityAfter: qtyMoved,
          referenceType: "GoodsReceipt",
          referenceId: createdHeader.id
        });
      }
      res.status(201).json({ header: createdHeader, items: createdItems });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goods receipt data", errors: error.errors });
      }
      console.error("Error creating goods receipt:", error);
      res.status(500).json({ message: "Failed to create goods receipt" });
    }
  });
  // Goods Receipt Headers routes
  app.get("/api/goods-receipt-headers", async (req, res) => {
    try {
      const { supplierId, status, dateFrom, dateTo, limit, offset } = req.query;
      const filters = {
        supplierId: supplierId as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const headers = await storage.getGoodsReceiptHeaders(filters);
      res.json(headers);
    } catch (error) {
      console.error("Error fetching goods receipt headers:", error);
      res.status(500).json({ message: "Failed to fetch goods receipt headers" });
    }
  });

  app.get("/api/goods-receipt-headers/:id", async (req, res) => {
    try {
      const header = await storage.getGoodsReceiptHeader(req.params.id);
      if (!header) {
        return res.status(404).json({ message: "Goods receipt header not found" });
      }
      res.json(header);
    } catch (error) {
      console.error("Error fetching goods receipt header:", error);
      res.status(500).json({ message: "Failed to fetch goods receipt header" });
    }
  });

  app.post("/api/goods-receipt-headers", async (req, res) => {
    try {
      console.log('[GR HEADER][RAW BODY]', req.body);
      try {
        const headerData = insertGoodsReceiptHeaderSchema.parse(req.body);
        const header = await storage.createGoodsReceiptHeader(headerData);
        return res.status(201).json(header);
      } catch (zerr) {
        if (zerr instanceof z.ZodError) {
          console.error('[GR HEADER][VALIDATION ERROR]', JSON.stringify(zerr.errors, null, 2));
          return res.status(400).json({ message: "Invalid goods receipt header data", errors: zerr.errors, raw: req.body });
        }
        throw zerr;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goods receipt header data", errors: error.errors });
      }
      console.error("Error creating goods receipt header:", error);
      res.status(500).json({ message: "Failed to create goods receipt header" });
    }
  });

  app.put("/api/goods-receipt-headers/:id", async (req, res) => {
    try {
      const headerData = insertGoodsReceiptHeaderSchema.partial().parse(req.body);
      const header = await storage.updateGoodsReceiptHeader(req.params.id, headerData);
      res.json(header);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goods receipt header data", errors: error.errors });
      }
      console.error("Error updating goods receipt header:", error);
      res.status(500).json({ message: "Failed to update goods receipt header" });
    }
  });

  // Goods Receipt Items routes
  app.get("/api/goods-receipt-headers/:goodsReceiptId/items", async (req, res) => {
    try {
      const items = await storage.getGoodsReceiptItems(req.params.goodsReceiptId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching goods receipt items:", error);
      res.status(500).json({ message: "Failed to fetch goods receipt items" });
    }
  });

  app.post("/api/goods-receipt-items", async (req, res) => {
    try {
      const itemData = insertGoodsReceiptItemSchema.parse(req.body);
      const item = await storage.createGoodsReceiptItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goods receipt item data", errors: error.errors });
      }
      console.error("Error creating goods receipt item:", error);
      res.status(500).json({ message: "Failed to create goods receipt item" });
    }
  });

  app.put("/api/goods-receipt-items/:id", async (req, res) => {
    try {
      const itemData = insertGoodsReceiptItemSchema.partial().parse(req.body);
      const item = await storage.updateGoodsReceiptItem(req.params.id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goods receipt item data", errors: error.errors });
      }
      console.error("Error updating goods receipt item:", error);
      res.status(500).json({ message: "Failed to update goods receipt item" });
    }
  });

  app.post("/api/goods-receipt-items/bulk", async (req, res) => {
    try {
      const itemsData = z.array(insertGoodsReceiptItemSchema).parse(req.body);
      const items = await storage.bulkCreateGoodsReceiptItems(itemsData);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goods receipt items data", errors: error.errors });
      }
      console.error("Error bulk creating goods receipt items:", error);
      res.status(500).json({ message: "Failed to bulk create goods receipt items" });
    }
  });

  // Scanning Sessions routes
  app.get("/api/scanning-sessions", async (req, res) => {
    try {
      const { goodsReceiptId, status, limit, offset } = req.query;
      const filters = {
        goodsReceiptId: goodsReceiptId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const sessions = await storage.getScanningSessions(filters);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching scanning sessions:", error);
      res.status(500).json({ message: "Failed to fetch scanning sessions" });
    }
  });

  app.post("/api/scanning-sessions", async (req, res) => {
    try {
      const sessionData = insertScanningSessionSchema.parse(req.body);
      const session = await storage.createScanningSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scanning session data", errors: error.errors });
      }
      console.error("Error creating scanning session:", error);
      res.status(500).json({ message: "Failed to create scanning session" });
    }
  });

  app.put("/api/scanning-sessions/:id", async (req, res) => {
    try {
      const sessionData = insertScanningSessionSchema.partial().parse(req.body);
      const session = await storage.updateScanningSession(req.params.id, sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scanning session data", errors: error.errors });
      }
      console.error("Error updating scanning session:", error);
      res.status(500).json({ message: "Failed to update scanning session" });
    }
  });

  // Scanned Items routes
  app.get("/api/scanning-sessions/:sessionId/items", async (req, res) => {
    try {
      const items = await storage.getScannedItems(req.params.sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching scanned items:", error);
      res.status(500).json({ message: "Failed to fetch scanned items" });
    }
  });

  app.post("/api/scanned-items", async (req, res) => {
    try {
      const itemData = insertScannedItemSchema.parse(req.body);
      const item = await storage.createScannedItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scanned item data", errors: error.errors });
      }
      console.error("Error creating scanned item:", error);
      res.status(500).json({ message: "Failed to create scanned item" });
    }
  });

  app.post("/api/scanned-items/bulk", async (req, res) => {
    try {
      const itemsData = z.array(insertScannedItemSchema).parse(req.body);
      const items = await storage.bulkCreateScannedItems(itemsData);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scanned items data", errors: error.errors });
      }
      console.error("Error bulk creating scanned items:", error);
      res.status(500).json({ message: "Failed to bulk create scanned items" });
    }
  });

  // Supplier Returns routes
  app.get("/api/supplier-returns", async (req, res) => {
    try {
      const { supplierId, status, dateFrom, dateTo, limit, offset } = req.query;
      const filters = {
        supplierId: supplierId as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const returns = await storage.getSupplierReturns(filters);
      res.json(returns);
    } catch (error) {
      console.error("Error fetching supplier returns:", error);
      res.status(500).json({ message: "Failed to fetch supplier returns" });
    }
  });

  app.get("/api/supplier-returns/:id", async (req, res) => {
    try {
      const returnRecord = await storage.getSupplierReturn(req.params.id);
      if (!returnRecord) {
        return res.status(404).json({ message: "Supplier return not found" });
      }
      res.json(returnRecord);
    } catch (error) {
      console.error("Error fetching supplier return:", error);
      res.status(500).json({ message: "Failed to fetch supplier return" });
    }
  });

  app.post("/api/supplier-returns", async (req, res) => {
    try {
      const returnData = insertSupplierReturnSchema.parse(req.body);
      const returnRecord = await storage.createSupplierReturn(returnData);
      res.status(201).json(returnRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier return data", errors: error.errors });
      }
      console.error("Error creating supplier return:", error);
      res.status(500).json({ message: "Failed to create supplier return" });
    }
  });

  app.put("/api/supplier-returns/:id", async (req, res) => {
    try {
      const returnData = insertSupplierReturnSchema.partial().parse(req.body);
      const returnRecord = await storage.updateSupplierReturn(req.params.id, returnData);
      res.json(returnRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier return data", errors: error.errors });
      }
      console.error("Error updating supplier return:", error);
      res.status(500).json({ message: "Failed to update supplier return" });
    }
  });

  // Supplier Return Items routes
  app.get("/api/supplier-returns/:returnId/items", async (req, res) => {
    try {
      const items = await storage.getSupplierReturnItems(req.params.returnId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching supplier return items:", error);
      res.status(500).json({ message: "Failed to fetch supplier return items" });
    }
  });

  app.post("/api/supplier-return-items", async (req, res) => {
    try {
      const itemData = insertSupplierReturnItemSchema.parse(req.body);
      const item = await storage.createSupplierReturnItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier return item data", errors: error.errors });
      }
      console.error("Error creating supplier return item:", error);
      res.status(500).json({ message: "Failed to create supplier return item" });
    }
  });

  app.post("/api/supplier-return-items/bulk", async (req, res) => {
    try {
      const itemsData = z.array(insertSupplierReturnItemSchema).parse(req.body);
      const items = await storage.bulkCreateSupplierReturnItems(itemsData);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier return items data", errors: error.errors });
      }
      console.error("Error bulk creating supplier return items:", error);
      res.status(500).json({ message: "Failed to bulk create supplier return items" });
    }
  });
}
