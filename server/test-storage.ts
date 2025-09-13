export class TestStorage {
  // Mock data
  private mockCustomers = [
    {
      id: "cust-1",
      name: "Al Rawi Trading LLC",
      email: "info@alrawi.com",
      phone: "+971-4-1234567",
      address: "Dubai Industrial City, UAE",
      customerType: "Wholesale" as const,
      classification: "Corporate" as const,
      taxId: "TRN123456789",
      creditLimit: "50000.00",
      paymentTerms: "Net 30",
      isActive: true,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z")
    },
    {
      id: "cust-2", 
      name: "Gulf Construction Co.",
      email: "procurement@gulfconstruction.ae",
      phone: "+971-2-9876543",
      address: "Abu Dhabi, UAE",
      customerType: "Retail" as const,
      classification: "Corporate" as const, 
      taxId: "TRN987654321",
      creditLimit: "25000.00",
      paymentTerms: "Net 15",
      isActive: true,
      createdAt: new Date("2024-02-01T14:30:00Z"),
      updatedAt: new Date("2024-02-01T14:30:00Z")
    }
  ];

  private mockQuotations: any[] = [
    {
      id: "quot-1",
      quoteNumber: "QT-2024-001",
      revision: 1,
      enquiryId: "enq-1",
      customerId: "cust-1",
      customerType: "Wholesale" as const,
      status: "Sent" as const,
      quoteDate: "2024-08-20",
      validUntil: "2024-09-20",
      subtotal: "1800.00",
      discountPercentage: "5.00",
      discountAmount: "90.00",
      taxAmount: "85.50",
      totalAmount: "1795.50",
      terms: "Payment due within 30 days of invoice date. Prices valid for 30 days.",
      notes: "Bulk order discount applied",
      approvalStatus: "Approved",
      requiredApprovalLevel: null,
      createdAt: new Date("2024-08-20T10:30:00Z")
    },
    {
      id: "quot-2",
      quoteNumber: "QT-2024-002",
      revision: 1,
      enquiryId: "enq-2", 
      customerId: "cust-2",
      customerType: "Retail" as const,
      status: "Draft" as const,
      quoteDate: "2024-08-25",
      validUntil: "2024-09-25", 
      subtotal: "950.75",
      discountPercentage: "0.00",
      discountAmount: "0.00",
      taxAmount: "47.54",
      totalAmount: "998.29",
      terms: "Payment due within 15 days of invoice date. Prices valid for 30 days.",
      notes: "Standard retail pricing",
      approvalStatus: "Pending",
      requiredApprovalLevel: "Manager",
      createdAt: new Date("2024-08-25T14:15:00Z")
    }
  ];

  private mockQuotationItems = [
    {
      id: "qitem-1",
      quotationId: "quot-1",
      supplierCode: "BMS-001", 
      barcode: "1234567890123",
      description: "Steel Reinforcement Bar 12mm x 6m",
      quantity: 20,
      costPrice: "45.50",
      markup: "40.00",
      unitPrice: "63.70",
      lineTotal: "1274.00",
      isAccepted: true,
      rejectionReason: "",
      notes: "Premium grade steel"
    },
    {
      id: "qitem-2",
      quotationId: "quot-1",
      supplierCode: "BMS-002",
      barcode: "1234567890124", 
      description: "Cement Portland 50kg Bag",
      quantity: 10,
      costPrice: "28.75", 
      markup: "40.00",
      unitPrice: "40.25",
      lineTotal: "402.50",
      isAccepted: true,
      rejectionReason: "",
      notes: "High strength cement"
    },
    {
      id: "qitem-3",
      quotationId: "quot-2",
      supplierCode: "BMS-001",
      barcode: "1234567890123",
      description: "Steel Reinforcement Bar 12mm x 6m", 
      quantity: 15,
      costPrice: "45.50",
      markup: "70.00",
      unitPrice: "77.35",
      lineTotal: "1160.25",
      isAccepted: false,
      rejectionReason: "Price too high",
      notes: ""
    }
  ];

  private mockEnquiries = [
    {
      id: "enq-1",
      enquiryNumber: "ENQ-2024-001",
      customerId: "cust-1",
      source: "Email",
      status: "New",
      targetDeliveryDate: "2024-09-15",
      notes: "Urgent construction project requirement",
      createdAt: new Date("2024-08-15T09:00:00Z")
    },
    {
      id: "enq-2", 
      enquiryNumber: "ENQ-2024-002",
      customerId: "cust-2",
      source: "Phone",
      status: "In Progress",
      targetDeliveryDate: "2024-09-30",
      notes: "Standard retail order",
      createdAt: new Date("2024-08-20T11:30:00Z")
    }
  ];

  // Implement required methods with mock data
  async getQuotations(limit?: number, offset?: number, filters?: any) {
    console.log('[TEST] Returning mock quotations');
    return this.mockQuotations.slice(offset || 0, (offset || 0) + (limit || 100));
  }

  async getQuotation(id: string) {
    console.log(`[TEST] Getting quotation: ${id}`);
    return this.mockQuotations.find(q => q.id === id);
  }

  async createQuotation(quotation: any) {
    console.log('[TEST] Creating quotation:', quotation);
    const newQuotation = {
      id: `quot-${Date.now()}`,
      quoteNumber: `QT-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      revision: 1,
      enquiryId: quotation.enquiryId || "",
      customerId: quotation.customerId,
      customerType: quotation.customerType,
      status: quotation.status || "Draft",
      quoteDate: quotation.quoteDate,
      validUntil: quotation.validUntil,
      subtotal: quotation.subtotal || "0.00",
      discountPercentage: quotation.discountPercentage || "0.00", 
      discountAmount: quotation.discountAmount || "0.00",
      taxAmount: quotation.taxAmount || "0.00",
      totalAmount: quotation.totalAmount || "0.00",
      terms: quotation.terms || "",
      notes: quotation.notes || "",
      approvalStatus: quotation.approvalStatus || "Pending",
      requiredApprovalLevel: quotation.requiredApprovalLevel,
      createdAt: new Date()
    };
    this.mockQuotations.push(newQuotation);
    return newQuotation;
  }

  async updateQuotation(id: string, quotation: any) {
    console.log(`[TEST] Updating quotation: ${id}`, quotation);
    const index = this.mockQuotations.findIndex(q => q.id === id);
    if (index === -1) throw new Error("Quotation not found");
    
    this.mockQuotations[index] = { ...this.mockQuotations[index], ...quotation };
    return this.mockQuotations[index];
  }

  async deleteQuotation(id: string) {
    console.log(`[TEST] Deleting quotation: ${id}`);
    const index = this.mockQuotations.findIndex(q => q.id === id);
    if (index !== -1) {
      this.mockQuotations.splice(index, 1);
    }
  }

  async getQuotationItems(quotationId: string) {
    console.log(`[TEST] Getting quotation items for: ${quotationId}`);
    return this.mockQuotationItems.filter(item => item.quotationId === quotationId);
  }

  async createQuotationItem(item: any) {
    console.log('[TEST] Creating quotation item:', item);
    const newItem = {
      id: `qitem-${Date.now()}`,
      quotationId: item.quotationId,
      supplierCode: item.supplierCode,
      barcode: item.barcode,
      description: item.description,
      quantity: item.quantity,
      costPrice: item.costPrice,
      markup: item.markup,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      isAccepted: item.isAccepted || false,
      rejectionReason: item.rejectionReason || "",
      notes: item.notes || ""
    };
    this.mockQuotationItems.push(newItem);
    return newItem;
  }

  async updateQuotationItem(id: string, item: any) {
    console.log(`[TEST] Updating quotation item: ${id}`, item);
    const index = this.mockQuotationItems.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Quotation item not found");
    
    this.mockQuotationItems[index] = { ...this.mockQuotationItems[index], ...item };
    return this.mockQuotationItems[index];
  }

  async deleteQuotationItem(id: string) {
    console.log(`[TEST] Deleting quotation item: ${id}`);
    const index = this.mockQuotationItems.findIndex(i => i.id === id);
    if (index !== -1) {
      this.mockQuotationItems.splice(index, 1);
    }
  }

  async getCustomers() {
    console.log('[TEST] Returning mock customers');
    return this.mockCustomers;
  }

  async getCustomer(id: string) {
    console.log(`[TEST] Getting customer: ${id}`);
    return this.mockCustomers.find(c => c.id === id);
  }

  async getDashboardStats() {
    console.log('[TEST] Returning mock dashboard stats');
    return {
      activeEnquiries: 2,
      pendingQuotes: 1,
      activeOrders: 3,
      monthlyRevenue: 15750.25
    };
  }

  async generateQuotationFromEnquiry(enquiryId: string, userId: string) {
    console.log(`[TEST] Generating quotation from enquiry: ${enquiryId}`);
    
    // Find the enquiry
    const enquiry = this.mockEnquiries.find(e => e.id === enquiryId);
    if (!enquiry) {
      throw new Error(`Enquiry ${enquiryId} not found`);
    }

    // Get customer details
    const customer = this.mockCustomers.find(c => c.id === enquiry.customerId);
    if (!customer) {
      throw new Error(`Customer ${enquiry.customerId} not found`);
    }

    // Mock enquiry items (would normally come from database)
    const mockEnquiryItems = [
      {
        id: "eitem-1",
        description: "Steel Reinforcement Bar 12mm x 6m",
        quantity: 15,
        unitPrice: "45.50",
        supplierCode: "BMS-001",
        barcode: "1234567890123"
      },
      {
        id: "eitem-2", 
        description: "Cement Portland 50kg Bag",
        quantity: 8,
        unitPrice: "28.75",
        supplierCode: "BMS-002",
        barcode: "1234567890124"
      }
    ];

    // Calculate pricing based on customer type
    const markup = customer.customerType === "Retail" ? 70 : 40;
    
    const quotationItems = mockEnquiryItems.map(item => {
      const costPrice = parseFloat(item.unitPrice);
      const unitPrice = costPrice * (1 + markup / 100);
      const lineTotal = unitPrice * item.quantity;

      return {
        id: `qitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        quotationId: "", // Will be set after quotation creation
        supplierCode: item.supplierCode,
        barcode: item.barcode,
        description: item.description,
        quantity: item.quantity,
        costPrice: item.unitPrice,
        markup: markup.toString(),
        unitPrice: unitPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
        isAccepted: true,
        rejectionReason: "",
        notes: ""
      };
    });

    // Calculate totals
    const subtotal = quotationItems.reduce((sum, item) => sum + parseFloat(item.lineTotal), 0);
    const discountPercentage = 5; // 5% discount
    const discountAmount = subtotal * (discountPercentage / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * 0.05; // 5% tax
    const totalAmount = taxableAmount + taxAmount;

    // Generate quotation
    const newQuotation = {
      id: `quot-${Date.now()}`,
      quoteNumber: `QT-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      revision: 1,
      enquiryId: enquiryId,
      customerId: enquiry.customerId,
      customerType: customer.customerType,
      status: "Draft" as const,
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      subtotal: subtotal.toFixed(2),
      discountPercentage: discountPercentage.toString(),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      terms: "Payment due within 30 days of invoice date. Prices valid for 30 days.",
      notes: `Auto-generated from enquiry ${enquiry.enquiryNumber}. ${enquiry.notes || ""}`,
      approvalStatus: totalAmount > 10000 ? "Pending" : "Approved",
      requiredApprovalLevel: totalAmount > 10000 ? "Manager" : null,
      createdAt: new Date()
    };

    // Update quotation items with quotation ID
    quotationItems.forEach(item => {
      item.quotationId = newQuotation.id;
    });

    // Add to mock data
    this.mockQuotations.push(newQuotation);
    this.mockQuotationItems.push(...quotationItems);

    // Update enquiry status to "Quoted"
    const enquiryIndex = this.mockEnquiries.findIndex(e => e.id === enquiryId);
    if (enquiryIndex !== -1) {
      this.mockEnquiries[enquiryIndex].status = "Quoted";
    }

    console.log(`[TEST] Generated quotation ${newQuotation.id} with ${quotationItems.length} items`);
    return newQuotation;
  }

  async getEnquiries() {
    console.log('[TEST] Returning mock enquiries');
    return this.mockEnquiries;
  }

  async getEnquiry(id: string) {
    console.log(`[TEST] Getting enquiry: ${id}`);
    return this.mockEnquiries.find(e => e.id === id);
  }

  async getSalesOrders() {
    return [];
  }

  // Stub implementations for other methods
  [key: string]: any;
  
  constructor() {
    return new Proxy(this, {
      get(target: any, prop: string) {
        if (prop in target) {
          return target[prop];
        }
        // Return a default async function for any missing methods
        return async (...args: any[]) => {
          console.log(`[TEST] Called unimplemented method: ${prop}`, args);
          return [];
        };
      }
    });
  }
}
