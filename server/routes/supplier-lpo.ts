import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertSupplierLpoSchema,
  insertSupplierLpoItemSchema
} from "@shared/schema";
import { z } from "zod";

export function registerSupplierLpoRoutes(app: Express) {
  // Supplier LPO routes
  app.get("/api/supplier-lpos", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const filters = {
        status: req.query.status as string,
        supplierId: req.query.supplierId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string,
        requiresApproval: req.query.requiresApproval === "true",
        pendingSupplierConfirmation: req.query.pendingSupplierConfirmation === "true",
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const supplierLpos = await storage.getSupplierLpos(limit, offset, Object.keys(filters).length > 0 ? filters : undefined);
      res.json(supplierLpos);
    } catch (error) {
      console.error("Error fetching supplier LPOs:", error);
      res.status(500).json({ message: "Failed to fetch supplier LPOs" });
    }
  });

  app.get("/api/supplier-lpos/:id", async (req, res) => {
    try {
      const supplierLpo = await storage.getSupplierLpo(req.params.id);
      if (!supplierLpo) {
        return res.status(404).json({ message: "Supplier LPO not found" });
      }
      res.json(supplierLpo);
    } catch (error) {
      console.error("Error fetching supplier LPO:", error);
      res.status(500).json({ message: "Failed to fetch supplier LPO" });
    }
  });

  app.post("/api/supplier-lpos", async (req, res) => {
    try {
      const lpoData = insertSupplierLpoSchema.parse(req.body);
      const supplierLpo = await storage.createSupplierLpo(lpoData);
      res.status(201).json(supplierLpo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier LPO data", errors: error.errors });
      }
      console.error("Error creating supplier LPO:", error);
      res.status(500).json({ message: "Failed to create supplier LPO" });
    }
  });

  app.put("/api/supplier-lpos/:id", async (req, res) => {
    try {
      const lpoData = insertSupplierLpoSchema.partial().parse(req.body);
      const supplierLpo = await storage.updateSupplierLpo(req.params.id, lpoData);
      res.json(supplierLpo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier LPO data", errors: error.errors });
      }
      console.error("Error updating supplier LPO:", error);
      res.status(500).json({ message: "Failed to update supplier LPO" });
    }
  });

  app.delete("/api/supplier-lpos/:id", async (req, res) => {
    try {
      await storage.deleteSupplierLpo(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier LPO:", error);
      res.status(500).json({ message: "Failed to delete supplier LPO" });
    }
  });

  app.post("/api/supplier-lpos/from-sales-orders", async (req, res) => {
    try {
      const { salesOrderIds, groupBy, userId } = req.body;
      if (!salesOrderIds || !Array.isArray(salesOrderIds) || salesOrderIds.length === 0) {
        return res.status(400).json({ message: "At least one sales order ID is required" });
      }

      const supplierLpos = await storage.createSupplierLposFromSalesOrders(salesOrderIds, groupBy || "supplier", userId);
      res.status(201).json(supplierLpos);
    } catch (error) {
      console.error("Error creating supplier LPOs from sales orders:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create supplier LPOs from sales orders" });
    }
  });

  // Create amended LPO
  app.post("/api/supplier-lpos/:id/amend", async (req, res) => {
    try {
      const { reason, amendmentType, userId } = req.body;
      if (!reason || !amendmentType) {
        return res.status(400).json({ message: "Amendment reason and type are required" });
      }

      const amendedLpo = await storage.createAmendedSupplierLpo(req.params.id, reason, amendmentType, userId);
      res.status(201).json(amendedLpo);
    } catch (error) {
      console.error("Error creating amended supplier LPO:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create amended supplier LPO" });
    }
  });

  // Workflow actions
  app.post("/api/supplier-lpos/:id/submit-for-approval", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const supplierLpo = await storage.submitForApproval(req.params.id, userId);
      res.json(supplierLpo);
    } catch (error) {
      console.error("Error submitting supplier LPO for approval:", error);
      res.status(500).json({ message: "Failed to submit supplier LPO for approval" });
    }
  });

  app.post("/api/supplier-lpos/:id/approve", async (req, res) => {
    try {
      const { userId, notes } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const supplierLpo = await storage.approveSupplierLpo(req.params.id, userId, notes);
      res.json(supplierLpo);
    } catch (error) {
      console.error("Error approving supplier LPO:", error);
      res.status(500).json({ message: "Failed to approve supplier LPO" });
    }
  });

  app.post("/api/supplier-lpos/:id/reject", async (req, res) => {
    try {
      const { userId, notes } = req.body;
      if (!userId || !notes) {
        return res.status(400).json({ message: "User ID and rejection notes are required" });
      }

      const supplierLpo = await storage.rejectSupplierLpo(req.params.id, userId, notes);
      res.json(supplierLpo);
    } catch (error) {
      console.error("Error rejecting supplier LPO:", error);
      res.status(500).json({ message: "Failed to reject supplier LPO" });
    }
  });

  app.post("/api/supplier-lpos/:id/send-to-supplier", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const supplierLpo = await storage.sendToSupplier(req.params.id, userId);
      res.json(supplierLpo);
    } catch (error) {
      console.error("Error sending supplier LPO to supplier:", error);
      res.status(500).json({ message: "Failed to send supplier LPO to supplier" });
    }
  });

  app.post("/api/supplier-lpos/:id/confirm-by-supplier", async (req, res) => {
    try {
      const { confirmationReference } = req.body;
      const supplierLpo = await storage.confirmBySupplier(req.params.id, confirmationReference);
      res.json(supplierLpo);
    } catch (error) {
      console.error("Error confirming supplier LPO:", error);
      res.status(500).json({ message: "Failed to confirm supplier LPO" });
    }
  });

  // Backlog reporting
  app.get("/api/supplier-lpos/backlog", async (req, res) => {
    try {
      const backlog = await storage.getSupplierLpoBacklog();
      res.json(backlog);
    } catch (error) {
      console.error("Error fetching supplier LPO backlog:", error);
      res.status(500).json({ message: "Failed to fetch supplier LPO backlog" });
    }
  });

  app.get("/api/customer-orders/backlog", async (req, res) => {
    try {
      const backlog = await storage.getCustomerOrderBacklog();
      res.json(backlog);
    } catch (error) {
      console.error("Error fetching customer order backlog:", error);
      res.status(500).json({ message: "Failed to fetch customer order backlog" });
    }
  });

  // Supplier LPO Items routes
  app.get("/api/supplier-lpos/:lpoId/items", async (req, res) => {
    try {
      const items = await storage.getSupplierLpoItems(req.params.lpoId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching supplier LPO items:", error);
      res.status(500).json({ message: "Failed to fetch supplier LPO items" });
    }
  });

  app.get("/api/supplier-lpo-items/:id", async (req, res) => {
    try {
      const item = await storage.getSupplierLpoItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Supplier LPO item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching supplier LPO item:", error);
      res.status(500).json({ message: "Failed to fetch supplier LPO item" });
    }
  });

  app.post("/api/supplier-lpo-items", async (req, res) => {
    try {
      const itemData = insertSupplierLpoItemSchema.parse(req.body);
      const item = await storage.createSupplierLpoItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier LPO item data", errors: error.errors });
      }
      console.error("Error creating supplier LPO item:", error);
      res.status(500).json({ message: "Failed to create supplier LPO item" });
    }
  });

  app.put("/api/supplier-lpo-items/:id", async (req, res) => {
    try {
      const itemData = insertSupplierLpoItemSchema.partial().parse(req.body);
      const item = await storage.updateSupplierLpoItem(req.params.id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier LPO item data", errors: error.errors });
      }
      console.error("Error updating supplier LPO item:", error);
      res.status(500).json({ message: "Failed to update supplier LPO item" });
    }
  });

  app.delete("/api/supplier-lpo-items/:id", async (req, res) => {
    try {
      await storage.deleteSupplierLpoItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier LPO item:", error);
      res.status(500).json({ message: "Failed to delete supplier LPO item" });
    }
  });

  app.post("/api/supplier-lpo-items/bulk", async (req, res) => {
    try {
      const itemsData = req.body.items;
      const validatedItems = z.array(insertSupplierLpoItemSchema).parse(itemsData);
      const items = await storage.bulkCreateSupplierLpoItems(validatedItems);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier LPO items data", errors: error.errors });
      }
      console.error("Error bulk creating supplier LPO items:", error);
      res.status(500).json({ message: "Failed to bulk create supplier LPO items" });
    }
  });
}
