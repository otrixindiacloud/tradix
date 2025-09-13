import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertCustomerAcceptanceSchema, 
  insertQuotationItemAcceptanceSchema 
} from "@shared/schema";
import { z } from "zod";

export function registerCustomerAcceptanceRoutes(app: Express) {
  // Customer Acceptance routes
  app.get("/api/customer-acceptances", async (req, res) => {
    try {
      const quotationId = req.query.quotationId as string;
      const acceptances = await storage.getCustomerAcceptances(quotationId);
      res.json(acceptances);
    } catch (error) {
      console.error("Error fetching customer acceptances:", error);
      res.status(500).json({ message: "Failed to fetch customer acceptances" });
    }
  });

  app.get("/api/customer-acceptances/:id", async (req, res) => {
    try {
      const acceptance = await storage.getCustomerAcceptance(req.params.id);
      if (!acceptance) {
        return res.status(404).json({ message: "Customer acceptance not found" });
      }
      res.json(acceptance);
    } catch (error) {
      console.error("Error fetching customer acceptance:", error);
      res.status(500).json({ message: "Failed to fetch customer acceptance" });
    }
  });

  app.post("/api/customer-acceptances", async (req, res) => {
    try {
      const acceptanceData = insertCustomerAcceptanceSchema.parse(req.body);
      const acceptance = await storage.createCustomerAcceptance(acceptanceData);
      res.status(201).json(acceptance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer acceptance data", errors: error.errors });
      }
      console.error("Error creating customer acceptance:", error);
      res.status(500).json({ message: "Failed to create customer acceptance" });
    }
  });

  app.put("/api/customer-acceptances/:id", async (req, res) => {
    try {
      const acceptanceData = insertCustomerAcceptanceSchema.partial().parse(req.body);
      const acceptance = await storage.updateCustomerAcceptance(req.params.id, acceptanceData);
      res.json(acceptance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer acceptance data", errors: error.errors });
      }
      console.error("Error updating customer acceptance:", error);
      res.status(500).json({ message: "Failed to update customer acceptance" });
    }
  });

  app.delete("/api/customer-acceptances/:id", async (req, res) => {
    try {
      await storage.deleteCustomerAcceptance(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer acceptance:", error);
      res.status(500).json({ message: "Failed to delete customer acceptance" });
    }
  });

  app.post("/api/customer-acceptances/supersede", async (req, res) => {
    try {
      const { quotationId } = req.body;
      if (!quotationId) {
        return res.status(400).json({ message: "Quotation ID is required" });
      }
      
      await storage.supersedeActiveAcceptances(quotationId);
      res.json({ message: "Active acceptances superseded successfully" });
    } catch (error) {
      console.error("Error superseding customer acceptances:", error);
      res.status(500).json({ message: "Failed to supersede customer acceptances" });
    }
  });

  // Quotation Item Acceptance routes
  app.get("/api/customer-acceptances/:acceptanceId/item-acceptances", async (req, res) => {
    try {
      const itemAcceptances = await storage.getQuotationItemAcceptances(req.params.acceptanceId);
      res.json(itemAcceptances);
    } catch (error) {
      console.error("Error fetching quotation item acceptances:", error);
      res.status(500).json({ message: "Failed to fetch quotation item acceptances" });
    }
  });

  app.post("/api/customer-acceptances/:acceptanceId/item-acceptances", async (req, res) => {
    try {
      const itemAcceptanceData = insertQuotationItemAcceptanceSchema.parse({
        ...req.body,
        customerAcceptanceId: req.params.acceptanceId,
      });
      const itemAcceptance = await storage.createQuotationItemAcceptance(itemAcceptanceData);
      res.status(201).json(itemAcceptance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation item acceptance data", errors: error.errors });
      }
      console.error("Error creating quotation item acceptance:", error);
      res.status(500).json({ message: "Failed to create quotation item acceptance" });
    }
  });

  app.post("/api/customer-acceptances/:acceptanceId/item-acceptances/bulk", async (req, res) => {
    try {
      const itemAcceptances = req.body.map((item: any) => 
        insertQuotationItemAcceptanceSchema.parse({
          ...item,
          customerAcceptanceId: req.params.acceptanceId,
        })
      );
      const results = await storage.bulkCreateQuotationItemAcceptances(itemAcceptances);
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation item acceptance data", errors: error.errors });
      }
      console.error("Error creating quotation item acceptances:", error);
      res.status(500).json({ message: "Failed to create quotation item acceptances" });
    }
  });
}
