import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter } from "recharts";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, RefreshCw, Download, Calendar, Warehouse, Truck, AlertTriangle, FileText, BarChart3, PieChart as PieChartIcon, Activity, Shield, Bell, Database, Target, Zap } from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";

interface DashboardKPIs {
  enquiries: {
    total_enquiries: number;
    new_enquiries: number;
    in_progress_enquiries: number;
    quoted_enquiries: number;
    closed_enquiries: number;
  };
  quotations: {
    total_quotations: number;
    draft_quotations: number;
    sent_quotations: number;
    accepted_quotations: number;
    rejected_quotations: number;
    total_quotation_value: number;
  };
  salesOrders: {
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    total_order_value: number;
  };
  invoices: {
    total_invoices: number;
    draft_invoices: number;
    sent_invoices: number;
    paid_invoices: number;
    overdue_invoices: number;
    total_invoice_value: number;
    total_paid_amount: number;
  };
  customers: {
    total_customers: number;
    active_customers: number;
    retail_customers: number;
    wholesale_customers: number;
  };
  suppliers: {
    total_suppliers: number;
    active_suppliers: number;
  };
  inventory: {
    total_items: number;
    total_quantity: number;
    total_inventory_value: number;
  };
}

interface SalesTrend {
  period: string;
  count: number;
  total_value: number;
}

interface TopCustomer {
  id: string;
  name: string;
  customer_type: string;
  order_count: number;
  total_value: number;
  avg_order_value: number;
}

interface TopProduct {
  id: string;
  supplier_code: string;
  description: string;
  category: string;
  total_quantity: number;
  total_value: number;
  order_count: number;
}

interface ConversionFunnel {
  enquiries: number;
  quotations: number;
  sales_orders: number;
  invoices: number;
  enquiry_to_quote_rate: number;
  quote_to_order_rate: number;
  order_to_invoice_rate: number;
}

interface InventoryAnalytics {
  total_items: number;
  total_quantity: number;
  total_inventory_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  high_value_items: number;
  category_breakdown: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  stock_movements: Array<{
    date: string;
    receipts: number;
    issues: number;
    adjustments: number;
  }>;
}

interface SupplierAnalytics {
  total_suppliers: number;
  active_suppliers: number;
  top_suppliers: Array<{
    id: string;
    name: string;
    order_count: number;
    total_value: number;
    avg_delivery_time: number;
    quality_rating: number;
  }>;
  supplier_performance: Array<{
    supplier_id: string;
    name: string;
    on_time_delivery: number;
    quality_score: number;
    cost_efficiency: number;
  }>;
}

interface FinancialAnalytics {
  revenue: {
    total_revenue: number;
    retail_revenue: number;
    wholesale_revenue: number;
    monthly_growth: number;
  };
  costs: {
    total_costs: number;
    cost_of_goods_sold: number;
    operating_costs: number;
  };
  profitability: {
    gross_profit: number;
    gross_margin: number;
    net_profit: number;
    net_margin: number;
  };
  pricing_analysis: {
    avg_retail_markup: number;
    avg_wholesale_markup: number;
    price_variance: number;
  };
}

interface AuditTrailAnalytics {
  total_actions: number;
  user_activity: Array<{
    user_id: string;
    user_name: string;
    action_count: number;
    last_activity: string;
  }>;
  critical_actions: Array<{
    action: string;
    count: number;
    last_occurred: string;
  }>;
  compliance_score: number;
}

interface EnquirySourceAnalytics {
  email: number;
  phone: number;
  web_form: number;
  walk_in: number;
  referral: number;
  source_performance: Array<{
    source: string;
    conversion_rate: number;
    avg_value: number;
  }>;
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" }
];

