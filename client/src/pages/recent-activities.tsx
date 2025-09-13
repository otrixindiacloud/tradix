import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Activity, 
  Filter, 
  Download, 
  RefreshCw, 
  Search, 
  CalendarIcon,
  Eye,
  CheckCircle2,
  Upload,
  HelpCircle,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Truck,
  Building2,
  DollarSign,
  AlertCircle,
  Clock,
  User,
  ArrowRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'enquiry' | 'quotation' | 'sales_order' | 'invoice' | 'purchase_order' | 'goods_receipt' | 'delivery' | 'inventory' | 'customer' | 'supplier' | 'user' | 'system';
  action: string;
  title: string;
  description: string;
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  timestamp: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

interface ActivityStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  byUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
}

const activityTypes = [
  { value: 'enquiry', label: 'Enquiries', icon: HelpCircle, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { value: 'quotation', label: 'Quotations', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'sales_order', label: 'Sales Orders', icon: ShoppingCart, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'invoice', label: 'Invoices', icon: Receipt, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'purchase_order', label: 'Purchase Orders', icon: Upload, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { value: 'goods_receipt', label: 'Goods Receipt', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 'delivery', label: 'Deliveries', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'inventory', label: 'Inventory', icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { value: 'customer', label: 'Customers', icon: User, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { value: 'supplier', label: 'Suppliers', icon: Building2, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { value: 'user', label: 'Users', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { value: 'system', label: 'System', icon: Activity, color: 'text-gray-600', bgColor: 'bg-gray-100' }
];

const actionTypes = [
  'created', 'updated', 'deleted', 'viewed', 'approved', 'rejected', 
  'sent', 'received', 'completed', 'cancelled', 'assigned', 'notified'
];

export default function RecentActivitiesPage() {
  const [, setLocation] = useLocation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    type: "all",
    action: "all",
    userId: "",
    startDate: "",
    endDate: "",
    search: "",
    priority: "all"
  });

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  const [activeTab, setActiveTab] = useState("all");

  // Mock data for demonstration
  const mockActivities: ActivityItem[] = [
    {
      id: "1",
      type: "quotation",
      action: "created",
      title: "New Quotation Created",
      description: "Quotation QT-2024-015 created for Al Rawi Trading",
      entityId: "QT-2024-015",
      entityName: "Al Rawi Trading",
      userId: "user-001",
      userName: "Ahmed Al-Mansouri",
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: "Draft",
      priority: "medium"
    },
    {
      id: "2",
      type: "enquiry",
      action: "received",
      title: "New Enquiry Received",
      description: "Enquiry ENQ-2024-089 received from Gulf Construction Co.",
      entityId: "ENQ-2024-089",
      entityName: "Gulf Construction Co.",
      userId: "system",
      userName: "System",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: "New",
      priority: "high"
    },
    {
      id: "3",
      type: "sales_order",
      action: "approved",
      title: "Sales Order Approved",
      description: "Sales Order SO-2024-012 approved and ready for processing",
      entityId: "SO-2024-012",
      entityName: "Al Rawi Trading",
      userId: "user-002",
      userName: "Sarah Johnson",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "Approved",
      priority: "high"
    },
    {
      id: "4",
      type: "goods_receipt",
      action: "completed",
      title: "Goods Receipt Completed",
      description: "Goods received for LPO-SUP-001 from ABC Suppliers",
      entityId: "GR-2024-008",
      entityName: "ABC Suppliers",
      userId: "user-003",
      userName: "Mohammed Hassan",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "Completed",
      priority: "medium"
    },
    {
      id: "5",
      type: "invoice",
      action: "sent",
      title: "Invoice Sent",
      description: "Invoice INV-2024-045 sent to customer",
      entityId: "INV-2024-045",
      entityName: "Al Rawi Trading",
      userId: "user-001",
      userName: "Ahmed Al-Mansouri",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: "Sent",
      priority: "low"
    },
    {
      id: "6",
      type: "delivery",
      action: "completed",
      title: "Delivery Completed",
      description: "Delivery DEL-2024-023 completed successfully",
      entityId: "DEL-2024-023",
      entityName: "Gulf Construction Co.",
      userId: "user-004",
      userName: "Ali Al-Rashid",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: "Delivered",
      priority: "medium"
    },
    {
      id: "7",
      type: "inventory",
      action: "updated",
      title: "Inventory Updated",
      description: "Stock levels updated for Steel Beams (Item #STB-001)",
      entityId: "STB-001",
      entityName: "Steel Beams",
      userId: "user-003",
      userName: "Mohammed Hassan",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "Updated",
      priority: "low"
    },
    {
      id: "8",
      type: "customer",
      action: "created",
      title: "New Customer Added",
      description: "New customer 'Dubai Steel Works' added to the system",
      entityId: "CUST-2024-012",
      entityName: "Dubai Steel Works",
      userId: "user-002",
      userName: "Sarah Johnson",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      status: "Active",
      priority: "medium"
    },
    {
      id: "9",
      type: "quotation",
      action: "accepted",
      title: "Quotation Accepted",
      description: "Quotation QT-2024-010 accepted by customer",
      entityId: "QT-2024-010",
      entityName: "Emirates Construction",
      userId: "system",
      userName: "System",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: "Accepted",
      priority: "high"
    },
    {
      id: "10",
      type: "purchase_order",
      action: "created",
      title: "Purchase Order Created",
      description: "Purchase Order PO-2024-007 created for supplier",
      entityId: "PO-2024-007",
      entityName: "Steel Suppliers Ltd",
      userId: "user-001",
      userName: "Ahmed Al-Mansouri",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "Created",
      priority: "medium"
    }
  ];

  const mockStats: ActivityStats = {
    total: 1250,
    today: 45,
    thisWeek: 320,
    thisMonth: 1250,
    byType: [
      { type: 'enquiry', count: 180, percentage: 14.4 },
      { type: 'quotation', count: 220, percentage: 17.6 },
      { type: 'sales_order', count: 190, percentage: 15.2 },
      { type: 'invoice', count: 165, percentage: 13.2 },
      { type: 'purchase_order', count: 140, percentage: 11.2 },
      { type: 'goods_receipt', count: 120, percentage: 9.6 },
      { type: 'delivery', count: 110, percentage: 8.8 },
      { type: 'inventory', count: 85, percentage: 6.8 },
      { type: 'customer', count: 25, percentage: 2.0 },
      { type: 'supplier', count: 15, percentage: 1.2 }
    ],
    byUser: [
      { userId: 'user-001', userName: 'Ahmed Al-Mansouri', count: 320 },
      { userId: 'user-002', userName: 'Sarah Johnson', count: 280 },
      { userId: 'user-003', userName: 'Mohammed Hassan', count: 250 },
      { userId: 'user-004', userName: 'Ali Al-Rashid', count: 200 },
      { userId: 'system', userName: 'System', count: 200 }
    ]
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/recent-activities?${params}`);
      const data = await response.json();
      
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Fallback to mock data if API fails
      setActivities(mockActivities);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/recent-activities/stats?${params}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      // Fallback to mock stats if API fails
      setStats(mockStats);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [filters, pagination.page]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters, pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    setDateRange({ from, to });
    setFilters(prev => ({
      ...prev,
      startDate: from ? format(from, "yyyy-MM-dd") : "",
      endDate: to ? format(to, "yyyy-MM-dd") : ""
    }));
  };

  const exportActivities = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/recent-activities/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recent-activities-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting activities:", error);
    }
  };

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type);
    return activityType ? activityType.icon : Activity;
  };

  const getActivityColor = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type);
    return activityType ? activityType.color : 'text-gray-600';
  };

  const getActivityBgColor = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type);
    return activityType ? activityType.bgColor : 'bg-gray-100';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'created': return 'default';
      case 'updated': return 'secondary';
      case 'deleted': return 'destructive';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'enquiry':
        setLocation(`/enquiries/${activity.entityId}`);
        break;
      case 'quotation':
        setLocation(`/quotations/${activity.entityId}`);
        break;
      case 'sales_order':
        setLocation(`/sales-orders/${activity.entityId}`);
        break;
      case 'invoice':
        setLocation(`/invoicing`);
        break;
      case 'purchase_order':
        setLocation(`/supplier-lpo`);
        break;
      case 'goods_receipt':
        setLocation(`/goods-receipt`);
        break;
      case 'delivery':
        setLocation(`/delivery`);
        break;
      case 'inventory':
        setLocation(`/inventory`);
        break;
      case 'customer':
        setLocation(`/enquiries`);
        break;
      case 'supplier':
        setLocation(`/suppliers`);
        break;
      default:
        break;
    }
  };

  const filteredActivities = activities.filter(activity => {
    // Apply date range filtering first (overrides tab-based filtering)
    if (filters.startDate || filters.endDate) {
      const activityDate = new Date(activity.timestamp);
      const activityDateStr = format(activityDate, "yyyy-MM-dd");
      
      if (filters.startDate && activityDateStr < filters.startDate) {
        return false;
      }
      if (filters.endDate && activityDateStr > filters.endDate) {
        return false;
      }
    } else {
      // Apply tab-based filtering only if no date range is selected
      if (activeTab === "all") return true;
      if (activeTab === "today") {
        const today = new Date();
        const activityDate = new Date(activity.timestamp);
        return activityDate.toDateString() === today.toDateString();
      }
      if (activeTab === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(activity.timestamp) >= weekAgo;
      }
      if (activeTab === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(activity.timestamp) >= monthAgo;
      }
    }

    // Apply other filters
    if (filters.type && filters.type !== "all" && activity.type !== filters.type) {
      return false;
    }
    if (filters.action && filters.action !== "all" && activity.action !== filters.action) {
      return false;
    }
    if (filters.priority && filters.priority !== "all" && activity.priority !== filters.priority) {
      return false;
    }
    if (filters.search && !activity.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !activity.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Recent Activities
          </h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions across the ERP platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchActivities} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportActivities} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">Activities today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Activity Type</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Date Range</Label>
                  {dateRange.from && (
                    <Badge variant="secondary" className="text-xs">
                      Filter Active
                    </Badge>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground",
                        dateRange.from && "border-blue-300 bg-blue-50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={8}>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => handleDateRangeChange(range?.from, range?.to)}
                      numberOfMonths={2}
                      disabled={(date) => date > new Date()}
                      modifiers={{
                        today: new Date(),
                      }}
                      modifiersClassNames={{
                        today: "bg-blue-100 text-blue-900 font-semibold",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Quick Filters</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!dateRange.from ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      handleDateRangeChange(today, today);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date();
                      weekAgo.setDate(today.getDate() - 7);
                      handleDateRangeChange(weekAgo, today);
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date();
                      monthAgo.setMonth(today.getMonth() - 1);
                      handleDateRangeChange(monthAgo, today);
                    }}
                  >
                    Last 30 days
                  </Button>
                  {dateRange.from && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDateRangeChange(undefined, undefined);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Activities</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity Feed</CardTitle>
                  <CardDescription>
                    Showing {filteredActivities.length} activities
                    {filters.startDate && filters.endDate && (
                      <span className="ml-2 text-blue-600">
                        • Filtered by date range: {format(new Date(filters.startDate), "MMM dd")} - {format(new Date(filters.endDate), "MMM dd, yyyy")}
                      </span>
                    )}
                  </CardDescription>
                </div>
                {filters.startDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleDateRangeChange(undefined, undefined);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear Date Filter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type);
                    const color = getActivityColor(activity.type);
                    const bgColor = getActivityBgColor(activity.type);
                    
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`h-5 w-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {activity.title}
                              </h3>
                              <Badge variant={getActionBadgeVariant(activity.action)}>
                                {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                              </Badge>
                              {activity.priority && (
                                <Badge className={getPriorityColor(activity.priority)}>
                                  {activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{activity.userName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="font-mono">{activity.entityId}</span>
                              </div>
                              {activity.status && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredActivities.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                      <p className="text-gray-500">Try adjusting your filters or check back later.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {pagination.pages > 5 && (
                        <>
                          <span className="text-gray-500">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                            className="w-8 h-8 p-0"
                          >
                            {pagination.pages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
