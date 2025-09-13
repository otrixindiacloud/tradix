import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WorkflowStepper from "@/components/workflow/workflow-stepper";
import StepCard from "@/components/workflow/step-card";
import DataTable from "@/components/tables/data-table";
import AIInsightsWidget from "@/components/ai-assistant/ai-insights-widget";
import { NotificationDemo } from "@/components/notifications/notification-demo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Download, Plus, TrendingUp, TrendingDown, Eye, CheckCircle, HelpCircle, FileText, ShoppingCart, DollarSign, CheckCircle2, Upload, Package, BarChart3 } from "lucide-react";
import { 
  FaDownload, 
  FaPlus, 
  FaEye, 
  FaCheckCircle, 
  FaQuestionCircle, 
  FaFileInvoice, 
  FaShoppingCart, 
  FaDollarSign, 
  FaCheckCircle as FaCheckCircle2, 
  FaUpload, 
  FaBox,
  FaHome,
  FaTruck,
  FaWarehouse,
  FaBoxes,
  FaMoneyBillWave,
  FaChartBar,
  FaRobot,
  FaActivity,
  FaCog,
  FaUsers,
  FaBell,
  FaHistory,
  FaFileExport,
  FaChartLine,
  FaCogs,
  FaUserCog,
  FaDatabase,
  FaClipboardList,
  FaTruckLoading,
  FaBoxOpen,
  FaBrain,
  FaTasks,
  FaFileAlt,
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaTruckMoving,
  FaSync,
  FaBuilding,
  FaReceipt
} from "react-icons/fa";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [selectedEnquiries, setSelectedEnquiries] = useState<string[]>([]);
  
  // Load selected enquiries from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedEnquiries');
    if (saved) {
      try {
        setSelectedEnquiries(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing selected enquiries from localStorage:', error);
      }
    }
  }, []);

  // Save selected enquiries to localStorage whenever it changes
  useEffect(() => {
    if (selectedEnquiries.length > 0) {
      localStorage.setItem('selectedEnquiries', JSON.stringify(selectedEnquiries));
    } else {
      localStorage.removeItem('selectedEnquiries');
    }
  }, [selectedEnquiries]);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
  });

  const { data: enquiries, isLoading: enquiriesLoading } = useQuery({
    queryKey: ["/api/enquiries"],
    queryFn: async () => {
      const response = await fetch("/api/enquiries?limit=5");
      if (!response.ok) {
        throw new Error('Failed to fetch enquiries');
      }
      return response.json();
    },
  });

  const { data: salesOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/sales-orders"],
    queryFn: async () => {
      const response = await fetch("/api/sales-orders?limit=5");
      if (!response.ok) {
        throw new Error('Failed to fetch sales orders');
      }
      return response.json();
    },
  });

  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ["/api/quotations"],
    queryFn: async () => {
      const response = await fetch("/api/quotations?limit=5");
      if (!response.ok) {
        throw new Error('Failed to fetch quotations');
      }
      return response.json();
    },
  });


  // Task action handlers
  const handleTaskAction = (task: any) => {
    switch (task.action.toLowerCase()) {
      case "review":
        // Navigate to quotation that needs review
        if (task.description.includes("QT-")) {
          const quoteId = task.description.match(/QT-\d+-\d+/)?.[0];
          setLocation(`/quotations?search=${quoteId}`);
        }
        break;
      case "validate":
        // Navigate to sales order for validation
        if (task.description.includes("SO-")) {
          const orderId = task.description.match(/SO-\d+-\d+/)?.[0];
          setLocation(`/sales-orders?search=${orderId}`);
        }
        break;
      case "create":
        // Navigate to supplier LPO creation
        if (task.description.includes("SO-")) {
          setLocation("/supplier-lpo");
        }
        break;
      case "update":
        // Navigate to inventory management
        setLocation("/inventory-management");
        break;
      default:
        // Mark as complete
        setCompletedTasks(prev => [...prev, task.id]);
        break;
    }
  };

  const isTaskCompleted = (taskId: number) => completedTasks.includes(taskId);

  const enquiryColumns = [
    {
      key: "enquiryNumber",
      header: "Enquiry ID",
      render: (value: string) => (
        <span className="font-mono text-sm text-gray-600">{value}</span>
      ),
    },
    {
      key: "customer.name",
      header: "Customer",
      render: (value: string, item: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{item.customer?.name || "Unknown"}</p>
          <p className="text-xs text-gray-600">{item.customer?.customerType || "-"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
    },
    {
      key: "enquiryDate",
      header: "Date",
      className: "text-right",
    },
    {
      key: "actions",
      header: "Actions",
      render: (value: string, item: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/enquiries/${item.id}`);
          }}
          data-testid={`button-view-details-enquiry-${item.id}`}
        >
          <FaEye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      ),
    },
  ];

  const orderColumns = [
    {
      key: "orderNumber",
      header: "Order ID",
      render: (value: string) => (
        <span className="font-mono text-sm text-gray-600">{value}</span>
      ),
    },
    {
      key: "customer.name",
      header: "Customer",
      render: (value: string, item: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{item.customer?.name || "Unknown"}</p>
          <p className="text-xs text-gray-600">{item.customer?.classification || "-"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
    },
    {
      key: "totalAmount",
      header: "Value",
      className: "text-right",
    },
    {
      key: "actions",
      header: "Actions",
      render: (value: string, item: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/sales-orders/${item.id}`);
          }}
          data-testid={`button-view-details-order-${item.id}`}
        >
          <FaEye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      ),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      icon: FaCheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      message: "Quote #QT-2024-005 accepted by Al Rawi Trading",
      time: "2 minutes ago",
    },
    {
      id: 2,
      icon: FaUpload,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      message: "PO document uploaded for SO-2024-012",
      time: "15 minutes ago",
    },
    {
      id: 3,
      icon: FaQuestionCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      message: "New enquiry received from Gulf Construction Co.",
      time: "1 hour ago",
    },
    {
      id: 4,
      icon: FaBox,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      message: "Goods received for LPO-SUP-001",
      time: "3 hours ago",
    },
  ];

  const urgentTasks = [
    {
      id: 1,
      title: "Quote approval required",
      description: "QT-2024-007 - Exceeds discount limit",
      priority: "urgent",
      action: "Review",
    },
    {
      id: 2,
      title: "PO validation pending",
      description: "SO-2024-015 - Quantity mismatch",
      priority: "high",
      action: "Validate",
    },
    {
      id: 3,
      title: "Supplier LPO creation",
      description: "SO-2024-013 - Ready for processing",
      priority: "medium",
      action: "Create",
    },
    {
      id: 4,
      title: "Inventory update",
      description: "GR-2024-008 - Goods received",
      priority: "low",
      action: "Update",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-50 border-red-200";
      case "high":
        return "bg-orange-50 border-orange-200";
      case "medium":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
              Process Flow Dashboard
            </h2>
            <p className="text-gray-600 text-lg">
              End-to-end automation from customer enquiry to invoicing
            </p>
          </div>
          <div className="flex space-x-3">
            <Button className="btn-primary flex items-center space-x-2" data-testid="button-new-enquiry" onClick={() => setLocation("/enquiries?new=true")}>
              <FaPlus className="h-4 w-4" />
              <span>New Enquiry</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2 hover:bg-gray-50" data-testid="button-export" onClick={() => window.print()}>
              <FaDownload className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Sequential Workflow Stepper */}
        <WorkflowStepper 
          currentStep={quotations && quotations.length > 0 ? 3 : 1}
          completedSteps={quotations && quotations.length > 0 ? [1, 2] : []}
          quotationId={quotations?.[0]?.id}
          quotationNumber={quotations?.[0]?.quoteNumber || "QT-2024-001"}
          onMarkComplete={() => {
            // Handle mark complete action - navigate to customer acceptance
            if (quotations?.[0]?.id) {
              setLocation(`/quotations/${quotations[0].id}/acceptance`);
            } else {
              // If no quotation, navigate to create one
              setLocation('/quotations/new');
            }
          }}
          onViewDetails={() => {
            // Handle view details action - navigate to process flow details
            setLocation(`/process-flow-details`);
          }}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label">Active Enquiries</p>
                <p className="kpi-value" data-testid="stat-active-enquiries">
                  {statsLoading ? "..." : stats?.activeEnquiries || 0}
                </p>
              </div>
              <div className="kpi-icon bg-amber-100">
                <FaQuestionCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 kpi-trend-up mr-1" />
              <span className="kpi-trend-up">+12%</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
          </div>
        </div>

        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label">Pending Quotes</p>
                <p className="kpi-value" data-testid="stat-pending-quotes">
                  {statsLoading ? "..." : stats?.pendingQuotes || 0}
                </p>
              </div>
              <div className="kpi-icon bg-gray-100">
                <FaFileInvoice className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 kpi-trend-down mr-1" />
              <span className="kpi-trend-down">-5%</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
          </div>
        </div>

        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label">Active Orders</p>
                <p className="kpi-value" data-testid="stat-active-orders">
                  {statsLoading ? "..." : stats?.activeOrders || 0}
                </p>
              </div>
              <div className="kpi-icon bg-green-100">
                <FaShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 kpi-trend-up mr-1" />
              <span className="kpi-trend-up">+8%</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
          </div>
        </div>

        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label">Revenue (Month)</p>
                <p className="kpi-value" data-testid="stat-monthly-revenue">
                  {statsLoading ? "..." : formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
              </div>
              <div className="kpi-icon bg-green-100">
                <FaDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 kpi-trend-up mr-1" />
              <span className="kpi-trend-up">+23%</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Enquiries Progress Section */}
      {selectedEnquiries.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Selected Enquiries Progress ({selectedEnquiries.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/enquiries")}
              >
                Manage Selections
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries?.find((e: any) => e.id === id);
                          return enquiry?.status === "New";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">New</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="text-2xl font-bold text-amber-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries?.find((e: any) => e.id === id);
                          return enquiry?.status === "In Progress";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries?.find((e: any) => e.id === id);
                          return enquiry?.status === "Quoted";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">Quoted</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries?.find((e: any) => e.id === id);
                          return enquiry?.status === "Closed";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">Closed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Enquiries List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Selected Enquiries:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEnquiries.map(enquiryId => {
                    const enquiry = enquiries?.find((e: any) => e.id === enquiryId);
                    return enquiry ? (
                      <div key={enquiryId} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <Badge variant="outline" className={getStatusColor(enquiry.status)}>
                          {enquiry.status}
                        </Badge>
                        <span className="font-mono text-sm text-gray-700">{enquiry.enquiryNumber}</span>
                        <span className="text-sm text-gray-500">
                          {enquiry.customer?.name || "Unknown Customer"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/enquiries/${enquiry.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Widget */}
      <div className="mb-8">
        <AIInsightsWidget page="/dashboard" data={stats} />
      </div>

      {/* Notification Demo */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Notification System Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationDemo />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Current Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activities</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-view-all-activities" onClick={() => setLocation("/recent-activities")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900" data-testid={`activity-${activity.id}`}>
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-600">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tasks Requiring Action</CardTitle>
            <Badge className="bg-red-500 text-white" data-testid="badge-urgent-tasks">
              5 Urgent
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${getPriorityColor(task.priority)} ${isTaskCompleted(task.id) ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`}></div>
                    <div>
                      <p className={`text-sm font-medium text-gray-900 ${isTaskCompleted(task.id) ? 'line-through' : ''}`} data-testid={`task-title-${task.id}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-600" data-testid={`task-description-${task.id}`}>
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTaskCompleted(task.id) ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <FaCheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTaskAction(task)}
                          data-testid={`button-${task.action.toLowerCase()}-${task.id}`}
                        >
                          {task.action}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCompletedTasks(prev => [...prev, task.id])}
                          data-testid={`button-mark-complete-${task.id}`}
                        >
                          <FaCheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Enquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Enquiries</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-manage-all-enquiries" onClick={() => setLocation("/enquiries")}>
              Manage All
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={enquiries?.slice(0, 5) || []}
              columns={enquiryColumns}
              isLoading={enquiriesLoading}
              emptyMessage="No enquiries found"
            />
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Sales Orders</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-view-all-orders" onClick={() => setLocation("/sales-orders")}>
              View All Orders
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={salesOrders?.slice(0, 5) || []}
              columns={orderColumns}
              isLoading={ordersLoading}
              emptyMessage="No active orders found"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
