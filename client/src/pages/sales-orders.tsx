import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Search, Filter, FileText, Truck, Package, 
  AlertCircle, CheckCircle, Clock, Copy, RefreshCw,
  Edit, Trash2, Eye, Download, Upload, FileCheck
} from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { SalesOrder, SalesOrderItem, Quotation, Customer } from "@shared/schema";

interface SalesOrderWithRelations extends SalesOrder {
  customer?: Customer;
  items?: SalesOrderItem[];
}

interface QuotationWithRelations extends Quotation {
  customer?: Customer;
}

export default function SalesOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderWithRelations | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAmendDialog, setShowAmendDialog] = useState(false);
  const [showLpoValidationDialog, setShowLpoValidationDialog] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [lpoValidationStatus, setLpoValidationStatus] = useState("");
  const [lpoValidationNotes, setLpoValidationNotes] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: salesOrders = [], isLoading, error: ordersError } = useQuery<SalesOrderWithRelations[]>({
    queryKey: ["/api/sales-orders"],
    queryFn: async () => {
      const response = await fetch("/api/sales-orders");
      if (!response.ok) {
        throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: quotations = [], error: quotationsError } = useQuery<QuotationWithRelations[]>({
    queryKey: ["/api/quotations"],
    queryFn: async () => {
      const response = await fetch("/api/quotations");
      if (!response.ok) {
        throw new Error(`Failed to fetch quotations: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: customers = [], error: customersError } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: selectedOrderItems = [] } = useQuery<SalesOrderItem[]>({
    queryKey: ["/api/sales-orders", selectedOrder?.id, "items"],
    enabled: !!selectedOrder?.id,
  });

  // Mutations
  const createSalesOrderFromQuotation = useMutation({
    mutationFn: async ({ quotationId, customerAcceptanceId, userId }: { 
      quotationId: string; 
      customerAcceptanceId?: string; 
      userId?: string; 
    }) => {
      const response = await apiRequest("POST", "/api/sales-orders/from-quotation", {
        quotationId,
        customerAcceptanceId,
        userId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Sales order created successfully from quotation",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create sales order from quotation",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/sales-orders/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const createAmendedOrder = useMutation({
    mutationFn: async ({ id, reason, userId }: { id: string; reason: string; userId?: string }) => {
      const response = await apiRequest("POST", `/api/sales-orders/${id}/amend`, {
        reason,
        userId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      setShowAmendDialog(false);
      setAmendmentReason("");
      toast({
        title: "Success",
        description: "Amended sales order created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create amended sales order",
        variant: "destructive",
      });
    },
  });

  const validateCustomerLpo = useMutation({
    mutationFn: async ({ id, status, notes, validatedBy }: { 
      id: string; 
      status: string; 
      notes?: string; 
      validatedBy: string; 
    }) => {
      const response = await apiRequest("PUT", `/api/sales-orders/${id}/validate-lpo`, {
        status,
        notes,
        validatedBy,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      setShowLpoValidationDialog(false);
      setLpoValidationStatus("");
      setLpoValidationNotes("");
      toast({
        title: "Success",
        description: "Customer LPO validation completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to validate customer LPO",
        variant: "destructive",
      });
    },
  });

  const deleteSalesOrder = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/sales-orders/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      toast({
        title: "Success",
        description: "Sales order deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete sales order",
        variant: "destructive",
      });
    },
  });

  // Filter logic
  const filteredOrders = salesOrders.filter((order) => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPoNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || order.status === statusFilter;
    const matchesCustomer = !customerFilter || customerFilter === "all" || order.customerId === customerFilter;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Get quotations ready for sales order creation
  const readyQuotations = quotations.filter((q) => 
    q.status === "Accepted"
  );

  const columns: Column<SalesOrderWithRelations>[] = [
    {
      key: "orderNumber",
      header: "Order Number",
      render: (value: string, order) => (
        <div>
          <span className="font-mono text-sm text-blue-600 font-medium">{value}</span>
          {(order.version ?? 1) > 1 && (
            <Badge variant="outline" className="ml-2 text-xs">
              v{order.version ?? 1}
            </Badge>
          )}
          {order.parentOrderId && (
            <Badge variant="outline" className="ml-1 text-xs text-orange-600">
              AMD
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (customer: Customer) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {customer?.name || "Unknown Customer"}
          </p>
          <p className="text-xs text-gray-600">
            {customer?.customerType || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "customerPoNumber",
      header: "Customer PO",
      render: (value: string | null) => (
        <span className="font-mono text-sm">{value || "-"}</span>
      ),
    },
    {
      key: "sourceType",
      header: "Source",
      render: (value: string) => (
        <Badge variant={value === "Auto" ? "default" : "outline"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "customerLpoValidationStatus",
      header: "LPO Status",
      render: (value: string | null, order) => {
        if (!order.customerLpoRequired) {
          return <span className="text-gray-400">N/A</span>;
        }
        
        const statusColors = {
          "Pending": "underline decoration-yellow-500 text-yellow-700",
          "Approved": "underline decoration-green-500 text-green-700",
          "Rejected": "underline decoration-red-500 text-red-700",
        };
        
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || "underline decoration-gray-500 text-gray-700"}>
            {value || "Pending"}
          </Badge>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Order Value",
      render: (value: number | null) => value ? formatCurrency(Number(value)) : "-",
      className: "text-right",
    },
    {
      key: "orderDate",
      header: "Order Date",
      render: (value: string | null) => value ? formatDate(new Date(value)) : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, order) => (
        <div className="flex items-center space-x-1">
          {order.status === "Draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({
                  open: true,
                  title: "Confirm Sales Order",
                  description: `Are you sure you want to confirm sales order ${order.orderNumber}? This action cannot be undone.`,
                  onConfirm: () => updateOrderStatus.mutate({ id: order.id, status: "Confirmed" }),
                });
              }}
              disabled={updateOrderStatus.isPending}
              data-testid={`button-confirm-${order.id}`}
            >
              {updateOrderStatus.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm
                </>
              )}
            </Button>
          )}
          
          {order.status === "Confirmed" && order.customerLpoValidationStatus === "Approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus.mutate({ id: order.id, status: "Processing" });
              }}
              data-testid={`button-process-${order.id}`}
            >
              <Package className="h-4 w-4 mr-1" />
              Process
            </Button>
          )}
          
          {order.status === "Processing" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus.mutate({ id: order.id, status: "Shipped" });
              }}
              data-testid={`button-ship-${order.id}`}
            >
              <Truck className="h-4 w-4 mr-1" />
              Ship
            </Button>
          )}
          
          {order.customerLpoRequired && order.customerLpoValidationStatus === "Pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(order);
                setShowLpoValidationDialog(true);
              }}
              data-testid={`button-validate-lpo-${order.id}`}
            >
              <FileCheck className="h-4 w-4 mr-1" />
              Validate LPO
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
              setShowAmendDialog(true);
            }}
            data-testid={`button-amend-${order.id}`}
          >
            <Edit className="h-4 w-4 mr-1" />
            Amend
          </Button>
          
          {order.status === "Draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({
                  open: true,
                  title: "Delete Sales Order",
                  description: `Are you sure you want to delete sales order ${order.orderNumber}? This action cannot be undone.`,
                  onConfirm: () => deleteSalesOrder.mutate(order.id),
                  variant: "destructive",
                });
              }}
              disabled={deleteSalesOrder.isPending}
              data-testid={`button-delete-${order.id}`}
            >
              {deleteSalesOrder.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
            }}
            data-testid={`button-view-${order.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const orderStats = {
    draft: salesOrders.filter((o) => o.status === "Draft").length,
    confirmed: salesOrders.filter((o) => o.status === "Confirmed").length,
    processing: salesOrders.filter((o) => o.status === "Processing").length,
    shipped: salesOrders.filter((o) => o.status === "Shipped").length,
    delivered: salesOrders.filter((o) => o.status === "Delivered").length,
    pendingLpo: salesOrders.filter((o) => o.customerLpoRequired && o.customerLpoValidationStatus === "Pending").length,
  };

  return (
    <div>
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-6 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Orders</h2>
          <p className="text-gray-600 text-base mt-1">Step 5: Manage sales orders with auto-creation, barcode enforcement, version control, and LPO validation</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-new-sales-order"
        >
          <span className="text-xl font-bold">+</span> New Sales Order
        </button>
      </div>

      {/* Quick Actions for Ready Quotations */}
      {readyQuotations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-green-600" />
              Ready for Sales Order Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {readyQuotations.slice(0, 3).map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {quotation.quoteNumber} - {quotation.customer?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Value: {formatCurrency(Number(quotation.totalAmount) || 0)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createSalesOrderFromQuotation.mutate({ quotationId: quotation.id, userId: "default-user-id" })}
                    disabled={createSalesOrderFromQuotation.isPending}
                    data-testid={`button-create-so-${quotation.id}`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Sales Order
                  </Button>
                </div>
              ))}
              {readyQuotations.length > 3 && (
                <p className="text-sm text-gray-600 text-center">
                  +{readyQuotations.length - 3} more quotations ready for sales order creation
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Edit className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-lg font-bold text-black">Draft</p>
                <p className="text-2xl font-bold text-gray-600" data-testid="stat-draft-orders">
                  {orderStats.draft}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-lg font-bold text-black">Confirmed</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-confirmed-orders">
                  {orderStats.confirmed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Package className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-lg font-bold text-black">Processing</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-processing-orders">
                  {orderStats.processing}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Truck className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-lg font-bold text-black">Shipped</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="stat-shipped-orders">
                  {orderStats.shipped}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-lg font-bold text-black">Delivered</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-delivered-orders">
                  {orderStats.delivered}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Clock className="h-6 w-6 text-orange-400" />
              <div>
                <p className="text-lg font-bold text-black">Pending LPO</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending-lpo">
                  {orderStats.pendingLpo}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sales Orders</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
                  data-testid="input-search-orders"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-48 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setCustomerFilter("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ordersError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading sales orders: {ordersError.message}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] })}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              data={filteredOrders}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No sales orders found. Sales orders are created from accepted quotations with uploaded POs."
              onRowClick={(order) => {
                setSelectedOrder(order);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Sales Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Sales Order from Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a quotation to create a sales order. Only quotations with accepted status and uploaded customer PO documents are shown.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {readyQuotations.map((quotation) => (
                <div key={quotation.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quotation.quoteNumber}</p>
                      <p className="text-sm text-gray-600">Customer: {quotation.customer?.name}</p>
                      <p className="text-sm text-gray-600">Value: {formatCurrency(Number(quotation.totalAmount) || 0)}</p>
                    </div>
                    <Button
                      onClick={() => createSalesOrderFromQuotation.mutate({ quotationId: quotation.id, userId: "default-user-id" })}
                      disabled={createSalesOrderFromQuotation.isPending}
                      data-testid={`button-create-from-${quotation.id}`}
                    >
                      Create Sales Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment Dialog */}
      <Dialog open={showAmendDialog} onOpenChange={setShowAmendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Amended Sales Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amendment-reason">Amendment Reason *</Label>
              <Textarea
                id="amendment-reason"
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                placeholder="Enter the reason for this amendment..."
                className="mt-1"
                data-testid="textarea-amendment-reason"
              />
            </div>
            <p className="text-sm text-gray-600">
              This will create a new version of the sales order with version {(selectedOrder?.version || 1) + 1}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAmendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder && amendmentReason.trim()) {
                  createAmendedOrder.mutate({
                    id: selectedOrder.id,
                    reason: amendmentReason.trim(),
                    userId: "current-user-id", // In real app, get from auth
                  });
                }
              }}
              disabled={!amendmentReason.trim() || createAmendedOrder.isPending}
              data-testid="button-create-amendment"
            >
              Create Amendment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LPO Validation Dialog */}
      <Dialog open={showLpoValidationDialog} onOpenChange={setShowLpoValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Customer LPO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="validation-status">Validation Status *</Label>
              <Select value={lpoValidationStatus} onValueChange={setLpoValidationStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select validation status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="validation-notes">Validation Notes</Label>
              <Textarea
                id="validation-notes"
                value={lpoValidationNotes}
                onChange={(e) => setLpoValidationNotes(e.target.value)}
                placeholder="Enter validation notes (optional)..."
                className="mt-1"
                data-testid="textarea-validation-notes"
              />
            </div>
            {selectedOrder && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">Order: {selectedOrder.orderNumber}</p>
                <p className="text-sm text-gray-600">Customer PO: {selectedOrder.customerPoNumber}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLpoValidationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder && lpoValidationStatus) {
                  validateCustomerLpo.mutate({
                    id: selectedOrder.id,
                    status: lpoValidationStatus,
                    notes: lpoValidationNotes.trim() || undefined,
                    validatedBy: "current-user-id", // In real app, get from auth
                  });
                }
              }}
              disabled={!lpoValidationStatus || validateCustomerLpo.isPending}
              data-testid="button-validate-lpo"
            >
              Validate LPO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Sales Order Details</span>
              {selectedOrder?.version && selectedOrder.version > 1 && (
                <Badge variant="outline">Version {selectedOrder.version}</Badge>
              )}
              {selectedOrder?.isPartialOrder && (
                <Badge variant="outline" className="text-orange-600">Partial Order</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="items">Items ({selectedOrderItems.length})</TabsTrigger>
                <TabsTrigger value="history">Version History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Order Number:</span> {selectedOrder.orderNumber}</p>
                      <p><span className="font-medium">Status:</span> {selectedOrder.status}</p>
                      <p><span className="font-medium">Source Type:</span> {selectedOrder.sourceType}</p>
                      <p><span className="font-medium">Order Date:</span> {selectedOrder.orderDate ? formatDate(new Date(selectedOrder.orderDate)) : "N/A"}</p>
                      {selectedOrder.amendmentReason && (
                        <p><span className="font-medium">Amendment Reason:</span> {selectedOrder.amendmentReason}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customer?.name}</p>
                      <p><span className="font-medium">Type:</span> {selectedOrder.customer?.customerType}</p>
                      <p><span className="font-medium">PO Number:</span> {selectedOrder.customerPoNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.customerLpoRequired && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Customer LPO Validation</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Status</p>
                        <Badge className={
                          selectedOrder.customerLpoValidationStatus === "Approved" ? "underline decoration-green-500 text-green-700" :
                          selectedOrder.customerLpoValidationStatus === "Rejected" ? "underline decoration-red-500 text-red-700" :
                          "underline decoration-yellow-500 text-yellow-700"
                        }>
                          {selectedOrder.customerLpoValidationStatus || "Pending"}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">Validated By</p>
                        <p>{selectedOrder.customerLpoValidatedBy || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-medium">Validated At</p>
                        <p>{selectedOrder.customerLpoValidatedAt ? formatDate(selectedOrder.customerLpoValidatedAt) : "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Financial Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Subtotal</p>
                      <p className="text-sm font-medium">{formatCurrency(Number(selectedOrder.subtotal) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tax Amount</p>
                      <p className="text-sm font-medium">{formatCurrency(Number(selectedOrder.taxAmount) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(Number(selectedOrder.totalAmount) || 0)}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.paymentTerms && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment Terms</h4>
                    <p className="text-sm text-gray-600">{selectedOrder.paymentTerms}</p>
                  </div>
                )}

                {selectedOrder.deliveryInstructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Instructions</h4>
                    <p className="text-sm text-gray-600">{selectedOrder.deliveryInstructions}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4">
                <div className="space-y-3">
                  {selectedOrderItems.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-6 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Line #</p>
                          <p className="font-medium">{item.lineNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Supplier Code</p>
                          <p className="font-mono text-sm">{item.supplierCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Barcode *</p>
                          <p className="font-mono text-sm text-blue-600">{item.barcode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Quantity</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Unit Price</p>
                          <p className="font-medium">{formatCurrency(Number(item.unitPrice) || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Price</p>
                          <p className="font-medium">{formatCurrency(Number(item.totalPrice) || 0)}</p>
                        </div>
                      </div>
                      {item.specialInstructions && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">Special Instructions</p>
                          <p className="text-sm">{item.specialInstructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {selectedOrderItems.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No items found for this sales order.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Version {selectedOrder.version}</p>
                        <p className="text-sm text-gray-600">Current Version</p>
                        {selectedOrder.amendmentReason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Reason:</span> {selectedOrder.amendmentReason}
                          </p>
                        )}
                      </div>
                      <Badge className="underline decoration-green-500 text-green-700">Current</Badge>
                    </div>
                  </div>
                  
                  {selectedOrder.parentOrderId && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Parent Order</p>
                          <p className="text-sm text-gray-600">Original sales order</p>
                        </div>
                        <Badge variant="outline">Previous</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button
              onClick={() => setSelectedOrder(null)}
              data-testid="button-close-details"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </div>
  );
}