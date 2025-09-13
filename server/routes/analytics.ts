import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { enquiries } from "../../shared/schemas/enquiries";
import { quotations } from "../../shared/schemas/quotations";
import { salesOrders } from "../../shared/schemas/sales-orders";
import { invoices } from "../../shared/schemas/invoices";
import { customers } from "../../shared/schemas/users-customers";
import { suppliers } from "../../shared/schemas/users-customers";
import { inventory } from "../../shared/schemas/inventory";

const router = Router();

// Get dashboard KPIs
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params = [startDate, endDate];
    }

    // Get enquiry statistics
    const enquiryStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_enquiries,
        COUNT(CASE WHEN status = 'New' THEN 1 END) as new_enquiries,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_enquiries,
        COUNT(CASE WHEN status = 'Quoted' THEN 1 END) as quoted_enquiries,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_enquiries
      FROM enquiries 
      ${sql.raw(dateFilter)}
    `, params);

    // Get quotation statistics
    const quotationStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_quotations,
        COUNT(CASE WHEN status = 'Sent' THEN 1 END) as sent_quotations,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted_quotations,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_quotations,
        SUM(total_amount) as total_quotation_value
      FROM quotations 
      ${sql.raw(dateFilter)}
    `, params);

    // Get sales order statistics
    const salesOrderStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'Shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_orders,
        SUM(total_amount) as total_order_value
      FROM sales_orders 
      ${sql.raw(dateFilter)}
    `, params);

    // Get invoice statistics
    const invoiceStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_invoices,
        COUNT(CASE WHEN status = 'Sent' THEN 1 END) as sent_invoices,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_invoices,
        SUM(total_amount) as total_invoice_value,
        SUM(paid_amount) as total_paid_amount
      FROM invoices 
      ${sql.raw(dateFilter)}
    `, params);

    // Get customer statistics
    const customerStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
        COUNT(CASE WHEN customer_type = 'Retail' THEN 1 END) as retail_customers,
        COUNT(CASE WHEN customer_type = 'Wholesale' THEN 1 END) as wholesale_customers
      FROM customers
    `);

    // Get supplier statistics
    const supplierStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_suppliers
      FROM suppliers
    `);

    // Get inventory statistics
    const inventoryStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity_on_hand) as total_quantity,
        SUM(quantity_on_hand * cost_price) as total_inventory_value
      FROM inventory
    `);

    res.json({
      enquiries: enquiryStats.rows[0],
      quotations: quotationStats.rows[0],
      salesOrders: salesOrderStats.rows[0],
      invoices: invoiceStats.rows[0],
      customers: customerStats.rows[0],
      suppliers: supplierStats.rows[0],
      inventory: inventoryStats.rows[0]
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard analytics" });
  }
});

// Get sales trends
router.get("/sales/trends", async (req, res) => {
  try {
    const { period = "month", startDate, endDate } = req.query;
    
    let dateFormat = "";
    switch (period) {
      case "day":
        dateFormat = "YYYY-MM-DD";
        break;
      case "week":
        dateFormat = "YYYY-WW";
        break;
      case "month":
        dateFormat = "YYYY-MM";
        break;
      case "year":
        dateFormat = "YYYY";
        break;
      default:
        dateFormat = "YYYY-MM";
    }

    const trends = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as period,
        COUNT(*) as count,
        SUM(total_amount) as total_value
      FROM sales_orders 
      WHERE created_at >= COALESCE($1, NOW() - INTERVAL '12 months')
        AND created_at <= COALESCE($2, NOW())
      GROUP BY TO_CHAR(created_at, ${dateFormat})
      ORDER BY period
    `, [startDate, endDate]);

    res.json(trends.rows);
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    res.status(500).json({ error: "Failed to fetch sales trends" });
  }
});

// Get top customers
router.get("/customers/top", async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [limit];
    
    if (startDate && endDate) {
      dateFilter = "AND so.created_at >= $2 AND so.created_at <= $3";
      params = [limit, startDate, endDate];
    }

    const topCustomers = await db.execute(sql`
      SELECT 
        c.id,
        c.name,
        c.customer_type,
        COUNT(so.id) as order_count,
        SUM(so.total_amount) as total_value,
        AVG(so.total_amount) as avg_order_value
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customer_id
      WHERE 1=1 ${sql.raw(dateFilter)}
      GROUP BY c.id, c.name, c.customer_type
      HAVING COUNT(so.id) > 0
      ORDER BY total_value DESC
      LIMIT $1
    `, params);

    res.json(topCustomers.rows);
  } catch (error) {
    console.error("Error fetching top customers:", error);
    res.status(500).json({ error: "Failed to fetch top customers" });
  }
});

