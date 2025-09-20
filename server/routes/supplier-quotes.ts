import { Request, Response, type Express } from "express";
import { z } from "zod";
import { SupplierQuoteStorage } from "../storage/supplier-quote-storage";

// Validation schemas
const supplierQuoteSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  supplier: z.string().optional(),
  currency: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const supplierQuoteCreateSchema = z.object({
  supplierId: z.string().uuid(),
  requisitionId: z.string().uuid().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  requestDate: z.string(),
  validUntil: z.string(),
  paymentTerms: z.string(),
  deliveryTerms: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemDescription: z.string(),
    quantity: z.number().positive(),
    unitOfMeasure: z.string(),
    specification: z.string().optional(),
  }))
});

const supplierQuoteUpdateSchema = z.object({
  status: z.enum(["Draft", "Sent", "Received", "Under Review", "Approved", "Rejected", "Expired"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  responseDate: z.string().optional(),
  validUntil: z.string().optional(),
  totalAmount: z.string().optional(),
  currency: z.enum(["AED", "USD", "EUR", "GBP"]).optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  evaluationScore: z.number().min(0).max(10).optional(),
  competitiveRank: z.number().positive().optional(),
});

export function registerSupplierQuoteRoutes(app: Express) {
  
  // Get all supplier quotes with filtering
  app.get("/api/supplier-quotes", async (req: Request, res: Response) => {
    try {
      const params = supplierQuoteSearchSchema.parse(req.query);
      const quotes = await SupplierQuoteStorage.list(params);
      res.json({ data: quotes });
    } catch (error) {
      console.error("Error fetching supplier quotes:", error);
      res.status(500).json({ message: "Failed to fetch supplier quotes" });
    }
  });

  // Get supplier quote by ID
  app.get("/api/supplier-quotes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const quote = await SupplierQuoteStorage.getById(id);
      if (!quote) {
        return res.status(404).json({ message: "Supplier quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching supplier quote:", error);
      res.status(500).json({ message: "Failed to fetch supplier quote" });
    }
  });

  // Get supplier quote items
  app.get("/api/supplier-quotes/:id/items", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const items = await SupplierQuoteStorage.getItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching supplier quote items:", error);
      res.status(500).json({ message: "Failed to fetch supplier quote items" });
    }
  });

  // Create new supplier quote
  app.post("/api/supplier-quotes", async (req: Request, res: Response) => {
    try {
      const data = supplierQuoteCreateSchema.parse(req.body);
      const newQuote = await SupplierQuoteStorage.create(data);
      res.status(201).json(newQuote);
    } catch (error) {
      console.error("Error creating supplier quote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier quote" });
    }
  });

  // Update supplier quote
  app.patch("/api/supplier-quotes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = supplierQuoteUpdateSchema.parse(req.body);
      const updatedQuote = await SupplierQuoteStorage.update(id, data);
      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating supplier quote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier quote" });
    }
  });

  // Delete supplier quote
  app.delete("/api/supplier-quotes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await SupplierQuoteStorage.delete(id);
      res.json(result);
    } catch (error) {
      console.error("Error deleting supplier quote:", error);
      res.status(500).json({ message: "Failed to delete supplier quote" });
    }
  });

  // Approve supplier quote
  app.post("/api/supplier-quotes/:id/approve", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock response - replace with actual storage call
      const updatedQuote = {
        id,
        status: "Approved",
        updatedAt: new Date().toISOString()
      };

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error approving supplier quote:", error);
      res.status(500).json({ message: "Failed to approve supplier quote" });
    }
  });

  // Reject supplier quote
  app.post("/api/supplier-quotes/:id/reject", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock response - replace with actual storage call
      const updatedQuote = {
        id,
        status: "Rejected",
        updatedAt: new Date().toISOString()
      };

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error rejecting supplier quote:", error);
      res.status(500).json({ message: "Failed to reject supplier quote" });
    }
  });
}