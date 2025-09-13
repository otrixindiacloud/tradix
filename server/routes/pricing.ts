import { Express } from 'express';
import { z } from 'zod';
import { 
  insertProductCategorySchema,
  insertMarkupConfigurationSchema,
  insertCustomerPricingSchema,
  insertPriceListSchema,
  insertBulkPricingOperationSchema
} from '../../shared/schema.js';
import { storage } from '../storage.js';

export function registerPricingRoutes(app: Express) {
  // PRICING & COSTING ENGINE ROUTES

  // Product Categories Routes
  app.get("/api/product-categories", async (req, res) => {
    try {
      const { parentCategoryId, isActive, limit, offset } = req.query;
      const filters = {
        parentCategoryId: parentCategoryId as string || undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const categories = await storage.getProductCategories(filters);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ error: "Failed to fetch product categories" });
    }
  });

  app.get("/api/product-categories/:id", async (req, res) => {
    try {
      const category = await storage.getProductCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Product category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching product category:", error);
      res.status(500).json({ error: "Failed to fetch product category" });
    }
  });

  app.post("/api/product-categories", async (req, res) => {
    try {
      const categoryData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createProductCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating product category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product category" });
    }
  });

  app.put("/api/product-categories/:id", async (req, res) => {
    try {
      const categoryData = insertProductCategorySchema.partial().parse(req.body);
      const category = await storage.updateProductCategory(req.params.id, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating product category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update product category" });
    }
  });

  app.delete("/api/product-categories/:id", async (req, res) => {
    try {
      await storage.deleteProductCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product category:", error);
      res.status(500).json({ error: "Failed to delete product category" });
    }
  });

  // Markup Configuration Routes
  app.get("/api/markup-configurations", async (req, res) => {
    try {
      const { level, entityId, isActive } = req.query;
      const filters = {
        level: level as string || undefined,
        entityId: entityId as string || undefined,
        isActive: isActive ? isActive === 'true' : undefined,
      };
      const configurations = await storage.getMarkupConfigurations(filters);
      res.json(configurations);
    } catch (error) {
      console.error("Error fetching markup configurations:", error);
      res.status(500).json({ error: "Failed to fetch markup configurations" });
    }
  });

  app.get("/api/markup-configurations/:id", async (req, res) => {
    try {
      const configuration = await storage.getMarkupConfiguration(req.params.id);
      if (!configuration) {
        return res.status(404).json({ error: "Markup configuration not found" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error fetching markup configuration:", error);
      res.status(500).json({ error: "Failed to fetch markup configuration" });
    }
  });

  app.get("/api/markup-configurations/active/:level", async (req, res) => {
    try {
      const { level } = req.params;
      const { entityId } = req.query;
      const configuration = await storage.getActiveMarkupForEntity(level, entityId as string);
      if (!configuration) {
        return res.status(404).json({ error: "No active markup configuration found" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error fetching active markup configuration:", error);
      res.status(500).json({ error: "Failed to fetch active markup configuration" });
    }
  });

  app.post("/api/markup-configurations", async (req, res) => {
    try {
      const configData = insertMarkupConfigurationSchema.parse(req.body);
      const configuration = await storage.createMarkupConfiguration(configData);
      res.status(201).json(configuration);
    } catch (error) {
      console.error("Error creating markup configuration:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid markup configuration data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create markup configuration" });
    }
  });

  app.put("/api/markup-configurations/:id", async (req, res) => {
    try {
      const configData = insertMarkupConfigurationSchema.partial().parse(req.body);
      const configuration = await storage.updateMarkupConfiguration(req.params.id, configData);
      res.json(configuration);
    } catch (error) {
      console.error("Error updating markup configuration:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid markup configuration data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update markup configuration" });
    }
  });

  // Item Pricing Routes
  app.get("/api/item-pricing", async (req, res) => {
    try {
      const { isActive, isManualOverride, limit, offset } = req.query;
      const filters = {
        isActive: isActive ? isActive === 'true' : undefined,
        isManualOverride: isManualOverride ? isManualOverride === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const pricing = await storage.getAllItemPricing(filters);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching item pricing:", error);
      res.status(500).json({ error: "Failed to fetch item pricing" });
    }
  });

  app.get("/api/item-pricing/:itemId", async (req, res) => {
    try {
      const pricing = await storage.getItemPricing(req.params.itemId);
      if (!pricing) {
        return res.status(404).json({ error: "Item pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching item pricing:", error);
      res.status(500).json({ error: "Failed to fetch item pricing" });
    }
  });

  app.post("/api/item-pricing/calculate", async (req, res) => {
    try {
      const { itemId, supplierCost } = req.body;
      if (!itemId || !supplierCost) {
        return res.status(400).json({ error: "itemId and supplierCost are required" });
      }
      const calculatedPrices = await storage.calculatePricesForItem(itemId, parseFloat(supplierCost));
      res.json(calculatedPrices);
    } catch (error) {
      console.error("Error calculating item prices:", error);
      res.status(500).json({ error: "Failed to calculate item prices" });
    }
  });

  app.post("/api/item-pricing/:itemId", async (req, res) => {
    try {
      const { supplierCost, userId, isManualOverride, overrideReason } = req.body;
      if (!supplierCost) {
        return res.status(400).json({ error: "supplierCost is required" });
      }
      const pricing = await storage.createOrUpdateItemPricing(
        req.params.itemId,
        parseFloat(supplierCost),
        userId,
        isManualOverride || false,
        overrideReason
      );
      res.status(201).json(pricing);
    } catch (error) {
      console.error("Error creating/updating item pricing:", error);
      res.status(500).json({ error: "Failed to create/update item pricing" });
    }
  });

  app.post("/api/item-pricing/:itemId/override", async (req, res) => {
    try {
      const { retailPrice, wholesalePrice, reason, userId } = req.body;
      const pricing = await storage.overrideItemPricing(
        req.params.itemId,
        retailPrice ? parseFloat(retailPrice) : undefined,
        wholesalePrice ? parseFloat(wholesalePrice) : undefined,
        reason,
        userId
      );
      res.json(pricing);
    } catch (error) {
      console.error("Error overriding item pricing:", error);
      res.status(500).json({ error: "Failed to override item pricing" });
    }
  });

  app.post("/api/item-pricing/effective-price", async (req, res) => {
    try {
      const { itemId, customerId, customerType, quantity } = req.body;
      if (!itemId) {
        return res.status(400).json({ error: "itemId is required" });
      }
      const effectivePrice = await storage.calculateEffectivePrice(
        itemId,
        customerId,
        customerType,
        quantity ? parseInt(quantity) : undefined
      );
      res.json(effectivePrice);
    } catch (error) {
      console.error("Error calculating effective price:", error);
      res.status(500).json({ error: "Failed to calculate effective price" });
    }
  });

  // Customer Pricing Routes
  app.get("/api/customer-pricing", async (req, res) => {
    try {
      const { customerId, itemId } = req.query;
      if (!customerId) {
        return res.status(400).json({ error: "customerId query parameter is required" });
      }
      const pricing = await storage.getCustomerPricing(customerId as string, itemId as string);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching customer pricing:", error);
      res.status(500).json({ error: "Failed to fetch customer pricing" });
    }
  });

  app.get("/api/customer-pricing/:id", async (req, res) => {
    try {
      const pricing = await storage.getCustomerPricingById(req.params.id);
      if (!pricing) {
        return res.status(404).json({ error: "Customer pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching customer pricing:", error);
      res.status(500).json({ error: "Failed to fetch customer pricing" });
    }
  });

  app.post("/api/customer-pricing", async (req, res) => {
    try {
      const pricingData = insertCustomerPricingSchema.parse(req.body);
      const pricing = await storage.createCustomerPricing(pricingData);
      res.status(201).json(pricing);
    } catch (error) {
      console.error("Error creating customer pricing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid customer pricing data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer pricing" });
    }
  });

  app.put("/api/customer-pricing/:id", async (req, res) => {
    try {
      const pricingData = insertCustomerPricingSchema.partial().parse(req.body);
      const pricing = await storage.updateCustomerPricing(req.params.id, pricingData);
      res.json(pricing);
    } catch (error) {
      console.error("Error updating customer pricing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid customer pricing data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update customer pricing" });
    }
  });

  // Price Lists Routes
  app.get("/api/price-lists", async (req, res) => {
    try {
      const { type, customerId, categoryId, isActive, limit, offset } = req.query;
      const filters = {
        type: type as string || undefined,
        customerId: customerId as string || undefined,
        categoryId: categoryId as string || undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      const priceLists = await storage.getPriceLists(filters);
      res.json(priceLists);
    } catch (error) {
      console.error("Error fetching price lists:", error);
      res.status(500).json({ error: "Failed to fetch price lists" });
    }
  });

  app.get("/api/price-lists/:id", async (req, res) => {
    try {
      const priceList = await storage.getPriceList(req.params.id);
      if (!priceList) {
        return res.status(404).json({ error: "Price list not found" });
      }
      res.json(priceList);
    } catch (error) {
      console.error("Error fetching price list:", error);
      res.status(500).json({ error: "Failed to fetch price list" });
    }
  });

  app.get("/api/price-lists/:id/items", async (req, res) => {
    try {
      const items = await storage.getPriceListItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching price list items:", error);
      res.status(500).json({ error: "Failed to fetch price list items" });
    }
  });

  app.post("/api/price-lists", async (req, res) => {
    try {
      const listData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.generatePriceList(listData);
      res.status(201).json(priceList);
    } catch (error) {
      console.error("Error generating price list:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid price list data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to generate price list" });
    }
  });

  app.post("/api/price-lists/:id/download", async (req, res) => {
    try {
      const priceList = await storage.getPriceList(req.params.id);
      if (!priceList) {
        return res.status(404).json({ error: "Price list not found" });
      }

      const items = await storage.getPriceListItems(req.params.id);
      
      // Generate CSV content
      const csvHeader = "Item SKU,Item Name,Base Price,Effective Price,Discount %,Min Quantity\n";
      const csvContent = items.map(item => {
        return `"${item.itemId}","Item Name","${item.price}","${item.effectivePrice}","${item.discountPercentage || '0'}","${item.minimumQuantity}"`;
      }).join('\n');
      
      const csv = csvHeader + csvContent;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${priceList.name}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error downloading price list:", error);
      res.status(500).json({ error: "Failed to download price list" });
    }
  });

  // Price Change History Routes
  app.get("/api/price-change-history", async (req, res) => {
    try {
      const { itemId, limit, offset } = req.query;
      const history = await storage.getPriceChangeHistory(
        itemId as string || undefined,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(history);
    } catch (error) {
      console.error("Error fetching price change history:", error);
      res.status(500).json({ error: "Failed to fetch price change history" });
    }
  });

  // Bulk Pricing Operations Routes
  app.get("/api/bulk-pricing-operations", async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const operations = await storage.getBulkPricingOperations(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(operations);
    } catch (error) {
      console.error("Error fetching bulk pricing operations:", error);
      res.status(500).json({ error: "Failed to fetch bulk pricing operations" });
    }
  });

  app.post("/api/bulk-pricing-operations", async (req, res) => {
    try {
      const operationData = insertBulkPricingOperationSchema.parse(req.body);
      const operation = await storage.createBulkPricingOperation(operationData);
      
      // Process the operation based on type
      if (operation.operationType === "markup_update") {
        const { newRetailMarkup, newWholesaleMarkup, categoryId } = req.body;
        if (newRetailMarkup && newWholesaleMarkup) {
          await storage.processBulkMarkupUpdate(
            operation.id,
            parseFloat(newRetailMarkup),
            parseFloat(newWholesaleMarkup),
            { categoryId }
          );
        }
      }
      
      res.status(201).json(operation);
    } catch (error) {
      console.error("Error creating bulk pricing operation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bulk operation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create bulk pricing operation" });
    }
  });
}
