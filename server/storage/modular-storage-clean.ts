import { IStorage } from './interfaces.js';
import { UserStorage } from './user-storage.js';
import { CustomerStorage } from './customer-storage.js';
import { SupplierStorage } from './supplier-storage.js';
import { ItemStorage } from './item-storage.js';
import { EnquiryStorage } from './enquiry-storage.js';
import { AuditStorage } from './audit-storage.js';
import { QuotationStorage } from './quotation-storage.js';
import { DeliveryStorage } from './delivery-storage.js';
import { SalesOrderStorage } from './sales-order-storage.js';

// Import the existing DatabaseStorage as a fallback for operations
// not yet modularized
// Note: Temporarily commented out while we complete modularization
// import { DatabaseStorage } from "../storage.js";
import { BaseStorage } from './base.js';

// Comprehensive modular storage that delegates to specific modules
// This version implements all operations without fallback dependency
export class ModularStorage extends BaseStorage implements IStorage {
  private userStorage: UserStorage;
  private customerStorage: CustomerStorage;
  private supplierStorage: SupplierStorage;
  private itemStorage: ItemStorage;
  private enquiryStorage: EnquiryStorage;
  private auditStorage: AuditStorage;
  private quotationStorage: QuotationStorage;
  private deliveryStorage: DeliveryStorage;
  private salesOrderStorage: SalesOrderStorage;