// Get top products
router.get("/products/top", async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [limit];
    
    if (startDate && endDate) {
      dateFilter = "AND so.created_at >= $2 AND so.created_at <= $3";
      params = [limit, startDate, endDate];
    }

    const topProducts = await db.execute(sql`
      SELECT 
        i.id,
        i.supplier_code,
        i.description,
        i.category,
        SUM(soi.quantity) as total_quantity,
        SUM(soi.quantity * soi.unit_price) as total_value,
        COUNT(DISTINCT so.id) as order_count
      FROM inventory i
      LEFT JOIN sales_order_items soi ON i.id = soi.item_id
      LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE 1=1 ${sql.raw(dateFilter)}
      GROUP BY i.id, i.supplier_code, i.description, i.category
      HAVING SUM(soi.quantity) > 0
      ORDER BY total_value DESC
      LIMIT $1
    `, params);

    res.json(topProducts.rows);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
});

// Get conversion funnel
router.get("/conversion/funnel", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params = [startDate, endDate];
    }

    const funnel = await db.execute(sql`
      WITH conversion_data AS (
        SELECT 
          COUNT(DISTINCT e.id) as enquiries,
          COUNT(DISTINCT q.id) as quotations,
          COUNT(DISTINCT so.id) as sales_orders,
          COUNT(DISTINCT i.id) as invoices
        FROM enquiries e
        LEFT JOIN quotations q ON e.id = q.enquiry_id
        LEFT JOIN sales_orders so ON q.id = so.quotation_id
        LEFT JOIN invoices i ON so.id = i.sales_order_id
        ${sql.raw(dateFilter)}
      )
      SELECT 
        enquiries,
        quotations,
        sales_orders,
        invoices,
        ROUND((quotations::float / NULLIF(enquiries, 0)) * 100, 2) as enquiry_to_quote_rate,
        ROUND((sales_orders::float / NULLIF(quotations, 0)) * 100, 2) as quote_to_order_rate,
        ROUND((invoices::float / NULLIF(sales_orders, 0)) * 100, 2) as order_to_invoice_rate
      FROM conversion_data
    `, params);

    res.json(funnel.rows[0]);
  } catch (error) {
    console.error("Error fetching conversion funnel:", error);
    res.status(500).json({ error: "Failed to fetch conversion funnel" });
  }
});

