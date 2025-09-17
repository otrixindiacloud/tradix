import { Request, Response, type Express } from "express";
import { z } from "zod";
import { storage } from "../storage";

// Validation schemas
const supplierQuoteSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  supplier: z.string().optional(),
  currency: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const supplierQuoteCreateSchema = z.object({
  supplierId: z.string().uuid(),
  requisitionId: z.string().uuid().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  requestDate: z.string(),
  validUntil: z.string(),
  paymentTerms: z.string(),
  deliveryTerms: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemDescription: z.string(),
    quantity: z.number().positive(),
    unitOfMeasure: z.string(),
    specification: z.string().optional(),
  }))
});

const supplierQuoteUpdateSchema = z.object({
  status: z.enum(["Draft", "Sent", "Received", "Under Review", "Approved", "Rejected", "Expired"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  responseDate: z.string().optional(),
  validUntil: z.string().optional(),
  totalAmount: z.string().optional(),
  currency: z.enum(["AED", "USD", "EUR", "GBP"]).optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  evaluationScore: z.number().min(0).max(10).optional(),
  competitiveRank: z.number().positive().optional(),
});

export function registerSupplierQuoteRoutes(app: Express) {
  
  // Get all supplier quotes with filtering
  app.get("/api/supplier-quotes", async (req: Request, res: Response) => {
    try {
      const params = supplierQuoteSearchSchema.parse(req.query);
      
      // Mock data for now - replace with actual storage call
      const mockQuotes = [
        {
          id: "sq-2024-001",
          quoteNumber: "SQ-2024-001",
          supplierId: "supplier-001",
          supplierName: "Tech Solutions LLC",
          requisitionId: "req-001",
          requisitionNumber: "REQ-2024-001",
          priority: "High",
          status: "Received",
          requestDate: "2024-01-15",
          responseDate: "2024-01-17",
          validUntil: "2024-02-15",
          totalAmount: "5200.00",
          currency: "AED",
          paymentTerms: "30 days",
          deliveryTerms: "FOB Dubai, 10-15 working days",
          notes: "Special discount for bulk order",
          evaluationScore: 8.5,
          competitiveRank: 2,
          itemCount: 3,
          isPreferredSupplier: true,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-17T14:30:00Z"
        },
        {
          id: "sq-2024-002",
          quoteNumber: "SQ-2024-002",
          supplierId: "supplier-002",
          supplierName: "Office Supplies Co",
          requisitionId: "req-002",
          requisitionNumber: "REQ-2024-002",
          priority: "Medium",
          status: "Under Review",
          requestDate: "2024-01-14",
          responseDate: "2024-01-16",
          validUntil: "2024-02-14",
          totalAmount: "2100.00",
          currency: "AED",
          paymentTerms: "15 days",
          deliveryTerms: "Free delivery within Dubai",
          evaluationScore: 9.2,
          competitiveRank: 1,
          itemCount: 5,
          isPreferredSupplier: false,
          createdAt: "2024-01-14T09:30:00Z",
          updatedAt: "2024-01-16T11:20:00Z"
        }
      ];

      let filteredQuotes = mockQuotes;

      // Apply filters
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredQuotes = filteredQuotes.filter(quote => 
          quote.quoteNumber.toLowerCase().includes(searchLower) ||
          quote.supplierName.toLowerCase().includes(searchLower)
        );
      }

      if (params.status) {
        filteredQuotes = filteredQuotes.filter(quote => 
          quote.status.toLowerCase() === params.status?.toLowerCase()
        );
      }

      if (params.priority) {
        filteredQuotes = filteredQuotes.filter(quote => 
          quote.priority.toLowerCase() === params.priority?.toLowerCase()
        );
      }

      // Pagination
      const total = filteredQuotes.length;
      const offset = (params.page - 1) * params.limit;
      const paginatedQuotes = filteredQuotes.slice(offset, offset + params.limit);

      res.json({
        data: paginatedQuotes,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          pages: Math.ceil(total / params.limit)
        }
      });
    } catch (error) {
      console.error("Error fetching supplier quotes:", error);
      res.status(500).json({ message: "Failed to fetch supplier quotes" });
    }
  });

  // Get supplier quote by ID
  app.get("/api/supplier-quotes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock data for now
      const mockQuotes: { [key: string]: any } = {
        "sq-2024-001": {
          id: "sq-2024-001",
          quoteNumber: "SQ-2024-001",
          supplierId: "supplier-001",
          supplierName: "Tech Solutions LLC",
          requisitionId: "req-001",
          requisitionNumber: "REQ-2024-001",
          priority: "High",
          status: "Received",
          requestDate: "2024-01-15",
          responseDate: "2024-01-17",
          validUntil: "2024-02-15",
          totalAmount: "5200.00",
          currency: "AED",
          paymentTerms: "30 days",
          deliveryTerms: "FOB Dubai, 10-15 working days",
          notes: "Special discount for bulk order. Installation service included.",
          evaluationScore: 8.5,
          competitiveRank: 2,
          itemCount: 3,
          isPreferredSupplier: true,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-17T14:30:00Z"
        },
        "sq-2024-002": {
          id: "sq-2024-002",
          quoteNumber: "SQ-2024-002",
          supplierId: "supplier-002",
          supplierName: "Office Supplies Co",
          requisitionId: "req-002",
          requisitionNumber: "REQ-2024-002",
          priority: "Medium",
          status: "Under Review",
          requestDate: "2024-01-14",
          responseDate: "2024-01-16",
          validUntil: "2024-02-14",
          totalAmount: "2100.00",
          currency: "AED",
          paymentTerms: "15 days",
          deliveryTerms: "Free delivery within Dubai",
          evaluationScore: 9.2,
          competitiveRank: 1,
          itemCount: 5,
          isPreferredSupplier: false,
          createdAt: "2024-01-14T09:30:00Z",
          updatedAt: "2024-01-16T11:20:00Z"
        }
      };

      const quote = mockQuotes[id];
      if (!quote) {
        return res.status(404).json({ message: "Supplier quote not found" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching supplier quote:", error);
      res.status(500).json({ message: "Failed to fetch supplier quote" });
    }
  });

  // Get supplier quote items
  app.get("/api/supplier-quotes/:id/items", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock data for quote items
      const mockItems: { [key: string]: any[] } = {
        "sq-2024-001": [
          {
            id: "item-001",
            quoteId: "sq-2024-001",
            itemDescription: "Dell PowerEdge R750 Server",
            quantity: 2,
            unitPrice: "2400.00",
            totalPrice: "4800.00",
            unitOfMeasure: "Units",
            specification: "32GB RAM, 2TB SSD, Dual processors",
            brand: "Dell",
            model: "PowerEdge R750",
            warranty: "3 years on-site",
            leadTime: "10-12 working days"
          },
          {
            id: "item-002",
            quoteId: "sq-2024-001",
            itemDescription: "Network Switch 48-port",
            quantity: 1,
            unitPrice: "400.00",
            totalPrice: "400.00",
            unitOfMeasure: "Unit",
            specification: "Gigabit Ethernet, managed switch",
            brand: "Cisco",
            model: "SG350-48",
            warranty: "2 years",
            leadTime: "5-7 working days"
          }
        ],
        "sq-2024-002": [
          {
            id: "item-003",
            quoteId: "sq-2024-002",
            itemDescription: "Office Desk - Executive",
            quantity: 3,
            unitPrice: "280.00",
            totalPrice: "840.00",
            unitOfMeasure: "Units",
            specification: "L-shaped, oak finish, 160cm",
            brand: "IKEA",
            warranty: "1 year",
            leadTime: "3-5 working days"
          },
          {
            id: "item-004",
            quoteId: "sq-2024-002",
            itemDescription: "Ergonomic Office Chair",
            quantity: 3,
            unitPrice: "220.00",
            totalPrice: "660.00",
            unitOfMeasure: "Units",
            specification: "Mesh back, adjustable height",
            brand: "Herman Miller",
            warranty: "2 years",
            leadTime: "2-3 working days"
          }
        ]
      };

      const items = mockItems[id] || [];
      res.json(items);
    } catch (error) {
      console.error("Error fetching supplier quote items:", error);
      res.status(500).json({ message: "Failed to fetch supplier quote items" });
    }
  });

  // Create new supplier quote
  app.post("/api/supplier-quotes", async (req: Request, res: Response) => {
    try {
      const data = supplierQuoteCreateSchema.parse(req.body);

      // Mock response - replace with actual storage call
      const newQuote = {
        id: `sq-${Date.now()}`,
        quoteNumber: `SQ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        ...data,
        status: "Draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json(newQuote);
    } catch (error) {
      console.error("Error creating supplier quote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier quote" });
    }
  });

  // Update supplier quote
  app.patch("/api/supplier-quotes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = supplierQuoteUpdateSchema.parse(req.body);

      // Mock response - replace with actual storage call
      const updatedQuote = {
        id,
        ...data,
        updatedAt: new Date().toISOString()
      };

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating supplier quote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier quote" });
    }
  });

  // Delete supplier quote
  app.delete("/api/supplier-quotes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock response - replace with actual storage call
      res.json({ message: "Supplier quote deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier quote:", error);
      res.status(500).json({ message: "Failed to delete supplier quote" });
    }
  });

  // Approve supplier quote
  app.post("/api/supplier-quotes/:id/approve", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock response - replace with actual storage call
      const updatedQuote = {
        id,
        status: "Approved",
        updatedAt: new Date().toISOString()
      };

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error approving supplier quote:", error);
      res.status(500).json({ message: "Failed to approve supplier quote" });
    }
  });

  // Reject supplier quote
  app.post("/api/supplier-quotes/:id/reject", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock response - replace with actual storage call
      const updatedQuote = {
        id,
        status: "Rejected",
        updatedAt: new Date().toISOString()
      };

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error rejecting supplier quote:", error);
      res.status(500).json({ message: "Failed to reject supplier quote" });
    }
  });
}