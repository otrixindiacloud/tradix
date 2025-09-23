import { Router } from "express";
import { StockIssuesStorage } from "../storage/stock-issues-storage";

const router = Router();
const storage = new StockIssuesStorage();

// GET /api/stock-issues
router.get("/", async (req, res) => {
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
    // Validate and convert issueDate
    if (payload.issueDate && typeof payload.issueDate === "string") {
      // Accept ISO or "YYYY-MM-DD HH:mm:ss+00" format
      let dateObj = null;
      if (/^\d{4}-\d{2}-\d{2} 00:00:00\+00$/.test(payload.issueDate)) {
        // Convert to ISO string
        dateObj = new Date(payload.issueDate.replace(" ", "T"));
      } else if (!isNaN(Date.parse(payload.issueDate))) {
        dateObj = new Date(payload.issueDate);
      }
      if (dateObj && !isNaN(dateObj.getTime())) {
        payload.issueDate = dateObj.toISOString();
      } else {
        payload.issueDate = null;
      }
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
    // Validate and convert issueDate
    if (payload.issueDate && typeof payload.issueDate === "string") {
      let dateObj = null;
      if (/^\d{4}-\d{2}-\d{2} 00:00:00\+00$/.test(payload.issueDate)) {
        dateObj = new Date(payload.issueDate.replace(" ", "T"));
      } else if (!isNaN(Date.parse(payload.issueDate))) {
        dateObj = new Date(payload.issueDate);
      }
      if (dateObj && !isNaN(dateObj.getTime())) {
        payload.issueDate = dateObj.toISOString();
      } else {
        payload.issueDate = null;
      }
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
