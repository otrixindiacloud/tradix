import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertInvoiceSchema,
  insertInvoiceItemSchema
} from "@shared/schema";
import { z } from "zod";
// Unified PDF utilities
import { generateInvoicePdf } from '../pdf/pdf-utils';
import { sendPdf } from '../utils/pdf-response';

export function registerInvoiceRoutes(app: Express) {
  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const { customerId, status, dateFrom, dateTo, limit, offset } = req.query;
      const filters = {
        customerId: customerId as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const invoices = await storage.getInvoices(filters);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get("/api/invoices/by-number/:invoiceNumber", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceByNumber(req.params.invoiceNumber);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice by number:", error);
      res.status(500).json({ message: "Failed to fetch invoice by number" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Invoice Items routes
  app.get("/api/invoices/:invoiceId/items", async (req, res) => {
    try {
      const items = await storage.getInvoiceItems(req.params.invoiceId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.get("/api/invoice-items/:id", async (req, res) => {
    try {
      const item = await storage.getInvoiceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching invoice item:", error);
      res.status(500).json({ message: "Failed to fetch invoice item" });
    }
  });

  app.post("/api/invoice-items", async (req, res) => {
    try {
      const itemData = insertInvoiceItemSchema.parse(req.body);
      const item = await storage.createInvoiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice item data", errors: error.errors });
      }
      console.error("Error creating invoice item:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  app.put("/api/invoice-items/:id", async (req, res) => {
    try {
      const itemData = insertInvoiceItemSchema.partial().parse(req.body);
      const item = await storage.updateInvoiceItem(req.params.id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice item data", errors: error.errors });
      }
      console.error("Error updating invoice item:", error);
      res.status(500).json({ message: "Failed to update invoice item" });
    }
  });

  app.delete("/api/invoice-items/:id", async (req, res) => {
    try {
      await storage.deleteInvoiceItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  app.post("/api/invoice-items/bulk", async (req, res) => {
    try {
      const itemsData = z.array(insertInvoiceItemSchema).parse(req.body);
      const items = await storage.bulkCreateInvoiceItems(itemsData);
      res.status(201).json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice items data", errors: error.errors });
      }
      console.error("Error bulk creating invoice items:", error);
      res.status(500).json({ message: "Failed to bulk create invoice items" });
    }
  });

  // Invoice management actions
  app.post("/api/invoices/:id/send", async (req, res) => {
    try {
      const { email } = req.body;
      const result = await storage.sendInvoice(req.params.id, email);
      res.json(result);
    } catch (error) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  app.post("/api/invoices/:id/mark-paid", async (req, res) => {
    try {
      const { paidAmount, paymentMethod, paymentReference, userId } = req.body;
      const invoice = await storage.markInvoicePaid(req.params.id, paidAmount, paymentMethod, paymentReference, userId);
      res.json(invoice);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  });

  app.post("/api/invoices/:id/cancel", async (req, res) => {
    try {
      const { reason } = req.body;
      // Cancel by updating status - storage may not have a dedicated cancelInvoice method
      const invoice = await storage.updateInvoice(req.params.id, { status: "Cancelled", notes: reason });
      res.json(invoice);
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      res.status(500).json({ message: "Failed to cancel invoice" });
    }
  });

  // Generate invoice from delivery
  app.post("/api/invoices/generate-from-delivery", async (req, res) => {
    try {
      const { deliveryId, invoiceType, userId } = req.body;
      const invoice = await storage.generateInvoiceFromDelivery(deliveryId, invoiceType, userId);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error generating invoice from delivery:", error);
      res.status(500).json({ message: "Failed to generate invoice from delivery" });
    }
  });

  // Generate proforma invoice
  app.post("/api/invoices/generate-proforma", async (req, res) => {
    try {
      const { salesOrderId, userId } = req.body;
      const invoice = await storage.generateProformaInvoice(salesOrderId, userId);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error generating proforma invoice:", error);
      res.status(500).json({ message: "Failed to generate proforma invoice" });
    }
  });

  // Update invoice currency (original route)
  app.put("/api/invoices/:id/currency", async (req, res) => {
    try {
      const { newCurrency, exchangeRate, userId } = req.body;
      const invoice = await storage.updateInvoiceCurrency(req.params.id, newCurrency, exchangeRate, userId);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice currency:", error);
      res.status(500).json({ message: "Failed to update invoice currency" });
    }
  });

  // Create invoice item (original route)
  app.post("/api/invoices/:invoiceId/items", async (req, res) => {
    try {
      const itemData = { ...req.body, invoiceId: req.params.invoiceId };
      const item = await storage.createInvoiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  // Generate PDF for invoice (unified service)
  app.get("/api/invoices/:id/pdf", async (req, res) => {
    try {
      const invoiceId = req.params.id;
      
      // Get invoice with all related data
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get invoice items with item details
      const invoiceItems = await storage.getInvoiceItems(invoiceId);
      
      // Enhance items with full item data for material specifications
      const enhancedItems = await Promise.all(
        invoiceItems.map(async (invoiceItem) => {
          let itemDetails = null;
          if (invoiceItem.itemId) {
            try {
              itemDetails = await storage.getItem(invoiceItem.itemId);
            } catch (error) {
              console.warn(`Could not fetch item details for ${invoiceItem.itemId}:`, error);
            }
          }
          return {
            ...invoiceItem,
            item: itemDetails
          };
        })
      );

      // Get customer information
      const customer = await storage.getCustomer(invoice.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get related sales order and delivery for additional context
      let salesOrder = null;
      let delivery = null;
      
      try {
        if (invoice.salesOrderId) {
          salesOrder = await storage.getSalesOrder(invoice.salesOrderId);
        }
        if (invoice.deliveryId) {
          delivery = await storage.getDelivery(invoice.deliveryId);
        }
      } catch (error) {
        console.warn('Could not fetch related order/delivery data:', error);
      }

      // Build PDF
      const result = generateInvoicePdf({
        invoice: invoice as any,
        items: enhancedItems as any,
        customer: customer as any,
        related: { salesOrder, delivery },
        mode: 'enhanced'
      });

  sendPdf(res, result);
    } catch (error) {
      console.error("Error generating comprehensive invoice PDF:", error);
      res.status(500).json({ 
        message: "Failed to generate invoice PDF", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}
