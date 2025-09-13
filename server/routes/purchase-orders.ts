import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertPurchaseOrderSchema,
  insertPoLineItemSchema,
  insertAcceptanceConfirmationSchema
} from "@shared/schema";
import { z } from "zod";

export function registerPurchaseOrderRoutes(app: Express) {
  // Purchase Order routes
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const quotationId = req.query.quotationId as string;
      const filters = quotationId ? { quotationId } : {};
      const orders = await storage.getPurchaseOrders(limit, offset, filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/purchase-orders/:id", async (req, res) => {
    try {
      const order = await storage.getPurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const orderData = insertPurchaseOrderSchema.parse(req.body);
      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase order data", errors: error.errors });
      }
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.put("/api/purchase-orders/:id", async (req, res) => {
    try {
      const orderData = insertPurchaseOrderSchema.partial().parse(req.body);
      const order = await storage.updatePurchaseOrder(req.params.id, orderData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase order data", errors: error.errors });
      }
      console.error("Error updating purchase order:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });

  app.delete("/api/purchase-orders/:id", async (req, res) => {
    try {
      await storage.deletePurchaseOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });

  app.post("/api/purchase-orders/:id/validate", async (req, res) => {
    try {
      const validationSchema = z.object({
        status: z.enum(["Valid", "Invalid", "Requires Review"]),
        notes: z.string().optional(),
        validatedBy: z.string().min(1, "Validator ID is required"),
      });

      const validationData = validationSchema.parse(req.body);
      const order = await storage.validatePurchaseOrder(req.params.id, validationData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid validation data", errors: error.errors });
      }
      console.error("Error validating purchase order:", error);
      res.status(500).json({ message: "Failed to validate purchase order" });
    }
  });

  // PO Line Items routes
  app.get("/api/purchase-orders/:poId/line-items", async (req, res) => {
    try {
      const lineItems = await storage.getPoLineItems(req.params.poId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching PO line items:", error);
      res.status(500).json({ message: "Failed to fetch PO line items" });
    }
  });

  app.post("/api/purchase-orders/:poId/line-items", async (req, res) => {
    try {
      const lineItemData = insertPoLineItemSchema.parse({
        ...req.body,
        purchaseOrderId: req.params.poId,
      });
      const lineItem = await storage.createPoLineItem(lineItemData);
      res.status(201).json(lineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid PO line item data", errors: error.errors });
      }
      console.error("Error creating PO line item:", error);
      res.status(500).json({ message: "Failed to create PO line item" });
    }
  });

  app.post("/api/purchase-orders/:poId/line-items/bulk", async (req, res) => {
    try {
      const lineItems = req.body.map((item: any) => 
        insertPoLineItemSchema.parse({
          ...item,
          purchaseOrderId: req.params.poId,
        })
      );
      const results = await storage.bulkCreatePoLineItems(lineItems);
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid PO line item data", errors: error.errors });
      }
      console.error("Error creating PO line items:", error);
      res.status(500).json({ message: "Failed to create PO line items" });
    }
  });

  // PO Upload route
  app.post("/api/po-upload", async (req, res) => {
    try {
      const { poNumber, quotationId } = req.body;
      
      if (!poNumber || !quotationId) {
        return res.status(400).json({ message: "PO number and quotation ID are required" });
      }

      // Update quotation with PO number and document
      const quotation = await storage.updateQuotation(quotationId, {
        customerPoNumber: poNumber,
        customerPoDocument: req.file ? req.file.filename : null,
        status: "Accepted"
      });

      res.status(201).json(quotation);
    } catch (error) {
      console.error("Error uploading PO:", error);
      res.status(500).json({ message: "Failed to upload PO" });
    }
  });

  // Acceptance Confirmation routes
  app.get("/api/customer-acceptances/:acceptanceId/confirmations", async (req, res) => {
    try {
      const confirmations = await storage.getAcceptanceConfirmations(req.params.acceptanceId);
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching acceptance confirmations:", error);
      res.status(500).json({ message: "Failed to fetch acceptance confirmations" });
    }
  });

  app.post("/api/customer-acceptances/:acceptanceId/confirmations", async (req, res) => {
    try {
      const confirmationData = insertAcceptanceConfirmationSchema.parse({
        ...req.body,
        customerAcceptanceId: req.params.acceptanceId,
      });
      const confirmation = await storage.createAcceptanceConfirmation(confirmationData);
      res.status(201).json(confirmation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid acceptance confirmation data", errors: error.errors });
      }
      console.error("Error creating acceptance confirmation:", error);
      res.status(500).json({ message: "Failed to create acceptance confirmation" });
    }
  });
}
