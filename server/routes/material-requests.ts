import { Router } from "express";
import { storage } from "../storage/index.js";
import { insertRequisitionSchema, insertRequisitionItemSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get all material requests
router.get("/", async (req, res) => {
  try {
    const { page = "1", limit = "20", status, priority, department, dateFrom, dateTo, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const filters: Record<string, any> = { status, priority, department, dateFrom, dateTo, search };
    Object.keys(filters).forEach(key => { if (filters[key] === undefined) delete filters[key]; });
    const requests = await storage.getRequisitions(limitNum, offset, filters);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch material requests", error });
  }
});

// Get single material request
router.get("/:id", async (req, res) => {
  try {
    const request = await storage.getRequisition(req.params.id);
    if (!request) return res.status(404).json({ message: "Material request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch material request", error });
  }
});

// Create new material request
router.post("/", async (req, res) => {
  try {
    const validatedData = insertRequisitionSchema.parse(req.body);
    const created = await storage.createRequisition(validatedData);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid material request data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create material request", error });
  }
});

// Update material request
router.put("/:id", async (req, res) => {
  try {
    const validatedData = insertRequisitionSchema.partial().parse(req.body);
    const updated = await storage.updateRequisition(req.params.id, validatedData);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid material request data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update material request", error });
  }
});

// Delete material request
router.delete("/:id", async (req, res) => {
  try {
    const success = await storage.deleteRequisition(req.params.id);
    if (!success) return res.status(404).json({ message: "Material request not found" });
    res.json({ message: "Material request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete material request", error });
  }
});

// Get items for a material request
router.get("/:id/items", async (req, res) => {
  try {
    const items = await storage.getRequisitionItems(req.params.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch request items", error });
  }
});

// Add item to a material request
router.post("/:id/items", async (req, res) => {
  try {
    const validatedData = insertRequisitionItemSchema.parse({ ...req.body, requisitionId: req.params.id });
    const created = await storage.createRequisitionItem(validatedData);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request item data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add request item", error });
  }
});

// Update item in a material request
router.put("/:id/items/:itemId", async (req, res) => {
  try {
    const validatedData = insertRequisitionItemSchema.partial().parse(req.body);
    const updated = await storage.updateRequisitionItem(req.params.itemId, validatedData);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request item data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update request item", error });
  }
});

// Delete item from a material request
router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const success = await storage.deleteRequisitionItem(req.params.itemId);
    if (!success) return res.status(404).json({ message: "Request item not found" });
    res.json({ message: "Request item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete request item", error });
  }
});

export default router;
