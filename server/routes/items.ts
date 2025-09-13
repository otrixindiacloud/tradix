import type { Express } from "express";
import { storage } from "../storage";

export function registerItemRoutes(app: Express) {
  // Item routes
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/barcode/:barcode", async (req, res) => {
    try {
      const item = await storage.getItemByBarcode(req.params.barcode);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item by barcode:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });
}
