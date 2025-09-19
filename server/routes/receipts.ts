import { Router } from "express";
import { ReceiptsStorage } from "../storage/receipts-storage";

const router = Router();
const storage = new ReceiptsStorage();

// GET /api/receipts
router.get("/", async (req, res) => {
  try {
    const receipts = await storage.getAllReceipts();
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch receipts" });
  }
});

// POST /api/receipts
router.post("/", async (req, res) => {
  try {
    const receipt = await storage.createReceipt(req.body);
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ message: "Failed to create receipt" });
  }
});

export default router;
