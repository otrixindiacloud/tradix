import type { Express } from "express";
import { storage } from "../storage";
import { insertSupplierSchema } from "@shared/schema";
import { z } from "zod";

export function registerSupplierRoutes(app: Express) {
  // Get all suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Get single supplier
  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Create supplier
  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Update supplier
  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, supplierData);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  // Delete supplier (soft delete)
  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });
}
