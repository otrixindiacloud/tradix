import { IStorage } from './interfaces.js';
import { UserStorage } from './user-storage.js';
import { CustomerStorage } from './customer-storage.js';
import { SupplierStorage } from './supplier-storage.js';
import { ItemStorage } from './item-storage.js';
import { EnquiryStorage } from './enquiry-storage.js';
import { AuditStorage } from './audit-storage.js';
import { QuotationStorage } from './quotation-storage.js';
import { SalesOrderStorage } from './sales-order-storage.js';

// Import the existing DatabaseStorage as a fallback for operations
// not yet modularized
import { DatabaseStorage } from "../storage.js";
import { BaseStorage } from './base.js';

// Temporary class that implements the full IStorage interface
// by delegating modularized operations to their respective modules
// and falling back to DatabaseStorage for operations not yet modularized
export class ModularStorage extends BaseStorage implements IStorage {
  private userStorage: UserStorage;
  private customerStorage: CustomerStorage;
  private supplierStorage: SupplierStorage;
  private itemStorage: ItemStorage;
  private enquiryStorage: EnquiryStorage;
  private auditStorage: AuditStorage;
  private quotationStorage: QuotationStorage;
  private salesOrderStorage: SalesOrderStorage;
  private fallbackStorage: DatabaseStorage;

