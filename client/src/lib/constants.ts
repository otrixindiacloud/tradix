export const WORKFLOW_STEPS = [
  { id: 1, name: "Customer", path: "/customers", icon: "fas fa-user", color: "text-blue-700" },
  { id: 2, name: "Enquiry", path: "/enquiries", icon: "fas fa-question-circle", color: "text-amber-500" },
  { id: 3, name: "Sourcing", path: "/sourcing", icon: "fas fa-search", color: "text-gray-500" },
  { id: 4, name: "Quotation", path: "/quotations", icon: "fas fa-file-alt", color: "text-blue-500" },
  { id: 5, name: "Acceptance", path: "/customer-acceptance", icon: "fas fa-check-circle", color: "text-green-500" },
  { id: 6, name: "Customer PO Upload", path: "/customer-po-upload", icon: "fas fa-upload", color: "text-purple-500" },
  { id: 7, name: "Sales Order", path: "/sales-orders", icon: "fas fa-shopping-cart", color: "text-green-600" },
  { id: 8, name: "Supplier LPO", path: "/supplier-lpo", icon: "fas fa-truck", color: "text-indigo-500" },
  { id: 9, name: "Goods Receipt", path: "/goods-receipt", icon: "fas fa-box-open", color: "text-orange-500" },
  { id: 10, name: "Inventory", path: "/inventory", icon: "fas fa-warehouse", color: "text-gray-600" },
  { id: 11, name: "Delivery Note", path: "/delivery-note", icon: "fas fa-truck-moving", color: "text-blue-600" },
  { id: 12, name: "Invoice", path: "/invoicing", icon: "fas fa-file-invoice", color: "text-green-600" },
] as const;

export const CUSTOMER_TYPES = ["Retail", "Wholesale"] as const;
export const CUSTOMER_CLASSIFICATIONS = ["Internal", "Corporate", "Individual", "Family", "Ministry"] as const;
export const ENQUIRY_SOURCES = ["Email", "Phone", "Web Form", "Walk-in"] as const;
export const ENQUIRY_STATUSES = ["New", "In Progress", "Quoted", "Closed"] as const;
export const QUOTATION_STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Expired"] as const;

export const PRICING_CONFIG = {
  RETAIL_MARKUP: 70,
  WHOLESALE_MARKUP: 40,
} as const;
