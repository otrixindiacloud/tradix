import type { Express } from "express";
import { storage } from "../storage";

export function registerWorkflowRoutes(app: Express) {
  // Workflow validation endpoint
  app.get("/api/workflow/validate/:step/:entityId", async (req, res) => {
    try {
      const { step, entityId } = req.params;
      let canProceed = false;
      let message = "";

      switch (step) {
        case "quotation":
          const enquiry = await storage.getEnquiry(entityId);
          canProceed = enquiry?.status === "In Progress";
          message = canProceed ? "Can proceed to quotation" : "Enquiry must be in progress";
          break;
        
        case "acceptance":
          const quotation = await storage.getQuotation(entityId);
          canProceed = quotation?.status === "Sent";
          message = canProceed ? "Can proceed to acceptance" : "Quotation must be sent to customer";
          break;
        
        case "po-upload":
          const acceptedQuote = await storage.getQuotation(entityId);
          canProceed = acceptedQuote?.status === "Accepted";
          message = canProceed ? "Can proceed to PO upload" : "Quote must be accepted by customer";
          break;
        
        case "sales-order":
          const quotationWithPO = await storage.getQuotation(entityId);
          canProceed = quotationWithPO?.status === "Accepted";
          message = canProceed ? "Can proceed to sales order creation" : "PO document must be uploaded and validated";
          break;
        
        default:
          message = "Invalid workflow step";
      }

      res.json({ canProceed, message, step, entityId });
    } catch (error) {
      console.error("Error validating workflow step:", error);
      res.status(500).json({ message: "Failed to validate workflow step" });
    }
  });
}