  constructor() {
    super();
    this.userStorage = new UserStorage();
    this.customerStorage = new CustomerStorage();
    this.supplierStorage = new SupplierStorage();
    this.itemStorage = new ItemStorage();
    this.enquiryStorage = new EnquiryStorage();
    this.auditStorage = new AuditStorage();
    this.quotationStorage = new QuotationStorage();
    this.salesOrderStorage = new SalesOrderStorage();
    this.fallbackStorage = new DatabaseStorage();
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

  // Enquiry Item operations - delegate to EnquiryStorage
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

  // Fallback operations - delegate to DatabaseStorage for operations not yet modularized
  async getApprovalRules() {
    return this.fallbackStorage.getApprovalRules();
  }

  async createApprovalRule(rule: Parameters<DatabaseStorage['createApprovalRule']>[0]) {
    return this.fallbackStorage.createApprovalRule(rule);
  }

  async updateApprovalRule(id: string, rule: Parameters<DatabaseStorage['updateApprovalRule']>[1]) {
    return this.fallbackStorage.updateApprovalRule(id, rule);
  }

  async deleteApprovalRule(id: string) {
    return this.fallbackStorage.deleteApprovalRule(id);
  }

  async determineRequiredApprovalLevel(quotation: Parameters<DatabaseStorage['determineRequiredApprovalLevel']>[0]) {
    return this.fallbackStorage.determineRequiredApprovalLevel(quotation);
  }

  async getCustomerAcceptances(quotationId?: string) {
    return this.fallbackStorage.getCustomerAcceptances(quotationId);
  }

  async getCustomerAcceptance(id: string) {
    return this.fallbackStorage.getCustomerAcceptance(id);
  }

  async createCustomerAcceptance(acceptance: Parameters<DatabaseStorage['createCustomerAcceptance']>[0]) {
    return this.fallbackStorage.createCustomerAcceptance(acceptance);
  }

  async updateCustomerAcceptance(id: string, acceptance: Parameters<DatabaseStorage['updateCustomerAcceptance']>[1]) {
    return this.fallbackStorage.updateCustomerAcceptance(id, acceptance);
  }

  async deleteCustomerAcceptance(id: string) {
    return this.fallbackStorage.deleteCustomerAcceptance(id);
  }

  async getPurchaseOrders(quotationId?: string) {
    return this.fallbackStorage.getPurchaseOrders(quotationId);
  }

  async getPurchaseOrder(id: string) {
    return this.fallbackStorage.getPurchaseOrder(id);
  }

  async createPurchaseOrder(po: Parameters<DatabaseStorage['createPurchaseOrder']>[0]) {
    return this.fallbackStorage.createPurchaseOrder(po);
  }

  async updatePurchaseOrder(id: string, po: Parameters<DatabaseStorage['updatePurchaseOrder']>[1]) {
    return this.fallbackStorage.updatePurchaseOrder(id, po);
  }

  async deletePurchaseOrder(id: string) {
    return this.fallbackStorage.deletePurchaseOrder(id);
  }

  async validatePurchaseOrder(id: string, validationData: Parameters<DatabaseStorage['validatePurchaseOrder']>[1]) {
    return this.fallbackStorage.validatePurchaseOrder(id, validationData);
  }

  async getQuotationItemAcceptances(customerAcceptanceId: string) {
    return this.fallbackStorage.getQuotationItemAcceptances(customerAcceptanceId);
  }

  async getQuotationItemAcceptance(id: string) {
    return this.fallbackStorage.getQuotationItemAcceptance(id);
  }

  async createQuotationItemAcceptance(itemAcceptance: Parameters<DatabaseStorage['createQuotationItemAcceptance']>[0]) {
    return this.fallbackStorage.createQuotationItemAcceptance(itemAcceptance);
  }

  async updateQuotationItemAcceptance(id: string, itemAcceptance: Parameters<DatabaseStorage['updateQuotationItemAcceptance']>[1]) {
    return this.fallbackStorage.updateQuotationItemAcceptance(id, itemAcceptance);
  }

  async bulkCreateQuotationItemAcceptances(itemAcceptances: Parameters<DatabaseStorage['bulkCreateQuotationItemAcceptances']>[0]) {
    return this.fallbackStorage.bulkCreateQuotationItemAcceptances(itemAcceptances);
  }

  async getPoLineItems(purchaseOrderId: string) {
    return this.fallbackStorage.getPoLineItems(purchaseOrderId);
  }

  async createPoLineItem(lineItem: Parameters<DatabaseStorage['createPoLineItem']>[0]) {
    return this.fallbackStorage.createPoLineItem(lineItem);
  }

  async updatePoLineItem(id: string, lineItem: Parameters<DatabaseStorage['updatePoLineItem']>[1]) {
    return this.fallbackStorage.updatePoLineItem(id, lineItem);
  }

  async bulkCreatePoLineItems(lineItems: Parameters<DatabaseStorage['bulkCreatePoLineItems']>[0]) {
    return this.fallbackStorage.bulkCreatePoLineItems(lineItems);
  }

  async getAcceptanceConfirmations(customerAcceptanceId: string) {
    return this.fallbackStorage.getAcceptanceConfirmations(customerAcceptanceId);
  }

  async createAcceptanceConfirmation(confirmation: Parameters<DatabaseStorage['createAcceptanceConfirmation']>[0]) {
    return this.fallbackStorage.createAcceptanceConfirmation(confirmation);
  }

  // Sales Order operations - delegate to SalesOrderStorage
  async getSalesOrders(limit?: number, offset?: number, filters?: Parameters<SalesOrderStorage['getSalesOrders']>[2]) {
    return this.salesOrderStorage.getSalesOrders(limit, offset, filters);
  }

  async getSalesOrder(id: string) {
    return this.salesOrderStorage.getSalesOrder(id);
  }

  async createSalesOrder(salesOrder: Parameters<SalesOrderStorage['createSalesOrder']>[0]) {
    return this.salesOrderStorage.createSalesOrder(salesOrder);
  }

  async updateSalesOrder(id: string, salesOrder: Parameters<SalesOrderStorage['updateSalesOrder']>[1]) {
    return this.salesOrderStorage.updateSalesOrder(id, salesOrder);
  }

  async deleteSalesOrder(id: string) {
    return this.salesOrderStorage.deleteSalesOrder(id);
  }

  async createSalesOrderFromQuotation(quotationId: string, customerAcceptanceId?: string, userId?: string) {
    return this.salesOrderStorage.createSalesOrderFromQuotation(quotationId, userId);
  }

  async createAmendedSalesOrder(parentOrderId: string, reason: string, userId?: string) {
    return this.salesOrderStorage.createAmendedSalesOrder(parentOrderId, reason, userId);
  }

  async validateCustomerLpo(id: string, validationData: Parameters<SalesOrderStorage['validateCustomerLpo']>[1]) {
    return this.salesOrderStorage.validateCustomerLpo(id, validationData);
  }

  async getSalesOrderItems(salesOrderId: string) {
    return this.salesOrderStorage.getSalesOrderItems(salesOrderId);
  }

  async getSalesOrderItem(id: string) {
    return this.salesOrderStorage.getSalesOrderItem(id);
  }

  async createSalesOrderItem(item: Parameters<SalesOrderStorage['createSalesOrderItem']>[0]) {
    return this.salesOrderStorage.createSalesOrderItem(item);
  }

  async updateSalesOrderItem(id: string, item: Parameters<SalesOrderStorage['updateSalesOrderItem']>[1]) {
    return this.salesOrderStorage.updateSalesOrderItem(id, item);
  }

  async deleteSalesOrderItem(id: string) {
    return this.salesOrderStorage.deleteSalesOrderItem(id);
  }

  async bulkCreateSalesOrderItems(items: Parameters<SalesOrderStorage['bulkCreateSalesOrderItems']>[0]) {
    return this.salesOrderStorage.bulkCreateSalesOrderItems(items);
  }

  // All remaining operations delegate to fallback storage
  async getSupplierLpos(...args: Parameters<DatabaseStorage['getSupplierLpos']>) {
    return this.fallbackStorage.getSupplierLpos(...args);
  }

  async getSupplierLpo(id: string) {
    return this.fallbackStorage.getSupplierLpo(id);
  }

  async createSupplierLpo(supplierLpo: Parameters<DatabaseStorage['createSupplierLpo']>[0]) {
    return this.fallbackStorage.createSupplierLpo(supplierLpo);
  }

  async updateSupplierLpo(id: string, supplierLpo: Parameters<DatabaseStorage['updateSupplierLpo']>[1]) {
    return this.fallbackStorage.updateSupplierLpo(id, supplierLpo);
  }

  async deleteSupplierLpo(id: string) {
    return this.fallbackStorage.deleteSupplierLpo(id);
  }

  async createSupplierLposFromSalesOrders(salesOrderIds: string[], groupBy: string, userId?: string) {
    return this.fallbackStorage.createSupplierLposFromSalesOrders(salesOrderIds, groupBy, userId);
  }

  async createAmendedSupplierLpo(parentLpoId: string, reason: string, amendmentType: string, userId?: string) {
    return this.fallbackStorage.createAmendedSupplierLpo(parentLpoId, reason, amendmentType, userId);
  }

  async submitForApproval(id: string, userId: string) {
    return this.fallbackStorage.submitForApproval(id, userId);
  }

  async approveSupplierLpo(id: string, userId: string, notes?: string) {
    return this.fallbackStorage.approveSupplierLpo(id, userId, notes);
  }

  async rejectSupplierLpo(id: string, userId: string, notes: string) {
    return this.fallbackStorage.rejectSupplierLpo(id, userId, notes);
  }

  async sendToSupplier(id: string, userId: string) {
    return this.fallbackStorage.sendToSupplier(id, userId);
  }

  async confirmBySupplier(id: string, confirmationReference?: string) {
    return this.fallbackStorage.confirmBySupplier(id, confirmationReference);
  }

  async getSupplierLpoBacklog() {
    return this.fallbackStorage.getSupplierLpoBacklog();
  }

  async getCustomerOrderBacklog() {
    return this.fallbackStorage.getCustomerOrderBacklog();
  }

  async getSupplierLpoItems(supplierLpoId: string) {
    return this.fallbackStorage.getSupplierLpoItems(supplierLpoId);
  }

  async getSupplierLpoItem(id: string) {
    return this.fallbackStorage.getSupplierLpoItem(id);
  }

  async createSupplierLpoItem(item: Parameters<DatabaseStorage['createSupplierLpoItem']>[0]) {
    return this.fallbackStorage.createSupplierLpoItem(item);
  }

  async updateSupplierLpoItem(id: string, item: Parameters<DatabaseStorage['updateSupplierLpoItem']>[1]) {
    return this.fallbackStorage.updateSupplierLpoItem(id, item);
  }

  async deleteSupplierLpoItem(id: string) {
    return this.fallbackStorage.deleteSupplierLpoItem(id);
  }

  async bulkCreateSupplierLpoItems(items: Parameters<DatabaseStorage['bulkCreateSupplierLpoItems']>[0]) {
    return this.fallbackStorage.bulkCreateSupplierLpoItems(items);
  }

  // All remaining operations use fallback pattern
  async getInventoryItems(...args: any[]) {
    return (this.fallbackStorage as any).getInventoryItems(...args);
  }

  async getInventoryItem(id: string) {
    return (this.fallbackStorage as any).getInventoryItem(id);
  }

  async getInventoryItemBySupplierCode(supplierCode: string) {
    return (this.fallbackStorage as any).getInventoryItemBySupplierCode(supplierCode);
  }

  async getInventoryItemByBarcode(barcode: string) {
    return (this.fallbackStorage as any).getInventoryItemByBarcode(barcode);
  }

  async createInventoryItem(item: any) {
    return (this.fallbackStorage as any).createInventoryItem(item);
  }

  async updateInventoryItem(id: string, item: any) {
    return (this.fallbackStorage as any).updateInventoryItem(id, item);
  }

  async deleteInventoryItem(id: string) {
    return (this.fallbackStorage as any).deleteInventoryItem(id);
  }

  async bulkCreateInventoryItems(items: any[]) {
    return (this.fallbackStorage as any).bulkCreateInventoryItems(items);
  }

  // Use method forwarding for all remaining methods
  [key: string]: any;
}
