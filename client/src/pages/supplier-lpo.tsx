import { useState } from "react";
import { useUserId } from "@/hooks/useUserId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Package, Truck, FileText, Plus, Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, Send, Eye } from "lucide-react";
import { format } from "date-fns";
import type { SupplierLpo, SupplierLpoItem, Supplier } from "@shared/schema";

interface LpoFilters {
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

const statusColors = {
  Draft: "text-white bg-gray-500",
  Sent: "text-white bg-gray-400",
  Confirmed: "text-white bg-green-600",
  Received: "text-white bg-purple-600",
  Cancelled: "text-white bg-red-600",
  Missing: "flex items-center gap-2 text-white bg-red-600 border border-red-600 px-4 h-8 min-w-[100px] justify-center font-medium text-base",
};

const approvalStatusColors = {
  "Not Required": "text-white bg-gray-500",
  Pending: "text-white bg-gray-600",
  Approved: "text-white bg-green-600",
  Rejected: "text-white bg-red-600",
};

export default function SupplierLpoPage() {
  const userId = useUserId();
  const [filters, setFilters] = useState<LpoFilters>({});
  const [selectedLpo, setSelectedLpo] = useState<SupplierLpo | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showCreateLpo, setShowCreateLpo] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supplier LPOs with filters
  const { data: supplierLpos, isLoading } = useQuery({
    queryKey: ["/api/supplier-lpos", filters],
    queryFn: async ({ queryKey }) => {
      const [url, filterParams] = queryKey as [string, typeof filters];
      const params = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  // Fetch suppliers for filter dropdown
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Fetch backlog data
  const { data: backlogData } = useQuery({
    queryKey: ["/api/supplier-lpos/backlog"],
    enabled: showBacklog,
  });

  // Fetch customer order backlog
  const { data: customerBacklog } = useQuery({
    queryKey: ["/api/customer-orders/backlog"],
    enabled: showBacklog,
  });

  // Mutation for sending LPO to supplier
  const sendToSupplierMutation = useMutation({
    mutationFn: async (lpoId: string) => {
      const response = await apiRequest("POST", `/api/supplier-lpos/${lpoId}/send-to-supplier`, { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "LPO sent to supplier successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-lpos"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send LPO to supplier",
        variant: "destructive" 
      });
    },
  });

  // Mutation for approving LPO
  const approveLpoMutation = useMutation({
    mutationFn: async ({ lpoId, notes }: { lpoId: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/supplier-lpos/${lpoId}/approve`, { userId, notes });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "LPO approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-lpos"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to approve LPO",
        variant: "destructive" 
      });
    },
  });

  const handleFilterChange = (key: keyof LpoFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getStatusBadge = (status: string) => (
    status === "Missing"
      ? (
          <Badge className={statusColors.Missing}>
            <XCircle className="h-4 w-4 mr-1" />
            Missing
          </Badge>
        )
      : (
          <Badge className={statusColors[status as keyof typeof statusColors]}>
            {status}
          </Badge>
        )
  );

  const getApprovalStatusBadge = (status: string) => (
    <Badge className={approvalStatusColors[status as keyof typeof approvalStatusColors] || "underline decoration-gray-500 text-gray-700"}>
      {status}
    </Badge>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-6 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier LPO Management</h2>
          <p className="text-gray-600 text-base mt-1">Step 6: Manage Local Purchase Orders with suppliers including auto-generation, amendments, and approval workflows</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          onClick={() => setShowCreateLpo(true)}
          data-testid="button-new-supplier-lpo"
        >
          <span className="text-xl font-bold">+</span> New Supplier LPO
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">Total LPOs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-blue-600">
                {Array.isArray(supplierLpos) ? supplierLpos.length : 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <span className="font-bold text-lg">Pending Approval</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-yellow-600">
                {Array.isArray(supplierLpos) ? supplierLpos.filter((lpo: SupplierLpo) => lpo.approvalStatus === "Pending").length : 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Send className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">Sent to Suppliers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-blue-600">
                {Array.isArray(supplierLpos) ? supplierLpos.filter((lpo: SupplierLpo) => lpo.status === "Sent").length : 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="font-bold text-lg">Confirmed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(supplierLpos) ? supplierLpos.filter((lpo: SupplierLpo) => lpo.status === "Confirmed").length : 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backlog Report */}
      {showBacklog && (
        <Tabs defaultValue="supplier-backlog" className="w-full">
          <TabsList>
            <TabsTrigger value="supplier-backlog">Supplier LPO Backlog</TabsTrigger>
            <TabsTrigger value="customer-backlog">Customer Order Backlog</TabsTrigger>
          </TabsList>
          <TabsContent value="supplier-backlog">
            <Card>
              <CardHeader>
                <CardTitle>Supplier LPO Backlog Report</CardTitle>
                <CardDescription>
                  Outstanding supplier orders requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BacklogTable data={backlogData} type="supplier" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="customer-backlog">
            <Card>
              <CardHeader>
                <CardTitle>Customer Order Backlog Report</CardTitle>
                <CardDescription>
                  Outstanding customer orders requiring supplier fulfillment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BacklogTable data={customerBacklog} type="customer" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier-filter">Supplier</Label>
              <Select
                value={filters.supplierId || ""}
                onValueChange={(value) => handleFilterChange("supplierId", value)}
              >
                <SelectTrigger data-testid="select-supplier-filter">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier: Supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                data-testid="input-date-from"
              />
            </div>
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                data-testid="input-date-to"
              />
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="LPO number, supplier..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                data-testid="input-search"
                className="border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* LPOs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier LPOs</CardTitle>
          <CardDescription>
            Manage and track all Local Purchase Orders with suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LPO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>LPO Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierLpos?.map((lpo: SupplierLpo & { supplierName?: string }) => (
                  <TableRow
                    key={lpo.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setSelectedLpo(lpo)}
                    data-testid={`row-lpo-${lpo.id}`}
                  >
                    <TableCell className="font-medium">{lpo.lpoNumber}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 font-semibold border border-gray-200">
                        {lpo.supplierName || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(lpo.status)}</TableCell>
                    <TableCell>{getApprovalStatusBadge(lpo.approvalStatus || "Not Required")}</TableCell>
                    <TableCell>
                      {lpo.lpoDate ? format(new Date(lpo.lpoDate), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lpo.expectedDeliveryDate ? (
                          <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-semibold border border-green-200">
                            {format(new Date(lpo.expectedDeliveryDate), "MMM dd, yyyy")}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 border border-gray-200">-</span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                          onClick={e => {
                            e.stopPropagation();
                            toast({ title: "Set Expected Delivery", description: `LPO: ${lpo.lpoNumber}` });
                          }}
                          data-testid={`button-set-expected-delivery-${lpo.id}`}
                        >
                          Set
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lpo.currency} {Number(lpo.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {lpo.status === "Draft" && lpo.approvalStatus === "Approved" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendToSupplierMutation.mutate(lpo.id);
                            }}
                            data-testid={`button-send-${lpo.id}`}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {lpo.approvalStatus === "Pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveLpoMutation.mutate({ lpoId: lpo.id });
                            }}
                            data-testid={`button-approve-${lpo.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* LPO Detail Dialog */}
      {selectedLpo && (
        <LpoDetailDialog
          lpo={selectedLpo}
          open={!!selectedLpo}
          onClose={() => setSelectedLpo(null)}
        />
      )}
    </div>
  );
}

// Auto Generate LPOs Form Component
function AutoGenerateLposForm({ onClose }: { onClose: () => void }) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState("supplier");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: salesOrders } = useQuery({
    queryKey: ["/api/sales-orders", { status: "Confirmed" }],
    queryFn: () => apiRequest("/api/sales-orders?status=Confirmed"),
  });

  const generateMutation = useMutation({
    mutationFn: () => 
      apiRequest("/api/supplier-lpos/from-sales-orders", {
        method: "POST",
        body: JSON.stringify({
          salesOrderIds: selectedOrders,
          groupBy,
          userId: "current-user-id",
        }),
      }),
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: `Generated ${data.length} supplier LPO(s) successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-lpos"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate LPOs",
        variant: "destructive" 
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Group By Selector */}
      <div>
        <Label>Group By</Label>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger data-testid="select-group-by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="delivery_date">Expected Delivery Date</SelectItem>
            <SelectItem value="custom">Custom Grouping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Orders List */}
      <div>
        <Label>Select Sales Orders</Label>
        <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-1">
          {salesOrders?.map((order: any) => (
            <div key={order.id} className="flex items-center justify-between py-1 pr-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrders([...selectedOrders, order.id]);
                    } else {
                      setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                    }
                  }}
                  data-testid={`checkbox-order-${order.id}`}
                />
                <span className="text-sm">
                  {order.orderNumber} - {order.customerName} - ${Number(order.totalAmount || 0).toLocaleString()}
                </span>
              </label>
              {order.status && (
                <Badge variant="outline" className="text-xs">
                  {order.status}
                </Badge>
              )}
            </div>
          ))}
          {(!salesOrders || salesOrders.length === 0) && (
            <div className="text-sm text-gray-500 py-4 text-center">No confirmed sales orders available.</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel">
          Cancel
        </Button>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={selectedOrders.length === 0 || generateMutation.isPending}
          data-testid="button-generate"
          className="bg-red-600 text-white border border-red-600 px-4 h-8 min-w-[100px] justify-center font-medium text-base"
        >
          {generateMutation.isPending ? "Generating..." : "Generate LPOs"}
        </Button>
      </div>
    </div>
  );
}

// Backlog Table Component
function BacklogTable({ data, type }: { data: any[]; type: "supplier" | "customer" }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No backlog items found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{type === "supplier" ? "LPO Number" : "Order Number"}</TableHead>
          <TableHead>{type === "supplier" ? "Supplier" : "Customer"}</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Days Pending</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Items</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.lpoId || item.orderId}>
            <TableCell className="font-medium">
              {item.lpoNumber || item.orderNumber}
            </TableCell>
            <TableCell>{item.supplierName || item.customerName}</TableCell>
            <TableCell>
              <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              {format(new Date(item.lpoDate || item.orderDate), "MMM dd, yyyy")}
            </TableCell>
            <TableCell>
              <span className={`font-medium ${Number(item.daysPending) > 7 ? "text-red-600" : "text-gray-600"}`}>
                {item.daysPending} days
              </span>
            </TableCell>
            <TableCell>
              ${Number(item.totalAmount || 0).toLocaleString()}
            </TableCell>
            <TableCell>
              {item.itemCount} items
              {item.pendingItems && ` (${item.pendingItems} pending)`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// LPO Detail Dialog Component
function LpoDetailDialog({ 
  lpo, 
  open, 
  onClose 
}: { 
  lpo: SupplierLpo; 
  open: boolean; 
  onClose: () => void; 
}) {
  const { data: lpoItems } = useQuery({
    queryKey: ["/api/supplier-lpos", lpo.id, "items"],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LPO Details - {lpo.lpoNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <div className="mt-1">
                {lpo.status && getStatusBadge(lpo.status)}
              </div>
            </div>
            <div>
              <Label>Approval Status</Label>
              <div className="mt-1">
                <Badge className={approvalStatusColors[lpo.approvalStatus as keyof typeof approvalStatusColors] || "text-white"}>
                  {lpo.approvalStatus || "Not Required"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <Label>Subtotal</Label>
                <div className="text-lg font-semibold">
                  {lpo.currency} {Number(lpo.subtotal || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Tax Amount</Label>
                <div className="text-lg font-semibold">
                  {lpo.currency} {Number(lpo.taxAmount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Total Amount</Label>
                <div className="text-lg font-semibold text-blue-600">
                  {lpo.currency} {Number(lpo.totalAmount || 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Supplier Code</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lpoItems?.map((item: SupplierLpoItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.itemDescription}</TableCell>
                      <TableCell>{item.supplierCode}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {lpo.currency} {Number(item.unitCost).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {lpo.currency} {Number(item.totalCost).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.deliveryStatus as keyof typeof statusColors] || "text-white"}>
                          {item.deliveryStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStatusBadge(status: string) {
  return (
    <Badge className={statusColors[status as keyof typeof statusColors] || "underline decoration-gray-500 text-gray-700"}>
      {status}
    </Badge>
  );
}

// Create LPO Form Component
function CreateLpoForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    supplierId: "",
    lpoDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: "",
    requestedDeliveryDate: "",
    paymentTerms: "",
    deliveryTerms: "",
    termsAndConditions: "",
    specialInstructions: "",
    requiresApproval: false,
    currency: "USD",
    items: [] as Array<{
      itemId: string;
      supplierCode: string;
      barcode: string;
      itemDescription: string;
      quantity: number;
      unitCost: number;
      urgency: string;
      specialInstructions: string;
    }>
  });
  const [showAddItem, setShowAddItem] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch suppliers and items
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: items } = useQuery({
    queryKey: ["/api/items"],
  });

  // Create LPO mutation
  const createLpoMutation = useMutation({
    mutationFn: async () => {
      const lpoData = {
        ...formData,
        lpoNumber: `LPO-${Date.now()}`, // Generate LPO number
        createdBy: "current-user-id",
        subtotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        taxAmount: 0, // Calculate tax if needed
        totalAmount: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        sourceType: "Manual",
        version: 1,
        approvalStatus: formData.requiresApproval ? "Pending" : "Not Required",
      };

      const response = await apiRequest("POST", "/api/supplier-lpos", lpoData);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "LPO created successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-lpos"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create LPO",
        variant: "destructive" 
      });
    },
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: "",
        supplierCode: "",
        barcode: "",
        itemDescription: "",
        quantity: 1,
        unitCost: 0,
        urgency: "Normal",
        specialInstructions: ""
      }]
    }));
    setShowAddItem(true);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the LPO",
        variant: "destructive"
      });
      return;
    }
    createLpoMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Supplier *</Label>
          <Select
            value={formData.supplierId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers?.map((supplier: any) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lpoDate">LPO Date *</Label>
          <Input
            id="lpoDate"
            type="date"
            value={formData.lpoDate}
            onChange={(e) => setFormData(prev => ({ ...prev, lpoDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
          <Input
            id="expectedDeliveryDate"
            type="date"
            value={formData.expectedDeliveryDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="requestedDeliveryDate">Requested Delivery Date</Label>
          <Input
            id="requestedDeliveryDate"
            type="date"
            value={formData.requestedDeliveryDate}
            onChange={(e) => setFormData(prev => ({ ...prev, requestedDeliveryDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Financial Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiresApproval"
            checked={formData.requiresApproval}
            onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
          />
          <Label htmlFor="requiresApproval">Requires Approval</Label>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Input
            id="paymentTerms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
            placeholder="e.g., Net 30 days"
          />
        </div>
        <div>
          <Label htmlFor="deliveryTerms">Delivery Terms</Label>
          <Input
            id="deliveryTerms"
            value={formData.deliveryTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
            placeholder="e.g., FOB Destination"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
        <textarea
          id="termsAndConditions"
          className="w-full p-2 border rounded-md"
          rows={3}
          value={formData.termsAndConditions}
          onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
          placeholder="Enter terms and conditions..."
        />
      </div>

      <div>
        <Label htmlFor="specialInstructions">Special Instructions</Label>
        <textarea
          id="specialInstructions"
          className="w-full p-2 border rounded-md"
          rows={3}
          value={formData.specialInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
          placeholder="Enter any special instructions..."
        />
      </div>

      {/* Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg font-semibold">Items</Label>
          <Button type="button" onClick={addItem} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {formData.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            No items added yet. Click "Add Item" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Item</Label>
                      <Select
                        value={item.itemId}
                        onValueChange={(value) => {
                          updateItem(index, "itemId", value);
                          const selectedItem = items?.find((i: any) => i.id === value);
                          if (selectedItem) {
                            updateItem(index, "itemDescription", selectedItem.description);
                            updateItem(index, "barcode", selectedItem.barcode || "");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Supplier Code</Label>
                      <Input
                        value={item.supplierCode}
                        onChange={(e) => updateItem(index, "supplierCode", e.target.value)}
                        placeholder="Enter supplier code"
                        required
                      />
                    </div>
                    <div>
                      <Label>Barcode</Label>
                      <Input
                        value={item.barcode}
                        onChange={(e) => updateItem(index, "barcode", e.target.value)}
                        placeholder="Enter barcode"
                        required
                      />
                    </div>
                    <div>
                      <Label>Urgency</Label>
                      <Select
                        value={item.urgency}
                        onValueChange={(value) => updateItem(index, "urgency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, "unitCost", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Item Description</Label>
                    <textarea
                      className="w-full p-2 border rounded-md"
                      rows={2}
                      value={item.itemDescription}
                      onChange={(e) => updateItem(index, "itemDescription", e.target.value)}
                      placeholder="Enter item description"
                      required
                    />
                  </div>
                  <div>
                    <Label>Special Instructions</Label>
                    <textarea
                      className="w-full p-2 border rounded-md"
                      rows={2}
                      value={item.specialInstructions}
                      onChange={(e) => updateItem(index, "specialInstructions", e.target.value)}
                      placeholder="Enter special instructions for this item"
                    />
                  </div>
                  <div className="text-right font-semibold">
                    Total: {formData.currency} {(item.quantity * item.unitCost).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {formData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="text-lg font-semibold">
                  {formData.currency} {formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tax</div>
                <div className="text-lg font-semibold">
                  {formData.currency} 0.00
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-lg font-semibold text-blue-600">
                  {formData.currency} {formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createLpoMutation.isPending || formData.items.length === 0}
        >
          {createLpoMutation.isPending ? "Creating..." : "Create LPO"}
        </Button>
      </div>
    </form>
  );
}