// Get inventory analytics
router.get("/inventory", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params = [startDate, endDate];
    }

    // Get inventory statistics
    const inventoryStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity_on_hand) as total_quantity,
        SUM(quantity_on_hand * cost_price) as total_inventory_value,
        COUNT(CASE WHEN quantity_on_hand < reorder_level THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN quantity_on_hand = 0 THEN 1 END) as out_of_stock_items,
        COUNT(CASE WHEN (quantity_on_hand * cost_price) > 1000 THEN 1 END) as high_value_items
      FROM inventory
    `);

    // Get category breakdown
    const categoryBreakdown = await db.execute(sql`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(quantity_on_hand * cost_price) as value
      FROM inventory
      GROUP BY category
      ORDER BY value DESC
    `);

    // Get stock movements (simplified - would need actual movement tracking table)
    const stockMovements = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN movement_type = 'receipt' THEN 1 END) as receipts,
        COUNT(CASE WHEN movement_type = 'issue' THEN 1 END) as issues,
        COUNT(CASE WHEN movement_type = 'adjustment' THEN 1 END) as adjustments
      FROM inventory_movements
      ${sql.raw(dateFilter)}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, params);

    res.json({
      ...inventoryStats.rows[0],
      category_breakdown: categoryBreakdown.rows,
      stock_movements: stockMovements.rows
    });
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    res.status(500).json({ error: "Failed to fetch inventory analytics" });
  }
});

// Get supplier analytics
router.get("/suppliers", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "AND so.created_at >= $1 AND so.created_at <= $2";
      params = [startDate, endDate];
    }

    // Get supplier statistics
    const supplierStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_suppliers
      FROM suppliers
    `);

    // Get top suppliers
    const topSuppliers = await db.execute(sql`
      SELECT 
        s.id,
        s.name,
        COUNT(DISTINCT so.id) as order_count,
        SUM(so.total_amount) as total_value,
        AVG(EXTRACT(DAYS FROM (so.delivery_date - so.created_at))) as avg_delivery_time,
        COALESCE(AVG(sr.rating), 4.0) as quality_rating
      FROM suppliers s
      LEFT JOIN sales_orders so ON s.id = so.supplier_id
      LEFT JOIN supplier_ratings sr ON s.id = sr.supplier_id
      WHERE 1=1 ${sql.raw(dateFilter)}
      GROUP BY s.id, s.name
      HAVING COUNT(so.id) > 0
      ORDER BY total_value DESC
      LIMIT 10
    `, params);

    // Get supplier performance matrix
    const supplierPerformance = await db.execute(sql`
      SELECT 
        s.id as supplier_id,
        s.name,
        COALESCE(AVG(CASE WHEN so.delivery_date <= so.expected_delivery_date THEN 100 ELSE 80 END), 85) as on_time_delivery,
        COALESCE(AVG(sr.rating), 4.0) as quality_score,
        COALESCE(AVG(so.total_amount / NULLIF(so.quantity, 0)), 0) as cost_efficiency
      FROM suppliers s
      LEFT JOIN sales_orders so ON s.id = so.supplier_id
      LEFT JOIN supplier_ratings sr ON s.id = sr.supplier_id
      WHERE 1=1 ${sql.raw(dateFilter)}
      GROUP BY s.id, s.name
      HAVING COUNT(so.id) > 0
    `, params);

    res.json({
      ...supplierStats.rows[0],
      top_suppliers: topSuppliers.rows,
      supplier_performance: supplierPerformance.rows
    });
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    res.status(500).json({ error: "Failed to fetch supplier analytics" });
  }
});

// Get financial analytics
router.get("/financial", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params = [startDate, endDate];
    }

    // Get revenue data
    const revenueData = await db.execute(sql`
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN c.customer_type = 'Retail' THEN i.total_amount ELSE 0 END) as retail_revenue,
        SUM(CASE WHEN c.customer_type = 'Wholesale' THEN i.total_amount ELSE 0 END) as wholesale_revenue,
        AVG(EXTRACT(DAYS FROM (i.created_at - LAG(i.created_at) OVER (ORDER BY i.created_at)))) as monthly_growth
      FROM invoices i
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      LEFT JOIN customers c ON so.customer_id = c.id
      ${sql.raw(dateFilter)}
    `, params);

    // Get cost data
    const costData = await db.execute(sql`
      SELECT 
        SUM(soi.quantity * soi.unit_cost) as cost_of_goods_sold,
        SUM(soi.quantity * soi.unit_cost * 0.1) as operating_costs
      FROM sales_order_items soi
      LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
      ${sql.raw(dateFilter)}
    `, params);

    // Get pricing analysis
    const pricingData = await db.execute(sql`
      SELECT 
        AVG(CASE WHEN c.customer_type = 'Retail' THEN ((soi.unit_price - soi.unit_cost) / NULLIF(soi.unit_cost, 0)) * 100 ELSE NULL END) as avg_retail_markup,
        AVG(CASE WHEN c.customer_type = 'Wholesale' THEN ((soi.unit_price - soi.unit_cost) / NULLIF(soi.unit_cost, 0)) * 100 ELSE NULL END) as avg_wholesale_markup,
        STDDEV(soi.unit_price) as price_variance
      FROM sales_order_items soi
      LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
      LEFT JOIN customers c ON so.customer_id = c.id
      ${sql.raw(dateFilter)}
    `, params);

    const revenue = revenueData.rows[0];
    const costs = costData.rows[0];
    const pricing = pricingData.rows[0];

    const grossProfit = (revenue.total_revenue || 0) - (costs.cost_of_goods_sold || 0);
    const grossMargin = revenue.total_revenue > 0 ? (grossProfit / revenue.total_revenue) * 100 : 0;
    const netProfit = grossProfit - (costs.operating_costs || 0);
    const netMargin = revenue.total_revenue > 0 ? (netProfit / revenue.total_revenue) * 100 : 0;

    res.json({
      revenue: {
        total_revenue: revenue.total_revenue || 0,
        retail_revenue: revenue.retail_revenue || 0,
        wholesale_revenue: revenue.wholesale_revenue || 0,
        monthly_growth: revenue.monthly_growth || 0
      },
      costs: {
        total_costs: (costs.cost_of_goods_sold || 0) + (costs.operating_costs || 0),
        cost_of_goods_sold: costs.cost_of_goods_sold || 0,
        operating_costs: costs.operating_costs || 0
      },
      profitability: {
        gross_profit: grossProfit,
        gross_margin: grossMargin,
        net_profit: netProfit,
        net_margin: netMargin
      },
      pricing_analysis: {
        avg_retail_markup: pricing.avg_retail_markup || 0,
        avg_wholesale_markup: pricing.avg_wholesale_markup || 0,
        price_variance: pricing.price_variance || 0
      }
    });
  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    res.status(500).json({ error: "Failed to fetch financial analytics" });
  }
});

