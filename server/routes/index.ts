import type { Express } from "express";
import { createServer, type Server } from "http";

// Import all route modules
import { registerDashboardRoutes } from "./dashboard";
import { registerCustomerRoutes } from "./customers";
import { registerSupplierRoutes } from "./suppliers";
import { registerItemRoutes } from "./items";
import { registerEnquiryRoutes } from "./enquiries";
import { registerQuotationRoutes } from "./quotations";
import { registerApprovalRoutes } from "./approvals";
import { registerCustomerAcceptanceRoutes } from "./customer-acceptance";
import { registerPurchaseOrderRoutes } from "./purchase-orders";
import { registerSalesOrderRoutes } from "./sales-orders";
import { registerSupplierLpoRoutes } from "./supplier-lpo";
import { registerWorkflowRoutes } from "./workflow";
import { registerInventoryRoutes } from "./inventory";
import { registerPricingRoutes } from "./pricing";
import { registerAIRoutes } from "./ai";
import { registerDeliveryRoutes } from "./delivery";
import { registerInvoiceRoutes } from "./invoice";
import { registerCreditNoteRoutes } from "./credit-notes";
import { registerGoodsReceiptRoutes } from "./goods-receipt";
import { registerUtilityRoutes } from "./utility";
import auditRoutes from "./audit";
import userRoutes from "./users";
import settingsRoutes from "./settings";
import { analyticsRouter } from "./analytics";
import { registerRecentActivitiesRoutes } from "./recent-activities";
import { registerAuthRoutes } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all route modules
  registerDashboardRoutes(app);
  registerCustomerRoutes(app);
  registerSupplierRoutes(app);
  registerItemRoutes(app);
  registerEnquiryRoutes(app);
  registerQuotationRoutes(app);
  registerApprovalRoutes(app);
  registerCustomerAcceptanceRoutes(app);
  registerPurchaseOrderRoutes(app);
  registerSalesOrderRoutes(app);
  registerSupplierLpoRoutes(app);
  registerWorkflowRoutes(app);
  registerInventoryRoutes(app);
  registerPricingRoutes(app);
  registerAIRoutes(app);
  registerDeliveryRoutes(app);
  registerInvoiceRoutes(app);
  registerCreditNoteRoutes(app);
  registerGoodsReceiptRoutes(app);
  registerUtilityRoutes(app);
  registerRecentActivitiesRoutes(app);
  registerAuthRoutes(app);

  // Register administration routes
  app.use("/api/audit", auditRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/analytics", analyticsRouter);

  const httpServer = createServer(app);
  return httpServer;
}
