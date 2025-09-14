import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertSalesOrderSchema,
  insertSalesOrderItemSchema
} from "@shared/schema";
import { z } from "zod";

export function registerSalesOrderRoutes(app: Express) {
  // Sales Order routes
  app.get("/api/sales-orders", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = {
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string,
        // Filter for sales orders pending supplier LPO creation
        pendingSupplierLpo: req.query.pendingSupplierLpo === "true",
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const salesOrders = await storage.getSalesOrders(limit, offset, Object.keys(filters).length > 0 ? filters : undefined);
      res.json(salesOrders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  app.get("/api/sales-orders/:id", async (req, res) => {
    try {
      const salesOrder = await storage.getSalesOrder(req.params.id);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(salesOrder);
    } catch (error) {
      console.error("Error fetching sales order:", error);
      res.status(500).json({ message: "Failed to fetch sales order" });
    }
  });

  app.post("/api/sales-orders", async (req, res) => {
    try {
      const salesOrderData = insertSalesOrderSchema.parse(req.body);
      const salesOrder = await storage.createSalesOrder(salesOrderData);
      res.status(201).json(salesOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sales order data", errors: error.errors });
      }
      console.error("Error creating sales order:", error);
      res.status(500).json({ message: "Failed to create sales order" });
    }
  });

  app.put("/api/sales-orders/:id", async (req, res) => {
    try {
      const salesOrderData = insertSalesOrderSchema.partial().parse(req.body);
      const salesOrder = await storage.updateSalesOrder(req.params.id, salesOrderData);
      res.json(salesOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sales order data", errors: error.errors });
      }
      console.error("Error updating sales order:", error);
      res.status(500).json({ message: "Failed to update sales order" });
    }
  });

  app.delete("/api/sales-orders/:id", async (req, res) => {
    try {
      await storage.deleteSalesOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sales order:", error);
      res.status(500).json({ message: "Failed to delete sales order" });
    }
  });

  app.post("/api/sales-orders/from-quotation", async (req, res) => {
    try {
      const { quotationId, userId } = req.body;
      if (!quotationId) {
        return res.status(400).json({ message: "Quotation ID is required" });
      }
      // Accept userId only if it looks like a UUID (simple regex)
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      const effectiveUserId = (typeof userId === 'string' && uuidRegex.test(userId)) ? userId : undefined;
      const salesOrder = await storage.createSalesOrderFromQuotation(quotationId, effectiveUserId);
      res.status(201).json(salesOrder);
    } catch (error) {
      console.error("Error creating sales order from quotation:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create sales order from quotation" });
    }
  });

  app.post("/api/sales-orders/:id/amend", async (req, res) => {
    try {
      const { amendments, userId } = req.body;
      if (!amendments || !userId) {
        return res.status(400).json({ message: "Amendments and User ID are required" });
      }

      // For now, return an error since the storage method doesn't exist yet
      res.status(501).json({ message: "Amendment functionality not yet implemented" });
    } catch (error) {
      console.error("Error creating amended sales order:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create amended sales order" });
    }
  });

  // Validate customer LPO
  app.put("/api/sales-orders/:id/validate-lpo", async (req, res) => {
    try {
      const validationSchema = z.object({
        status: z.enum(["Approved", "Rejected"]),
        notes: z.string().optional(),
        validatedBy: z.string().min(1, "Validator ID is required"),
      });

      const validationData = validationSchema.parse(req.body);
      const salesOrder = await storage.validateCustomerLpo(req.params.id, validationData);
      res.json(salesOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid validation data", errors: error.errors });
      }
      console.error("Error validating customer LPO:", error);
      res.status(500).json({ message: "Failed to validate customer LPO" });
    }
  });

  // Sales Order Items routes
  app.get("/api/sales-orders/:id/items", async (req, res) => {
    try {
      const items = await storage.getSalesOrderItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching sales order items:", error);
      res.status(500).json({ message: "Failed to fetch sales order items" });
    }
  });

  app.get("/api/sales-order-items/:id", async (req, res) => {
    try {
      const item = await storage.getSalesOrderItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Sales order item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching sales order item:", error);
      res.status(500).json({ message: "Failed to fetch sales order item" });
    }
  });

  app.post("/api/sales-order-items", async (req, res) => {
    try {
      const itemData = insertSalesOrderItemSchema.parse(req.body);
      const item = await storage.createSalesOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sales order item data", errors: error.errors });
      }
      console.error("Error creating sales order item:", error);
      res.status(500).json({ message: "Failed to create sales order item" });
    }
  });

  app.put("/api/sales-order-items/:id", async (req, res) => {
    try {
      const itemData = insertSalesOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateSalesOrderItem(req.params.id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sales order item data", errors: error.errors });
      }
      console.error("Error updating sales order item:", error);
      res.status(500).json({ message: "Failed to update sales order item" });
    }
  });

  app.delete("/api/sales-order-items/:id", async (req, res) => {
    try {
      await storage.deleteSalesOrderItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sales order item:", error);
      res.status(500).json({ message: "Failed to delete sales order item" });
    }
  });

  app.post("/api/sales-order-items/bulk", async (req, res) => {
    try {
      const itemsData = req.body.items;
      const validatedItems = z.array(insertSalesOrderItemSchema).parse(itemsData);
      const items = await storage.bulkCreateSalesOrderItems(validatedItems);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sales order items data", errors: error.errors });
      }
      console.error("Error creating sales order items:", error);
      res.status(500).json({ message: "Failed to create sales order items" });
    }
  });
}
