import { Router } from "express";
import { ReceiptReturnsStorage } from "../storage/receipt-returns-storage";

const router = Router();
const storage = new ReceiptReturnsStorage();

// GET /api/receipt-returns
router.get("/", async (req, res) => {
  try {
    const returns = await storage.getAllReturns();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch receipt returns" });
  }
});

// GET /api/receipt-returns/:id
router.get("/:id", async (req, res) => {
  try {
    const returnItem = await storage.getReturnById(req.params.id);
    if (!returnItem) return res.status(404).json({ message: "Return not found" });
    res.json(returnItem);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch return" });
  }
});

// POST /api/receipt-returns
router.post("/", async (req, res) => {
  try {
    const returnItem = await storage.createReturn(req.body);
    res.json(returnItem);
  } catch (err) {
    res.status(500).json({ message: "Failed to create return" });
  }
});

// PUT /api/receipt-returns/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await storage.updateReturn(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Return not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update return" });
  }
});

// DELETE /api/receipt-returns/:id
router.delete("/:id", async (req, res) => {
  try {
    await storage.deleteReturn(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete return" });
  }
});

export default router;