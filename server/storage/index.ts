export * from './interfaces.js';
export * from './base.js';
export * from './user-storage.js';
export * from './customer-storage.js';
export * from './supplier-storage.js';
export * from './item-storage.js';
export * from './enquiry-storage.js';
export * from './audit-storage.js';
export * from './quotation-storage.js';
export * from './sales-order-storage.js';
export * from './delivery-storage.js';
export * from './modular-storage-clean.js';

// Provide a unified storage instance (modular) for all route imports.
// This ensures patched module implementations (e.g., GoodsReceiptStorage) are actually used.
import { ModularStorage } from './modular-storage-clean.js';
export const storage = new ModularStorage() as any;
