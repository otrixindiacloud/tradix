import type { Express } from "express";
import { storage } from "../storage";
import { insertEnquirySchema, updateEnquirySchema, insertEnquiryItemSchema } from "@shared/schema";
import { z } from "zod";

export function registerEnquiryRoutes(app: Express) {
  // Enquiry routes
  app.get("/api/enquiries", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Extract filter parameters
      const filters = {
        status: req.query.status as string,
        source: req.query.source as string,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const enquiries = await storage.getEnquiries(limit, offset, Object.keys(filters).length > 0 ? filters : undefined);
      res.json(enquiries);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      res.status(500).json({ message: "Failed to fetch enquiries" });
    }
  });

  app.get("/api/enquiries/:id", async (req, res) => {
    try {
      const enquiry = await storage.getEnquiry(req.params.id);
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
      res.json(enquiry);
    } catch (error) {
      console.error("Error fetching enquiry:", error);
      res.status(500).json({ message: "Failed to fetch enquiry" });
    }
  });

  app.post("/api/enquiries", async (req, res) => {
    try {
      console.log("Received enquiry data:", req.body);
      console.log("insertEnquirySchema shape:", insertEnquirySchema.shape);
      const enquiryData = insertEnquirySchema.parse(req.body);
      const enquiry = await storage.createEnquiry(enquiryData);
      res.status(201).json(enquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid enquiry data", errors: error.errors });
      }
      console.error("Error creating enquiry:", error);
      res.status(500).json({ message: "Failed to create enquiry" });
    }
  });

  app.put("/api/enquiries/:id", async (req, res) => {
    try {
      const enquiryData = updateEnquirySchema.parse(req.body);
      const enquiry = await storage.updateEnquiry(req.params.id, enquiryData);
      res.json(enquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid enquiry data", errors: error.errors });
      }
      console.error("Error updating enquiry:", error);
      res.status(500).json({ message: "Failed to update enquiry" });
    }
  });

  app.delete("/api/enquiries/:id", async (req, res) => {
    try {
      await storage.deleteEnquiry(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      res.status(500).json({ message: "Failed to delete enquiry" });
    }
  });

  // Enquiry Item routes
  app.get("/api/enquiries/:id/items", async (req, res) => {
    try {
      const items = await storage.getEnquiryItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching enquiry items:", error);
      res.status(500).json({ message: "Failed to fetch enquiry items" });
    }
  });

  app.get("/api/enquiry-items/:id", async (req, res) => {
    try {
      const item = await storage.getEnquiryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Enquiry item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching enquiry item:", error);
      res.status(500).json({ message: "Failed to fetch enquiry item" });
    }
  });

  app.post("/api/enquiry-items", async (req, res) => {
    try {
      const itemData = insertEnquiryItemSchema.parse(req.body);
      const item = await storage.createEnquiryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enquiry item data", errors: error.errors });
      }
      console.error("Error creating enquiry item:", error);
      res.status(500).json({ message: "Failed to create enquiry item" });
    }
  });

  app.post("/api/enquiry-items/bulk", async (req, res) => {
    try {
      const { items: itemsData } = req.body;
      const validatedItems = z.array(insertEnquiryItemSchema).parse(itemsData);
      const items = await storage.bulkCreateEnquiryItems(validatedItems);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enquiry items data", errors: error.errors });
      }
      console.error("Error creating enquiry items:", error);
      res.status(500).json({ message: "Failed to create enquiry items" });
    }
  });

  app.put("/api/enquiry-items/:id", async (req, res) => {
    try {
      const itemData = insertEnquiryItemSchema.partial().parse(req.body);
      const item = await storage.updateEnquiryItem(req.params.id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enquiry item data", errors: error.errors });
      }
      console.error("Error updating enquiry item:", error);
      res.status(500).json({ message: "Failed to update enquiry item" });
    }
  });

  app.delete("/api/enquiry-items/:id", async (req, res) => {
    try {
      await storage.deleteEnquiryItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enquiry item:", error);
      res.status(500).json({ message: "Failed to delete enquiry item" });
    }
  });
}
