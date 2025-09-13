import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, sql, createInsertSchema } from "./common";
import { pricingMarkupLevelEnum, pricingRuleTypeEnum } from "./enums";
import { users, customers } from "./users-customers";
import { inventoryItems } from "./inventory";

// PRICING & COSTING ENGINE TABLES

// Product Categories for pricing hierarchy
export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentCategoryId: uuid("parent_category_id"), // Self-reference will be added as foreign key constraint
  retailMarkupPercentage: decimal("retail_markup_percentage", { precision: 5, scale: 2 }),
  wholesaleMarkupPercentage: decimal("wholesale_markup_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System-wide markup configuration
export const markupConfiguration = pgTable("markup_configuration", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  level: pricingMarkupLevelEnum("level").notNull(),
  entityId: uuid("entity_id"), // null for system-wide, category_id for category, item_id for item
  retailMarkupPercentage: decimal("retail_markup_percentage", { precision: 5, scale: 2 }).notNull(),
  wholesaleMarkupPercentage: decimal("wholesale_markup_percentage", { precision: 5, scale: 2 }).notNull(),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Item pricing with calculated prices
export const itemPricing = pgTable("item_pricing", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: uuid("item_id").notNull(),
  supplierCost: decimal("supplier_cost", { precision: 12, scale: 2 }).notNull(),
  retailPrice: decimal("retail_price", { precision: 12, scale: 2 }).notNull(),
  wholesalePrice: decimal("wholesale_price", { precision: 12, scale: 2 }).notNull(),
  retailMarkupPercentage: decimal("retail_markup_percentage", { precision: 5, scale: 2 }),
  wholesaleMarkupPercentage: decimal("wholesale_markup_percentage", { precision: 5, scale: 2 }),
  isManualOverride: boolean("is_manual_override").default(false),
  overrideReason: text("override_reason"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer-specific pricing overrides
export const customerPricing = pgTable("customer_pricing", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull(),
  itemId: uuid("item_id").notNull(),
  specialPrice: decimal("special_price", { precision: 12, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  minimumQuantity: integer("minimum_quantity").default(1),
  maximumQuantity: integer("maximum_quantity"),
  validFrom: timestamp("valid_from").defaultNow(),
  validTo: timestamp("valid_to"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing rule engine for complex calculations
export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ruleType: pricingRuleTypeEnum("rule_type").notNull(),
  conditions: jsonb("conditions").notNull(), // JSON conditions for rule application
  actions: jsonb("actions").notNull(), // JSON actions for price calculation
  priority: integer("priority").default(100),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price list generation and management
export const priceLists = pgTable("price_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // "retail", "wholesale", "custom"
  customerId: uuid("customer_id"), // for customer-specific price lists
  categoryId: uuid("category_id"), // for category-specific price lists
  currency: varchar("currency", { length: 3 }).default("USD"),
  validFrom: timestamp("valid_from").defaultNow(),
  validTo: timestamp("valid_to"),
  generatedAt: timestamp("generated_at"),
  fileUrl: varchar("file_url", { length: 500 }),
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price list items for generated lists
export const priceListItems = pgTable("price_list_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  priceListId: uuid("price_list_id").notNull(),
  itemId: uuid("item_id").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  effectivePrice: decimal("effective_price", { precision: 12, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  minimumQuantity: integer("minimum_quantity").default(1),
  notes: text("notes"),
});

// Price change history for audit trail
export const priceChangeHistory = pgTable("price_change_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: uuid("item_id").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // "cost_update", "markup_change", "manual_override"
  oldSupplierCost: decimal("old_supplier_cost", { precision: 12, scale: 2 }),
  newSupplierCost: decimal("new_supplier_cost", { precision: 12, scale: 2 }),
  oldRetailPrice: decimal("old_retail_price", { precision: 12, scale: 2 }),
  newRetailPrice: decimal("new_retail_price", { precision: 12, scale: 2 }),
  oldWholesalePrice: decimal("old_wholesale_price", { precision: 12, scale: 2 }),
  newWholesalePrice: decimal("new_wholesale_price", { precision: 12, scale: 2 }),
  reason: text("reason"),
  triggeredBy: varchar("triggered_by", { length: 100 }), // "system", "manual", "supplier_update"
  userId: uuid("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bulk pricing operations for efficient updates
export const bulkPricingOperations = pgTable("bulk_pricing_operations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: varchar("operation_type", { length: 50 }).notNull(), // "markup_update", "cost_update", "price_override"
  criteria: jsonb("criteria").notNull(), // JSON criteria for operation
  changes: jsonb("changes").notNull(), // JSON changes to apply
  status: varchar("status", { length: 50 }).default("pending"), // "pending", "processing", "completed", "failed"
  affectedItemsCount: integer("affected_items_count").default(0),
  processedItemsCount: integer("processed_items_count").default(0),
  errorLog: text("error_log"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// PRICING INSERT SCHEMAS
export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarkupConfigurationSchema = createInsertSchema(markupConfiguration).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemPricingSchema = createInsertSchema(itemPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerPricingSchema = createInsertSchema(customerPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceListSchema = createInsertSchema(priceLists).omit({
  id: true,
  generatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({
  id: true,
});

export const insertPriceChangeHistorySchema = createInsertSchema(priceChangeHistory).omit({
  id: true,
  createdAt: true,
});

export const insertBulkPricingOperationSchema = createInsertSchema(bulkPricingOperations).omit({
  id: true,
  createdAt: true,
});

// PRICING TYPE EXPORTS
export type ProductCategory = typeof productCategories.$inferSelect;
export type MarkupConfiguration = typeof markupConfiguration.$inferSelect;
export type ItemPricing = typeof itemPricing.$inferSelect;
export type CustomerPricing = typeof customerPricing.$inferSelect;
export type PricingRule = typeof pricingRules.$inferSelect;
export type PriceList = typeof priceLists.$inferSelect;
export type PriceListItem = typeof priceListItems.$inferSelect;
export type PriceChangeHistory = typeof priceChangeHistory.$inferSelect;
export type BulkPricingOperation = typeof bulkPricingOperations.$inferSelect;

export type InsertProductCategory = typeof insertProductCategorySchema;
export type InsertMarkupConfiguration = typeof insertMarkupConfigurationSchema;
export type InsertItemPricing = typeof insertItemPricingSchema;
export type InsertCustomerPricing = typeof insertCustomerPricingSchema;
export type InsertPricingRule = typeof insertPricingRuleSchema;
export type InsertPriceList = typeof insertPriceListSchema;
export type InsertPriceListItem = typeof insertPriceListItemSchema;
export type InsertPriceChangeHistory = typeof insertPriceChangeHistorySchema;
export type InsertBulkPricingOperation = typeof insertBulkPricingOperationSchema;
