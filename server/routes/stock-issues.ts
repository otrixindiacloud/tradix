import { Router } from "express";

console.log("[DEBUG] stock-issues route loaded");
import { StockIssuesStorage } from "../storage/stock-issues-storage";

const router = Router();
const storage = new StockIssuesStorage();

// GET /api/stock-issues
router.get("/", async (req, res) => {
  console.log("[DEBUG] GET /api/stock-issues called");
  try {
    const issues = await storage.getAllStockIssues();
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stock issues" });
  }
});

// GET /api/stock-issues/:id
router.get("/:id", async (req, res) => {
  try {
    const issue = await storage.getStockIssueById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stock issue" });
  }
});

// POST /api/stock-issues
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    // Robustly handle issueDate
    console.log("[DEBUG][POST] Received issueDate:", payload.issueDate, "Type:", typeof payload.issueDate);
    if (!payload.issueDate) {
      payload.issueDate = null;
    } else if (typeof payload.issueDate === "string") {
      const dateObj = new Date(payload.issueDate);
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        payload.issueDate = dateObj.toISOString();
      } else {
        console.warn("[WARN][POST] Invalid date string for issueDate:", payload.issueDate);
        payload.issueDate = null;
      }
    } else if (payload.issueDate instanceof Date) {
      if (!isNaN(payload.issueDate.getTime()) && typeof payload.issueDate.toISOString === "function") {
        payload.issueDate = payload.issueDate.toISOString();
      } else {
        console.warn("[WARN][POST] Invalid Date object for issueDate:", payload.issueDate);
        payload.issueDate = null;
      }
    } else {
      console.warn("[WARN][POST] Unexpected type for issueDate:", payload.issueDate, typeof payload.issueDate);
      payload.issueDate = null;
    }
    const issue = await storage.createStockIssue(payload);
    res.json(issue);
  } catch (err) {
    console.error("Stock Issue Creation Error:", err, "Payload:", req.body);
    const errorMessage = (err instanceof Error && err.message) ? err.message : String(err);
    res.status(500).json({ message: "Failed to create stock issue", error: errorMessage });
  }
});

// PUT /api/stock-issues/:id
router.put("/:id", async (req, res) => {
  try {
    const payload = { ...req.body };
    // Robustly handle issueDate
    console.log("[DEBUG][PUT] Received issueDate:", payload.issueDate, "Type:", typeof payload.issueDate);
    if (!payload.issueDate) {
      payload.issueDate = null;
    } else if (typeof payload.issueDate === "string") {
      const dateObj = new Date(payload.issueDate);
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        payload.issueDate = dateObj.toISOString();
      } else {
        console.warn("[WARN][PUT] Invalid date string for issueDate:", payload.issueDate);
        payload.issueDate = null;
      }
    } else if (payload.issueDate instanceof Date) {
      if (!isNaN(payload.issueDate.getTime()) && typeof payload.issueDate.toISOString === "function") {
        payload.issueDate = payload.issueDate.toISOString();
      } else {
        console.warn("[WARN][PUT] Invalid Date object for issueDate:", payload.issueDate);
        payload.issueDate = null;
      }
    } else {
      console.warn("[WARN][PUT] Unexpected type for issueDate:", payload.issueDate, typeof payload.issueDate);
      payload.issueDate = null;
    }
    const updated = await storage.updateStockIssue(req.params.id, payload);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update stock issue" });
  }
});

// DELETE /api/stock-issues/:id
router.delete("/:id", async (req, res) => {
  try {
    await storage.deleteStockIssue(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete stock issue" });
  }
});

export default router;