  constructor() {
    super();
    this.userStorage = new UserStorage();
    this.customerStorage = new CustomerStorage();
    this.supplierStorage = new SupplierStorage();
    this.itemStorage = new ItemStorage();
    this.enquiryStorage = new EnquiryStorage();
    this.auditStorage = new AuditStorage();
    this.quotationStorage = new QuotationStorage();
    this.deliveryStorage = new DeliveryStorage();
    this.salesOrderStorage = new SalesOrderStorage();

    // Create proxy to forward any missing methods with helpful error messages
    return new Proxy(this, {
      get(target: any, prop: string | symbol, receiver: any) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        // For unimplemented methods, return a function that throws a helpful error
        return () => {
          throw new Error(`Method '${String(prop)}' not yet implemented in modular storage. Please implement it in the appropriate storage module.`);
        };
      }
    });
  }

  // User operations - delegate to UserStorage
  async getUser(id: string) {
    return this.userStorage.getUser(id);
  }

  async createUser(user: Parameters<UserStorage['createUser']>[0]) {
    return this.userStorage.createUser(user);
  }

  // Customer operations - delegate to CustomerStorage
  async getCustomers(limit?: number, offset?: number) {
    return this.customerStorage.getCustomers(limit, offset);
  }

  async getCustomer(id: string) {
    return this.customerStorage.getCustomer(id);
  }

  async createCustomer(customer: Parameters<CustomerStorage['createCustomer']>[0]) {
    return this.customerStorage.createCustomer(customer);
  }

  async updateCustomer(id: string, customer: Parameters<CustomerStorage['updateCustomer']>[1]) {
    return this.customerStorage.updateCustomer(id, customer);
  }

  // Supplier operations - delegate to SupplierStorage
  async getSuppliers() {
    return this.supplierStorage.getSuppliers();
  }

  async getSupplier(id: string) {
    return this.supplierStorage.getSupplier(id);
  }

  async createSupplier(supplier: Parameters<SupplierStorage['createSupplier']>[0]) {
    return this.supplierStorage.createSupplier(supplier);
  }

  async updateSupplier(id: string, supplier: Parameters<SupplierStorage['updateSupplier']>[1]) {
    return this.supplierStorage.updateSupplier(id, supplier);
  }

  async deleteSupplier(id: string) {
    return this.supplierStorage.deleteSupplier(id);
  }

  // Item operations - delegate to ItemStorage
  async getItems() {
    return this.itemStorage.getItems();
  }

  async getItem(id: string) {
    return this.itemStorage.getItem(id);
  }

  async getItemByBarcode(barcode: string) {
    return this.itemStorage.getItemByBarcode(barcode);
  }

  async createItem(item: Parameters<ItemStorage['createItem']>[0]) {
    return this.itemStorage.createItem(item);
  }

  // Enquiry operations - delegate to EnquiryStorage
  async getEnquiries(limit?: number, offset?: number, filters?: Parameters<EnquiryStorage['getEnquiries']>[2]) {
    return this.enquiryStorage.getEnquiries(limit, offset, filters);
  }

  async getEnquiry(id: string) {
    return this.enquiryStorage.getEnquiry(id);
  }

  async createEnquiry(enquiry: Parameters<EnquiryStorage['createEnquiry']>[0]) {
    return this.enquiryStorage.createEnquiry(enquiry);
  }

  async updateEnquiry(id: string, enquiry: Parameters<EnquiryStorage['updateEnquiry']>[1]) {
    return this.enquiryStorage.updateEnquiry(id, enquiry);
  }

  async deleteEnquiry(id: string) {
    return this.enquiryStorage.deleteEnquiry(id);
  }

  async getEnquiryItems(enquiryId: string) {
    return this.enquiryStorage.getEnquiryItems(enquiryId);
  }

  async getEnquiryItem(id: string) {
    return this.enquiryStorage.getEnquiryItem(id);
  }

  async createEnquiryItem(enquiryItem: Parameters<EnquiryStorage['createEnquiryItem']>[0]) {
    return this.enquiryStorage.createEnquiryItem(enquiryItem);
  }

  async updateEnquiryItem(id: string, enquiryItem: Parameters<EnquiryStorage['updateEnquiryItem']>[1]) {
    return this.enquiryStorage.updateEnquiryItem(id, enquiryItem);
  }

  async deleteEnquiryItem(id: string) {
    return this.enquiryStorage.deleteEnquiryItem(id);
  }

  async bulkCreateEnquiryItems(enquiryItems: Parameters<EnquiryStorage['bulkCreateEnquiryItems']>[0]) {
    return this.enquiryStorage.bulkCreateEnquiryItems(enquiryItems);
  }

  // Quotation operations - delegate to QuotationStorage
  async getQuotations(limit?: number, offset?: number, filters?: Parameters<QuotationStorage['getQuotations']>[2]) {
    return this.quotationStorage.getQuotations(limit, offset, filters);
  }

  async getQuotation(id: string) {
    return this.quotationStorage.getQuotation(id);
  }

  async createQuotation(quotation: Parameters<QuotationStorage['createQuotation']>[0]) {
    return this.quotationStorage.createQuotation(quotation);
  }

  async updateQuotation(id: string, quotation: Parameters<QuotationStorage['updateQuotation']>[1]) {
    return this.quotationStorage.updateQuotation(id, quotation);
  }

  async deleteQuotation(id: string) {
    return this.quotationStorage.deleteQuotation(id);
  }

  async generateQuotationFromEnquiry(enquiryId: string, userId: string) {
    return this.quotationStorage.generateQuotationFromEnquiry(enquiryId, userId);
  }

  async createQuotationRevision(originalId: string, revisionData: any, userId: string) {
    return this.quotationStorage.createQuotationRevision(originalId, revisionData, userId);
  }

  async getQuotationRevisions(originalId: string) {
    return this.quotationStorage.getQuotationRevisions(originalId);
  }

  async getQuotationHistory(quotationId: string) {
    return this.quotationStorage.getQuotationHistory(quotationId);
  }

  async getQuotationItems(quotationId: string) {
    return this.quotationStorage.getQuotationItems(quotationId);
  }

  async createQuotationItem(item: Parameters<QuotationStorage['createQuotationItem']>[0]) {
    return this.quotationStorage.createQuotationItem(item);
  }

  async updateQuotationItem(id: string, item: Parameters<QuotationStorage['updateQuotationItem']>[1]) {
    return this.quotationStorage.updateQuotationItem(id, item);
  }

  async deleteQuotationItem(id: string) {
    return this.quotationStorage.deleteQuotationItem(id);
  }

  async getQuotationApprovals(quotationId: string) {
    return this.quotationStorage.getQuotationApprovals(quotationId);
  }

  async createQuotationApproval(approval: Parameters<QuotationStorage['createQuotationApproval']>[0]) {
    return this.quotationStorage.createQuotationApproval(approval);
  }

  // Audit operations - delegate to AuditStorage  
  async logAuditEvent(
    entityType: string,
    entityId: string,
    action: string,
    userId?: string,
    oldData?: any,
    newData?: any
  ) {
    return this.auditStorage.logAuditEvent(entityType, entityId, action, userId, oldData, newData);
  }

  // Sales Order operations - delegate to SalesOrderStorage
  async getSalesOrders(limit?: number, offset?: number, filters?: any) {
    return this.salesOrderStorage.getSalesOrders(limit, offset, filters);
  }

  async getSalesOrder(id: string) {
    return this.salesOrderStorage.getSalesOrder(id);
  }

  async createSalesOrder(salesOrder: any) {
    return this.salesOrderStorage.createSalesOrder(salesOrder);
  }

  async updateSalesOrder(id: string, salesOrder: any) {
    return this.salesOrderStorage.updateSalesOrder(id, salesOrder);
  }

  async deleteSalesOrder(id: string) {
    return this.salesOrderStorage.deleteSalesOrder(id);
  }

  async createSalesOrderFromQuotation(quotationId: string, userId?: string) {
    return this.salesOrderStorage.createSalesOrderFromQuotation(quotationId, userId);
  }

  async createAmendedSalesOrder(parentOrderId: string, reason: string, userId?: string) {
    return this.salesOrderStorage.createAmendedSalesOrder(parentOrderId, reason, userId);
  }

  async validateCustomerLpo(id: string, validationData: any) {
    return this.salesOrderStorage.validateCustomerLpo(id, validationData);
  }

  // Sales Order Item operations
  async getSalesOrderItems(salesOrderId: string) {
    return this.salesOrderStorage.getSalesOrderItems(salesOrderId);
  }

  async getSalesOrderItem(id: string) {
    return this.salesOrderStorage.getSalesOrderItem(id);
  }

  async createSalesOrderItem(item: any) {
    return this.salesOrderStorage.createSalesOrderItem(item);
  }

  async updateSalesOrderItem(id: string, item: any) {
    return this.salesOrderStorage.updateSalesOrderItem(id, item);
  }

  async deleteSalesOrderItem(id: string) {
    return this.salesOrderStorage.deleteSalesOrderItem(id);
  }

  async bulkCreateSalesOrderItems(items: any[]) {
    return this.salesOrderStorage.bulkCreateSalesOrderItems(items);
  }

  async getApprovalRules() {
    console.warn('getApprovalRules: Using stub implementation - should be moved to ApprovalStorage');
    return [];
  }

  async getCustomerAcceptances(quotationId?: string) {
    console.warn('getCustomerAcceptances: Using stub implementation - should be moved to AcceptanceStorage');
    return [];
  }

  async getCustomerAcceptance(id: string) {
    console.warn('getCustomerAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
    return undefined;
  }

  async createCustomerAcceptance(acceptance: any) {
    console.warn('createCustomerAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
    return {
      id: this.generateId(),
      ...acceptance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateCustomerAcceptance(id: string, acceptance: any) {
    console.warn('updateCustomerAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
    return {
      id,
      ...acceptance,
      updatedAt: new Date(),
    };
  }

  async deleteCustomerAcceptance(id: string) {
    console.warn('deleteCustomerAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
  }

  async supersedeActiveAcceptances(quotationId: string) {
    console.warn('supersedeActiveAcceptances: Using stub implementation - should be moved to AcceptanceStorage');
    // In a real implementation, this would update all active acceptances for the quotation to "Superseded" status
  }

  async getQuotationItemAcceptances(customerAcceptanceId: string) {
    console.warn('getQuotationItemAcceptances: Using stub implementation - should be moved to AcceptanceStorage');
    return [];
  }

  async getQuotationItemAcceptance(id: string) {
    console.warn('getQuotationItemAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
    return undefined;
  }

  async createQuotationItemAcceptance(itemAcceptance: any) {
    console.warn('createQuotationItemAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
    return {
      id: this.generateId(),
      ...itemAcceptance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateQuotationItemAcceptance(id: string, itemAcceptance: any) {
    console.warn('updateQuotationItemAcceptance: Using stub implementation - should be moved to AcceptanceStorage');
    return {
      id,
      ...itemAcceptance,
      updatedAt: new Date(),
    };
  }

  async bulkCreateQuotationItemAcceptances(itemAcceptances: any[]) {
    console.warn('bulkCreateQuotationItemAcceptances: Using stub implementation - should be moved to AcceptanceStorage');
    return itemAcceptances.map(item => ({
      id: this.generateId(),
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async getSupplierLpos(...args: any[]) {
    console.warn('getSupplierLpos: Using stub implementation - should be moved to SupplierLpoStorage');
    return [];
  }

  async getPurchaseOrders(quotationId?: string) {
    console.warn('getPurchaseOrders: Using stub implementation - should be moved to PurchaseOrderStorage');
    return [];
  }

  async getInventoryItems(...args: any[]) {
    console.warn('getInventoryItems: Using stub implementation - should be moved to InventoryStorage');
    return [];
  }

  async getGoodsReceiptHeaders(...args: any[]) {
    console.warn('getGoodsReceiptHeaders: Using stub implementation - should be moved to GoodsReceiptStorage');
    return [];
  }

  // Delivery Storage Methods
  async getDeliveries(filters?: any) {
    return this.deliveryStorage.getDeliveries(filters);
  }

  async getDelivery(id: string) {
    return this.deliveryStorage.getDelivery(id);
  }

  async getDeliveryByNumber(deliveryNumber: string) {
    return this.deliveryStorage.getDeliveryByNumber(deliveryNumber);
  }

  async createDelivery(delivery: any) {
    return this.deliveryStorage.createDelivery(delivery);
  }

  async updateDelivery(id: string, delivery: any) {
    return this.deliveryStorage.updateDelivery(id, delivery);
  }

  async deleteDelivery(id: string) {
    return this.deliveryStorage.deleteDelivery(id);
  }

  async startDeliveryPicking(deliveryId: string, userId: string) {
    return this.deliveryStorage.startDeliveryPicking(deliveryId, userId);
  }

  async completeDeliveryPicking(deliveryId: string, userId: string, notes?: string) {
    return this.deliveryStorage.completeDeliveryPicking(deliveryId, userId, notes);
  }

  async confirmDelivery(deliveryId: string, confirmedBy: string, signature?: string) {
    return this.deliveryStorage.confirmDelivery(deliveryId, confirmedBy, signature);
  }

  // Delivery Item operations
  async getDeliveryItems(deliveryId: string) {
    return this.deliveryStorage.getDeliveryItems(deliveryId);
  }

  async getDeliveryItem(id: string) {
    return this.deliveryStorage.getDeliveryItem(id);
  }

  async createDeliveryItem(item: any) {
    return this.deliveryStorage.createDeliveryItem(item);
  }

  async updateDeliveryItem(id: string, item: any) {
    return this.deliveryStorage.updateDeliveryItem(id, item);
  }

  async deleteDeliveryItem(id: string) {
    return this.deliveryStorage.deleteDeliveryItem(id);
  }

  async bulkCreateDeliveryItems(items: any[]) {
    return this.deliveryStorage.bulkCreateDeliveryItems(items);
  }

  // Delivery Picking Session operations
  async getDeliveryPickingSessions(deliveryId: string) {
    return this.deliveryStorage.getDeliveryPickingSessions(deliveryId);
  }

  async getDeliveryPickingSession(id: string) {
    return this.deliveryStorage.getDeliveryPickingSession(id);
  }

  async createDeliveryPickingSession(session: any) {
    return this.deliveryStorage.createDeliveryPickingSession(session);
  }

  async updateDeliveryPickingSession(id: string, session: any) {
    return this.deliveryStorage.updateDeliveryPickingSession(id, session);
  }

  async completePickingSession(sessionId: string) {
    return this.deliveryStorage.completePickingSession(sessionId);
  }

  // Delivery Picked Item operations
  async getDeliveryPickedItems(sessionId: string) {
    return this.deliveryStorage.getDeliveryPickedItems(sessionId);
  }

  async getDeliveryPickedItem(id: string) {
    return this.deliveryStorage.getDeliveryPickedItem(id);
  }

  async createDeliveryPickedItem(item: any) {
    return this.deliveryStorage.createDeliveryPickedItem(item);
  }

  async updateDeliveryPickedItem(id: string, item: any) {
    return this.deliveryStorage.updateDeliveryPickedItem(id, item);
  }

  async verifyPickedItem(itemId: string, userId: string) {
    return this.deliveryStorage.verifyPickedItem(itemId, userId);
  }

  // Barcode scanning and verification
  async verifyItemBarcode(barcode: string, expectedItemId?: string) {
    return this.deliveryStorage.verifyItemBarcode(barcode, expectedItemId);
  }

  async scanItemForPicking(barcode: string, sessionId: string, quantity: number, userId: string, storageLocation?: string) {
    return this.deliveryStorage.scanItemForPicking(barcode, sessionId, quantity, userId, storageLocation);
  }

  async getAvailableItemsForPicking(deliveryId: string) {
    return this.deliveryStorage.getAvailableItemsForPicking(deliveryId);
  }

  async getInvoices(...args: any[]) {
    console.warn('getInvoices: Using stub implementation - should be moved to InvoiceStorage');
    return [];
  }

  async getCreditNotes(...args: any[]) {
    console.warn('getCreditNotes: Using stub implementation - should be moved to CreditNoteStorage');
    return [];
  }

  async getSupplierLpoBacklog() {
    console.warn('getSupplierLpoBacklog: Using stub implementation - should be moved to ReportingStorage');
    return [];
  }

  async getCustomerOrderBacklog() {
    console.warn('getCustomerOrderBacklog: Using stub implementation - should be moved to ReportingStorage');
    return [];
  }

  async getDashboardStats() {
    try {
      // Get counts from different modules
      const [enquiries, quotations, salesOrders] = await Promise.all([
        this.enquiryStorage.getEnquiries(100, 0),
        this.quotationStorage.getQuotations(100, 0),
        this.salesOrderStorage.getSalesOrders(100, 0)
      ]);

      // Calculate stats
      const activeEnquiries = enquiries.filter((e: any) => e.status === 'New' || e.status === 'In Progress').length;
      const pendingQuotes = quotations.filter((q: any) => q.status === 'Draft' || q.status === 'Sent').length;
      const activeOrders = salesOrders.filter((o: any) => o.status === 'Confirmed' || o.status === 'Processing' || o.status === 'Shipped').length;
      
      // Calculate monthly revenue (simplified)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = salesOrders
        .filter((o: any) => {
          const orderDate = new Date(o.orderDate);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, order: any) => sum + (Number(order.totalAmount) || 0), 0);

      return {
        activeEnquiries,
        pendingQuotes,
        activeOrders,
        monthlyRevenue
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      return {
        activeEnquiries: 0,
        pendingQuotes: 0,
        activeOrders: 0,
        monthlyRevenue: 0
      };
    }
  }

  async getStockMovements(filters?: {
    movementType?: string;
    itemId?: string;
    location?: string;
    limit?: number;
    offset?: number;
  }) {
    console.warn('getStockMovements: Using stub implementation - should be moved to InventoryStorage');
    return [];
  }

  async getStockMovement(id: string) {
    console.warn('getStockMovement: Using stub implementation - should be moved to InventoryStorage');
    return null;
  }

  async createStockMovement(movement: any) {
    console.warn('createStockMovement: Using stub implementation - should be moved to InventoryStorage');
    return {
      id: 'movement-' + Date.now(),
      ...movement,
      createdAt: new Date().toISOString(),
    };
  }

  async getCustomerStats() {
    try {
      const customers = await this.customerStorage.getCustomers(1000, 0);
      
      const stats = {
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c: any) => c.isActive).length,
        retailCustomers: customers.filter((c: any) => c.customerType === 'Retail').length,
        wholesaleCustomers: customers.filter((c: any) => c.customerType === 'Wholesale').length,
        totalCreditLimit: customers.reduce((sum: number, c: any) => sum + (Number(c.creditLimit) || 0), 0),
        averageCreditLimit: 0
      };
      
      stats.averageCreditLimit = stats.totalCustomers > 0 ? stats.totalCreditLimit / stats.totalCustomers : 0;
      
      return stats;
    } catch (error) {
      console.error('Error calculating customer stats:', error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        retailCustomers: 0,
        wholesaleCustomers: 0,
        totalCreditLimit: 0,
        averageCreditLimit: 0
      };
    }
  }
}