const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel | null>(null);
  const [inventoryAnalytics, setInventoryAnalytics] = useState<InventoryAnalytics | null>(null);
  const [supplierAnalytics, setSupplierAnalytics] = useState<SupplierAnalytics | null>(null);
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null);
  const [auditTrailAnalytics, setAuditTrailAnalytics] = useState<AuditTrailAnalytics | null>(null);
  const [enquirySourceAnalytics, setEnquirySourceAnalytics] = useState<EnquirySourceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = getStartDate(period);
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Default values for all data structures
      const defaultKpis: DashboardKPIs = {
        enquiries: {
          total_enquiries: 0,
          new_enquiries: 0,
          in_progress_enquiries: 0,
          quoted_enquiries: 0,
          closed_enquiries: 0
        },
        quotations: {
          total_quotations: 0,
          draft_quotations: 0,
          sent_quotations: 0,
          accepted_quotations: 0,
          rejected_quotations: 0,
          total_quotation_value: 0
        },
        salesOrders: {
          total_orders: 0,
          pending_orders: 0,
          confirmed_orders: 0,
          shipped_orders: 0,
          delivered_orders: 0,
          total_order_value: 0
        },
        invoices: {
          total_invoices: 0,
          draft_invoices: 0,
          sent_invoices: 0,
          paid_invoices: 0,
          overdue_invoices: 0,
          total_invoice_value: 0,
          total_paid_amount: 0
        },
        customers: {
          total_customers: 0,
          active_customers: 0,
          retail_customers: 0,
          wholesale_customers: 0
        },
        suppliers: {
          total_suppliers: 0,
          active_suppliers: 0
        },
        inventory: {
          total_items: 0,
          total_quantity: 0,
          total_inventory_value: 0
        }
      };

      // Fetch all analytics data in parallel with error handling for each
      const [
        kpisRes, trendsRes, customersRes, productsRes, funnelRes,
        inventoryRes, supplierRes, financialRes, auditRes, enquirySourceRes
      ] = await Promise.allSettled([
        fetch(`/api/analytics/dashboard?${params}`),
        fetch(`/api/analytics/sales/trends?${params}&period=day`),
        fetch(`/api/analytics/customers/top?${params}`),
        fetch(`/api/analytics/products/top?${params}`),
        fetch(`/api/analytics/conversion/funnel?${params}`),
        fetch(`/api/analytics/inventory?${params}`),
        fetch(`/api/analytics/suppliers?${params}`),
        fetch(`/api/analytics/financial?${params}`),
        fetch(`/api/analytics/audit-trail?${params}`),
        fetch(`/api/analytics/enquiry-sources?${params}`)
      ]);

      // Process each response with error handling
      const processResponse = async (response: PromiseSettledResult<Response>, defaultValue: any) => {
        if (response.status === 'fulfilled' && response.value.ok) {
          try {
            return await response.value.json();
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return defaultValue;
          }
        } else {
          console.error("API request failed:", response.status === 'rejected' ? response.reason : 'Request failed');
          return defaultValue;
        }
      };

      const [
        kpisData, trendsData, customersData, productsData, funnelData,
        inventoryData, supplierData, financialData, auditData, enquirySourceData
      ] = await Promise.all([
        processResponse(kpisRes, defaultKpis),
        processResponse(trendsRes, []),
        processResponse(customersRes, []),
        processResponse(productsRes, []),
        processResponse(funnelRes, null),
        processResponse(inventoryRes, null),
        processResponse(supplierRes, null),
        processResponse(financialRes, null),
        processResponse(auditRes, null),
        processResponse(enquirySourceRes, null)
      ]);

      setKpis(kpisData);
      setSalesTrends(trendsData);
      setTopCustomers(customersData);
      setTopProducts(productsData);
      setConversionFunnel(funnelData);
      setInventoryAnalytics(inventoryData);
      setSupplierAnalytics(supplierData);
      setFinancialAnalytics(financialData);
      setAuditTrailAnalytics(auditData);
      setEnquirySourceAnalytics(enquirySourceData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Set default values on complete failure
      setKpis({
        enquiries: { total_enquiries: 0, new_enquiries: 0, in_progress_enquiries: 0, quoted_enquiries: 0, closed_enquiries: 0 },
        quotations: { total_quotations: 0, draft_quotations: 0, sent_quotations: 0, accepted_quotations: 0, rejected_quotations: 0, total_quotation_value: 0 },
        salesOrders: { total_orders: 0, pending_orders: 0, confirmed_orders: 0, shipped_orders: 0, delivered_orders: 0, total_order_value: 0 },
        invoices: { total_invoices: 0, draft_invoices: 0, sent_invoices: 0, paid_invoices: 0, overdue_invoices: 0, total_invoice_value: 0, total_paid_amount: 0 },
        customers: { total_customers: 0, active_customers: 0, retail_customers: 0, wholesale_customers: 0 },
        suppliers: { total_suppliers: 0, active_suppliers: 0 },
        inventory: { total_items: 0, total_quantity: 0, total_inventory_value: 0 }
      });
      setSalesTrends([]);
      setTopCustomers([]);
      setTopProducts([]);
      setConversionFunnel(null);
      setInventoryAnalytics(null);
      setSupplierAnalytics(null);
      setFinancialAnalytics(null);
      setAuditTrailAnalytics(null);
      setEnquirySourceAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (period: string) => {
    switch (period) {
      case "7d": return subDays(new Date(), 7);
      case "30d": return subDays(new Date(), 30);
      case "90d": return subDays(new Date(), 90);
      case "1y": return subYears(new Date(), 1);
      default: return subDays(new Date(), 30);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KW', {
      style: 'currency',
      currency: 'KWD'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-KW').format(value);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-500";
    if (current < previous) return "text-red-500";
    return "text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPI Cards */}
          {!kpis ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No analytics data available</p>
                <Button onClick={fetchAnalytics} variant="outline" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(kpis.enquiries?.total_enquiries || 0)}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTrendIcon(kpis.enquiries?.total_enquiries || 0, 0)}
                    <span>All time</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(kpis.quotations?.total_quotations || 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    Value: {formatCurrency(kpis.quotations?.total_quotation_value || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(kpis.salesOrders?.total_orders || 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    Value: {formatCurrency(kpis.salesOrders?.total_order_value || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(kpis.invoices?.total_paid_amount || 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    of {formatCurrency(kpis.invoices?.total_invoice_value || 0)} invoiced
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status Breakdown */}
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enquiry Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New</span>
                    <Badge variant="secondary">{kpis.enquiries?.new_enquiries || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="outline">{kpis.enquiries?.in_progress_enquiries || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quoted</span>
                    <Badge variant="default">{kpis.enquiries?.quoted_enquiries || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Closed</span>
                    <Badge variant="destructive">{kpis.enquiries?.closed_enquiries || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <Badge variant="secondary">{kpis.salesOrders?.pending_orders || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confirmed</span>
                    <Badge variant="outline">{kpis.salesOrders?.confirmed_orders || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Shipped</span>
                    <Badge variant="default">{kpis.salesOrders?.shipped_orders || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Delivered</span>
                    <Badge variant="default">{kpis.salesOrders?.delivered_orders || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retail</span>
                    <Badge variant="secondary">{kpis.customers?.retail_customers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wholesale</span>
                    <Badge variant="outline">{kpis.customers?.wholesale_customers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active</span>
                    <Badge variant="default">{kpis.customers?.active_customers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <Badge variant="destructive">{kpis.customers?.total_customers || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends</CardTitle>
              <CardDescription>Daily sales performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'count' ? formatNumber(value as number) : formatCurrency(value as number),
                        name === 'count' ? 'Orders' : 'Value'
                      ]}
                    />
                    <Area type="monotone" dataKey="count" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="total_value" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers and Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Best performing customers by order value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.customer_type} • {customer.order_count} orders
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(customer.total_value)}</div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(customer.avg_order_value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products by value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.supplier_code} • {product.category} • {product.order_count} orders
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.total_value)}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {formatNumber(product.total_quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          {conversionFunnel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Customer journey from enquiry to invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Enquiries</span>
                      <Badge variant="outline">{conversionFunnel.enquiries}</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Quotations</span>
                      <Badge variant="outline">{conversionFunnel.quotations}</Badge>
                    </div>
                    <Progress value={conversionFunnel.enquiry_to_quote_rate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {conversionFunnel.enquiry_to_quote_rate}% conversion rate
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Sales Orders</span>
                      <Badge variant="outline">{conversionFunnel.sales_orders}</Badge>
                    </div>
                    <Progress value={conversionFunnel.quote_to_order_rate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {conversionFunnel.quote_to_order_rate}% conversion rate
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Invoices</span>
                      <Badge variant="outline">{conversionFunnel.invoices}</Badge>
                    </div>
                    <Progress value={conversionFunnel.order_to_invoice_rate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {conversionFunnel.order_to_invoice_rate}% conversion rate
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rates</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {conversionFunnel.enquiry_to_quote_rate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Enquiry to Quote</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {conversionFunnel.quote_to_order_rate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Quote to Order</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {conversionFunnel.order_to_invoice_rate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Order to Invoice</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enquiry Source Analytics */}
          {enquirySourceAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Enquiry Sources</CardTitle>
                <CardDescription>Multi-channel enquiry performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enquirySourceAnalytics.email}</div>
                    <div className="text-sm text-muted-foreground">Email</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enquirySourceAnalytics.phone}</div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enquirySourceAnalytics.web_form}</div>
                    <div className="text-sm text-muted-foreground">Web Form</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enquirySourceAnalytics.walk_in}</div>
                    <div className="text-sm text-muted-foreground">Walk-in</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enquirySourceAnalytics.referral}</div>
                    <div className="text-sm text-muted-foreground">Referral</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Analytics Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {inventoryAnalytics && (
            <>
              {/* Inventory KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(inventoryAnalytics.total_items)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(inventoryAnalytics.total_quantity)} total quantity
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(inventoryAnalytics.total_inventory_value)}</div>
                    <div className="text-xs text-muted-foreground">
                      Total stock value
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{inventoryAnalytics.low_stock_items}</div>
                    <div className="text-xs text-muted-foreground">
                      Need reordering
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{inventoryAnalytics.out_of_stock_items}</div>
                    <div className="text-xs text-muted-foreground">
                      Urgent restock needed
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                  <CardDescription>Item distribution and value by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryAnalytics.category_breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, value }) => `${category}: ${formatCurrency(value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {inventoryAnalytics.category_breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Movements */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Movements</CardTitle>
                  <CardDescription>Recent inventory transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryAnalytics.stock_movements}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="receipts" fill="#82ca9d" name="Receipts" />
                        <Bar dataKey="issues" fill="#ffc658" name="Issues" />
                        <Bar dataKey="adjustments" fill="#ff7300" name="Adjustments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Supplier Analytics Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          {supplierAnalytics && (
            <>
              {/* Supplier KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{supplierAnalytics.total_suppliers}</div>
                    <div className="text-xs text-muted-foreground">
                      {supplierAnalytics.active_suppliers} active
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supplierAnalytics.top_suppliers.length > 0 
                        ? Math.round(supplierAnalytics.top_suppliers.reduce((acc, s) => acc + s.avg_delivery_time, 0) / supplierAnalytics.top_suppliers.length)
                        : 0} days
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average across suppliers
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quality Rating</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supplierAnalytics.top_suppliers.length > 0 
                        ? (supplierAnalytics.top_suppliers.reduce((acc, s) => acc + s.quality_rating, 0) / supplierAnalytics.top_suppliers.length).toFixed(1)
                        : 0}/5
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average rating
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Suppliers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Suppliers</CardTitle>
                  <CardDescription>Best performing suppliers by order value and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplierAnalytics.top_suppliers.map((supplier, index) => (
                      <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.order_count} orders • {supplier.avg_delivery_time} days avg delivery
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(supplier.total_value)}</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ {supplier.quality_rating}/5
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Performance Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Performance Matrix</CardTitle>
                  <CardDescription>Quality vs Delivery performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={supplierAnalytics.supplier_performance}>
                        <CartesianGrid />
                        <XAxis 
                          type="number" 
                          dataKey="on_time_delivery" 
                          name="On-Time Delivery %"
                          domain={[0, 100]}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="quality_score" 
                          name="Quality Score"
                          domain={[0, 5]}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value, name) => [
                            name === 'quality_score' ? `${value}/5` : `${value}%`,
                            name === 'quality_score' ? 'Quality Score' : 'On-Time Delivery'
                          ]}
                        />
                        <Scatter dataKey="cost_efficiency" fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="financial" className="space-y-4">
          {financialAnalytics && (
            <>
              {/* Financial KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialAnalytics.revenue.total_revenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {financialAnalytics.revenue.monthly_growth > 0 ? '+' : ''}{financialAnalytics.revenue.monthly_growth}% growth
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialAnalytics.profitability.gross_profit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {financialAnalytics.profitability.gross_margin}% margin
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <Target className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(financialAnalytics.profitability.net_profit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {financialAnalytics.profitability.net_margin}% margin
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost of Goods</CardTitle>
                    <Package className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(financialAnalytics.costs.cost_of_goods_sold)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(financialAnalytics.costs.total_costs)} total costs
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Channel</CardTitle>
                    <CardDescription>Retail vs Wholesale revenue breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Retail', value: financialAnalytics.revenue.retail_revenue, color: '#8884d8' },
                              { name: 'Wholesale', value: financialAnalytics.revenue.wholesale_revenue, color: '#82ca9d' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#8884d8" />
                            <Cell fill="#82ca9d" />
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Analysis</CardTitle>
                    <CardDescription>Markup and pricing performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Retail Markup</span>
                        <Badge variant="outline">{financialAnalytics.pricing_analysis.avg_retail_markup}%</Badge>
                      </div>
                      <Progress value={financialAnalytics.pricing_analysis.avg_retail_markup} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Wholesale Markup</span>
                        <Badge variant="outline">{financialAnalytics.pricing_analysis.avg_wholesale_markup}%</Badge>
                      </div>
                      <Progress value={financialAnalytics.pricing_analysis.avg_wholesale_markup} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Price Variance</span>
                        <Badge variant="outline">{financialAnalytics.pricing_analysis.price_variance}%</Badge>
                      </div>
                      <Progress value={Math.abs(financialAnalytics.pricing_analysis.price_variance)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Compliance & Audit Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {auditTrailAnalytics && (
            <>
              {/* Compliance KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(auditTrailAnalytics.total_actions)}</div>
                    <div className="text-xs text-muted-foreground">
                      System activities tracked
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                    <Shield className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{auditTrailAnalytics.compliance_score}%</div>
                    <div className="text-xs text-muted-foreground">
                      System compliance rating
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{auditTrailAnalytics.user_activity.length}</div>
                    <div className="text-xs text-muted-foreground">
                      Users with recent activity
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Recent user actions and activity levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditTrailAnalytics.user_activity.map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {user.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Last activity: {new Date(user.last_activity).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{user.action_count} actions</div>
                          <div className="text-sm text-muted-foreground">
                            Total activities
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Critical Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Critical Actions</CardTitle>
                  <CardDescription>High-priority system actions and their frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditTrailAnalytics.critical_actions.map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-medium">{action.action}</div>
                            <div className="text-sm text-muted-foreground">
                              Last occurred: {new Date(action.last_occurred).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="destructive">{action.count} times</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
