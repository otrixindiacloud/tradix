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
    const body = req.body || {};
    // Map frontend verbose statuses to compact internal values (schema uses plain varchar with default 'pending')
    const statusMap: Record<string, string> = {
      Draft: "pending",
      "Pending Approval": "pending",
      Approved: "approved",
      Returned: "returned",
      Credited: "credited",
    };
    const normalizedStatus = statusMap[body.status] || body.status;
    // Whitelist only valid columns for supplier_returns
    const payload: any = {
      returnNumber: body.returnNumber,
      supplierId: body.supplierId,
      goodsReceiptId: body.goodsReceiptId,
      returnReason: body.returnReason,
      notes: body.notes,
    };
    if (body.returnDate) {
      // Accept 'YYYY-MM-DD' and convert to Date
      payload.returnDate = /\d{4}-\d{2}-\d{2}$/.test(body.returnDate)
        ? new Date(body.returnDate)
        : body.returnDate;
    }
    if (normalizedStatus) payload.status = normalizedStatus;

    // Basic validation
    const missing = ["returnNumber", "returnReason"].filter(k => !payload[k]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }
    const returnItem = await storage.createReturn(payload);
    res.json(returnItem);
  } catch (err: any) {
    console.error("Failed to create return:", err?.code, err?.message, err);
    if (err?.code === "23505") { // unique_violation
      return res.status(400).json({ message: "Return number already exists" });
    }
    res.status(500).json({ message: "Failed to create return" });
  }
});

// GET /api/receipt-returns/:id/items - list items for a return
router.get("/:id/items", async (req, res) => {
  try {
    const items = await storage.getReturnItems(req.params.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch return items" });
  }
});

// POST /api/receipt-returns/:id/items - create item for a return
router.post("/:id/items", async (req, res) => {
  try {
    const supplierReturnId = req.params.id;
    const body = req.body || {};
    // Map client payload (itemId) to inventoryItemId expected by schema
    const data = {
      supplierReturnId,
      inventoryItemId: body.itemId || body.inventoryItemId,
      quantityReturned: body.quantityReturned || body.returnQuantity || 0,
      unitCost: body.unitCost ?? 0,
      totalCost: body.totalCost ?? 0,
      returnReason: body.returnReason,
      conditionNotes: body.conditionNotes,
    };
    const created = await storage.createReturnItem(data);
    res.json(created);
  } catch (err) {
    res.status(500).json({ message: "Failed to create return item" });
  }
});

// PUT /api/receipt-returns/:id
router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    // Map frontend verbose statuses to compact internal values (align with POST logic)
    const statusMap: Record<string, string> = {
      Draft: "pending",
      "Pending Approval": "pending",
      Approved: "approved",
      Returned: "returned",
      Credited: "credited",
    };
    // Whitelist only updatable columns
    const allowed = [
      "returnNumber",
      "supplierId",
      "goodsReceiptId",
      "returnReason",
      "notes",
      "status",
      "returnDate",
      "totalReturnValue",
      "debitNoteNumber",
      "debitNoteGenerated",
    ];
    const payload: any = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        payload[k] = body[k];
      }
    }
    if (body.status) payload.status = statusMap[body.status] || body.status;
    if (body.returnDate === "" || body.returnDate === null) {
      // Remove empty date to avoid invalid update
      delete payload.returnDate;
    } else if (typeof body.returnDate === "string" && /\d{4}-\d{2}-\d{2}$/.test(body.returnDate)) {
      try { payload.returnDate = new Date(body.returnDate); } catch { /* ignore */ }
    }
    // Remove empty string fields that could violate NOT NULL / type constraints
    Object.keys(payload).forEach(k => {
      if (payload[k] === "") delete payload[k];
      if (payload[k] === undefined || payload[k] === null) delete payload[k];
    });
    // Basic safeguard: never allow id overwrite
    delete payload.id;
    // Debug logging (can be removed later)
    if (process.env.NODE_ENV !== "production") {
      console.log("[PUT /api/receipt-returns/:id] payload", req.params.id, payload);
    }
    const updated = await storage.updateReturn(req.params.id, payload);
    if (!updated) return res.status(404).json({ message: "Return not found" });
    res.json(updated);
  } catch (err) {
    console.error("Failed to update return (server route)", err);
    // Drizzle / PG error code for unique violation
    // @ts-ignore
    if (err?.code === "23505") {
      return res.status(400).json({ message: "Return number already exists" });
    }
    if (process.env.NODE_ENV !== "production") {
      // @ts-ignore
      return res.status(500).json({ message: "Failed to update return", code: err?.code, detail: err?.detail, error: String(err) });
    }
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