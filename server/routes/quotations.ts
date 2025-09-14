import type { Express } from "express";
import { storage } from "../storage";
import { insertQuotationSchema, insertQuotationItemSchema } from "@shared/schema";
import { validateUserIdOrDefault } from "@shared/utils/uuid";
import { getAttributingUserId } from '../utils/user';
import { z } from "zod";
import { pdfService } from "../pdf-service";

export function registerQuotationRoutes(app: Express) {
  // Quotation routes
  app.get("/api/quotations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const filters = {
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string,
      };
      
      const quotations = await storage.getQuotations(limit, offset, filters);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.post("/api/quotations", async (req, res) => {
    try {
      const quotationData = insertQuotationSchema.parse(req.body);
      const quotation = await storage.createQuotation(quotationData);
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.put("/api/quotations/:id", async (req, res) => {
    try {
      const quotationData = insertQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(req.params.id, quotationData);
      res.json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }
      console.error("Error updating quotation:", error);
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", async (req, res) => {
    try {
      await storage.deleteQuotation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Generate quotation from enquiry
  app.post("/api/quotations/generate/:enquiryId", async (req, res) => {
    try {
      // Use the system user ID for now - in real app, get from auth
  const userId = req.resolvedUserId || validateUserIdOrDefault(req.body.userId); 
      console.log("Generating quotation for enquiry:", req.params.enquiryId);
      const quotation = await storage.generateQuotationFromEnquiry(req.params.enquiryId, userId);
      console.log("Quotation generated successfully:", quotation.id);
      res.status(201).json(quotation);
    } catch (error) {
      console.error("Error generating quotation:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      res.status(500).json({ 
        message: "Failed to generate quotation from enquiry", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Quotation revision routes
  app.post("/api/quotations/:id/revisions", async (req, res) => {
    try {
  const userId = req.resolvedUserId || validateUserIdOrDefault(req.body.userId);
      const revisionData = req.body; // Should include revisionReason and other fields
      
      if (!revisionData.revisionReason) {
        return res.status(400).json({ message: "Revision reason is required" });
      }

      const newRevision = await storage.createQuotationRevision(req.params.id, revisionData, userId);
      res.status(201).json(newRevision);
    } catch (error) {
      console.error("Error creating quotation revision:", error);
      res.status(500).json({ message: "Failed to create quotation revision" });
    }
  });

  app.get("/api/quotations/:id/revisions", async (req, res) => {
    try {
      const revisions = await storage.getQuotationRevisions(req.params.id);
      res.json(revisions);
    } catch (error) {
      console.error("Error fetching quotation revisions:", error);
      res.status(500).json({ message: "Failed to fetch quotation revisions" });
    }
  });

  app.get("/api/quotations/:id/history", async (req, res) => {
    try {
      const history = await storage.getQuotationHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching quotation history:", error);
      res.status(500).json({ message: "Failed to fetch quotation history" });
    }
  });

  // Quotation Items routes
  app.get("/api/quotations/:id/items", async (req, res) => {
    try {
      console.log("Fetching quotation items for quotation ID:", req.params.id);
      const items = await storage.getQuotationItems(req.params.id);
      console.log("Found quotation items:", items.length);
      res.json(items);
    } catch (error) {
      console.error("Error fetching quotation items:", error);
      res.status(500).json({ message: "Failed to fetch quotation items" });
    }
  });

  app.post("/api/quotations/:id/items", async (req, res) => {
    try {
      console.log("DEBUG: Attempting to create quotation item with body:", req.body);
      console.log("DEBUG: Quotation ID from params:", req.params.id);
      
      const itemData = insertQuotationItemSchema.parse({
        ...req.body,
        quotationId: req.params.id,
      });
      
      console.log("DEBUG: Parsed item data:", itemData);
      const item = await storage.createQuotationItem(itemData);
      console.log("DEBUG: Created item:", item);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("DEBUG: Zod validation error:", error.errors);
        return res.status(400).json({ 
          message: "Invalid quotation item data", 
          errors: error.errors,
          received: req.body 
        });
      }
      console.error("DEBUG: Other error creating quotation item:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        message: "Failed to create quotation item", 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.put("/api/quotation-items/:id", async (req, res) => {
    try {
      // For updates we allow partial fields; manually pick allowable keys and validate each if present
      const allowedKeys = ["description","quantity","costPrice","markup","unitPrice","lineTotal","isAccepted","rejectionReason","notes"] as const;
      const partial: any = {};
      for (const key of allowedKeys) {
        if (key in req.body) {
          partial[key] = (req.body as any)[key];
        }
      }
      // Basic minimal validation: ensure numeric fields if provided are numbers
      ["quantity"].forEach(k => { if (partial[k] !== undefined) partial[k] = Number(partial[k]); });
      const item = await storage.updateQuotationItem(req.params.id, partial);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation item data", errors: error.errors });
      }
      console.error("Error updating quotation item:", error);
      res.status(500).json({ message: "Failed to update quotation item" });
    }
  });

  app.delete("/api/quotation-items/:id", async (req, res) => {
    try {
      await storage.deleteQuotationItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quotation item:", error);
      res.status(500).json({ message: "Failed to delete quotation item" });
    }
  });

  // Generate quotation from enquiry
  app.post("/api/quotations/from-enquiry/:enquiryId", async (req, res) => {
    try {
  const enquiryId = req.params.enquiryId;
  const userId = getAttributingUserId(req);
      
      console.log("Received request to generate quotation from enquiry:", { enquiryId, userId });
      
      const quotation = await storage.generateQuotationFromEnquiry(enquiryId, userId);
      res.status(201).json(quotation);
    } catch (error) {
      console.error("Error generating quotation from enquiry:", error);
      res.status(500).json({ 
        message: "Failed to generate quotation from enquiry",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate PDF for quotation
  app.get("/api/quotations/:id/pdf", async (req, res) => {
    try {
      const quotationId = req.params.id;
      
      // Get quotation with items and customer
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      const items = await storage.getQuotationItems(quotationId);
      const customer = await storage.getCustomer(quotation.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Generate PDF
      const pdfBuffer = pdfService.generateQuotationPDF({
        quotation,
        items,
        customer,
        companyInfo: {
          name: "Golden Tag WLL",
          address: "Your Company Address\nCity, State, ZIP\nCountry",
          phone: "+1 (555) 123-4567",
          email: "info@goldentag.com"
        }
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.quoteNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating quotation PDF:", error);
      res.status(500).json({ message: "Failed to generate quotation PDF" });
    }
  });
}