// Get audit trail analytics
router.get("/audit-trail", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params = [startDate, endDate];
    }

    // Get total actions count
    const totalActions = await db.execute(sql`
      SELECT COUNT(*) as total_actions
      FROM audit_logs
      ${sql.raw(dateFilter)}
    `, params);

    // Get user activity
    const userActivity = await db.execute(sql`
      SELECT 
        user_id,
        user_name,
        COUNT(*) as action_count,
        MAX(created_at) as last_activity
      FROM audit_logs
      ${sql.raw(dateFilter)}
      GROUP BY user_id, user_name
      ORDER BY action_count DESC
      LIMIT 10
    `, params);

    // Get critical actions
    const criticalActions = await db.execute(sql`
      SELECT 
        action,
        COUNT(*) as count,
        MAX(created_at) as last_occurred
      FROM audit_logs
      WHERE action IN ('DELETE', 'UPDATE_PRICE', 'APPROVE_QUOTATION', 'REJECT_QUOTATION', 'CANCEL_ORDER')
      ${sql.raw(dateFilter)}
      GROUP BY action
      ORDER BY count DESC
    `, params);

    // Calculate compliance score (simplified)
    const complianceScore = 85; // This would be calculated based on various compliance metrics

    res.json({
      total_actions: totalActions.rows[0].total_actions,
      user_activity: userActivity.rows,
      critical_actions: criticalActions.rows,
      compliance_score: complianceScore
    });
  } catch (error) {
    console.error("Error fetching audit trail analytics:", error);
    res.status(500).json({ error: "Failed to fetch audit trail analytics" });
  }
});

// Get enquiry source analytics
router.get("/enquiry-sources", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params = [startDate, endDate];
    }

    // Get enquiry sources breakdown
    const sourceBreakdown = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN enquiry_source = 'Email' THEN 1 END) as email,
        COUNT(CASE WHEN enquiry_source = 'Phone' THEN 1 END) as phone,
        COUNT(CASE WHEN enquiry_source = 'Web Form' THEN 1 END) as web_form,
        COUNT(CASE WHEN enquiry_source = 'Walk-in' THEN 1 END) as walk_in,
        COUNT(CASE WHEN enquiry_source = 'Referral' THEN 1 END) as referral
      FROM enquiries
      ${sql.raw(dateFilter)}
    `, params);

    // Get source performance
    const sourcePerformance = await db.execute(sql`
      SELECT 
        enquiry_source as source,
        COUNT(*) as total_enquiries,
        COUNT(q.id) as quotations_generated,
        AVG(q.total_amount) as avg_value,
        ROUND((COUNT(q.id)::float / COUNT(*)) * 100, 2) as conversion_rate
      FROM enquiries e
      LEFT JOIN quotations q ON e.id = q.enquiry_id
      ${sql.raw(dateFilter)}
      GROUP BY enquiry_source
    `, params);

    res.json({
      ...sourceBreakdown.rows[0],
      source_performance: sourcePerformance.rows
    });
  } catch (error) {
    console.error("Error fetching enquiry source analytics:", error);
    res.status(500).json({ error: "Failed to fetch enquiry source analytics" });
  }
});

export default router;
