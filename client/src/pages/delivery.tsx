import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Truck, Package, FileText, Upload, Clock, CheckCircle, AlertCircle } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

export default function Delivery() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryData, setDeliveryData] = useState({
    deliveryAddress: "",
    deliveryNotes: "",
    deliveryDocument: null as File | null,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: salesOrders, isLoading, error: ordersError } = useQuery({
    queryKey: ["/api/sales-orders"],
    queryFn: async () => {
      const response = await fetch("/api/sales-orders");
      if (!response.ok) {
        throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: deliveries, error: deliveriesError } = useQuery({
    queryKey: ["/api/deliveries"],
    queryFn: async () => {
      const response = await fetch("/api/deliveries");
      if (!response.ok) {
        throw new Error(`Failed to fetch deliveries: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const createDelivery = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append("salesOrderId", data.salesOrderId);
      formData.append("deliveryAddress", data.deliveryAddress);
      formData.append("deliveryNotes", data.deliveryNotes);
      if (data.deliveryDocument) {
        formData.append("deliveryDocument", data.deliveryDocument);
      }
      
      const response = await fetch("/api/deliveries", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Delivery creation failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      toast({
        title: "Success",
        description: "Delivery created successfully",
      });
      setSelectedOrder(null);
      setDeliveryData({ deliveryAddress: "", deliveryNotes: "", deliveryDocument: null });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create delivery",
        variant: "destructive",
      });
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/deliveries/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Success",
        description: "Delivery status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setDeliveryData({ ...deliveryData, deliveryDocument: acceptedFiles[0] });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  // Show all deliveries with their associated order information
  const allDeliveriesWithOrders = deliveries?.map((delivery: any) => {
    const order = salesOrders?.find((o: any) => o.id === delivery.salesOrderId);
    return {
      ...delivery,
      order: order,
      orderNumber: order?.orderNumber || 'N/A',
      customer: order?.customer || { name: 'Unknown', address: 'Unknown' },
      totalAmount: order?.totalAmount || 0,
      orderDate: order?.orderDate || delivery.createdAt,
    };
  }) || [];

  // Also include orders ready for delivery (shipped but no delivery created yet)
  const ordersReadyForDelivery = salesOrders?.filter((order: any) => 
    order.status === "Shipped" && !deliveries?.some((d: any) => d.salesOrderId === order.id)
  ).map((order: any) => ({
    id: `pending-${order.id}`,
    salesOrderId: order.id,
    status: 'Ready for Delivery',
    deliveryAddress: order.customer?.address || '',
    deliveryNotes: '',
    createdAt: order.orderDate,
    order: order,
    orderNumber: order.orderNumber,
    customer: order.customer,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate,
    isPendingDelivery: true,
  })) || [];

  // Combine all deliveries and pending orders
  const allDeliveryData = [...allDeliveriesWithOrders, ...ordersReadyForDelivery];
  
  const filteredDeliveryData = allDeliveryData?.filter((item: any) =>
    item.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  // Pagination logic
  const totalPages = Math.ceil(filteredDeliveryData.length / pageSize);
  const paginatedDeliveryData = filteredDeliveryData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<any>[] = [
    {
      key: "orderNumber",
      header: "Order ID",
      render: (value: string) => (
        <span className="font-mono text-sm text-blue-600 font-medium">{value}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (customer: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {customer?.name || "Unknown Customer"}
          </p>
          <p className="text-xs text-gray-600">
            {customer?.address || "No address"}
          </p>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Order Value",
      render: (value: number) => value ? formatCurrency(value) : "-",
      className: "text-right",
    },
    {
      key: "status",
      header: "Delivery Status",
      render: (status: string, item: any) => {
        if (item.isPendingDelivery) {
          return (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
              <Package className="h-3 w-3 mr-1" />
              Ready for Delivery
            </Badge>
          );
        }
        
        // Apply color coding based on delivery status
        let colorClass = "";
        switch (status?.toLowerCase()) {
          case "pending":
            colorClass = "text-white border-blue-600 bg-blue-600";
            break;
          case "in transit":
          case "intransit":
            colorClass = "text-blue-600 border-blue-300 bg-blue-50";
            break;
          case "delivered":
          case "complete":
          case "completed":
            colorClass = "text-white border-green-500 bg-green-500";
            break;
          case "partial":
          case "partially delivered":
            colorClass = "text-amber-600 border-amber-300 bg-amber-50";
            break;
          case "failed":
          case "cancelled":
          case "canceled":
            colorClass = "text-red-600 border-red-300 bg-red-50";
            break;
          case "returned":
            colorClass = "text-purple-600 border-purple-300 bg-purple-50";
            break;
          default:
            colorClass = "text-gray-600 border-gray-300 bg-gray-50";
        }
        
        return (
          <Badge variant="outline" className={colorClass}>
            {status}
          </Badge>
        );
      },
    },
    {
      key: "deliveryAddress",
      header: "Delivery Address",
      render: (address: string) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">
            {address || "No address specified"}
          </p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, item: any) => {
        return (
          <div className="flex items-center space-x-2">
            {item.isPendingDelivery && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(item.order);
                  setDeliveryData({
                    deliveryAddress: item.order.customer?.address || "",
                    deliveryNotes: "",
                    deliveryDocument: null,
                  });
                }}
                data-testid={`button-create-delivery-${item.salesOrderId}`}
              >
                <Truck className="h-4 w-4 mr-1" />
                Create Delivery
              </Button>
            )}
            {!item.isPendingDelivery && item.status === "Pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  updateDeliveryStatus.mutate({ id: item.id, status: "Complete" });
                }}
                data-testid={`button-complete-delivery-${item.id}`}
              >
                Complete
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                console.log("View delivery details:", item);
              }}
              data-testid={`button-view-${item.id || item.salesOrderId}`}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const deliveryStats = {
    readyForDelivery: ordersReadyForDelivery?.length || 0,
    pendingDelivery: deliveries?.filter((d: any) => d.status === "Pending").length || 0,
    partialDelivery: deliveries?.filter((d: any) => d.status === "Partial").length || 0,
    completeDelivery: deliveries?.filter((d: any) => d.status === "Complete").length || 0,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm flex items-center justify-between px-6 py-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
              Customer Delivery
            </h2>
            <p className="text-gray-600">Step 9: Generate delivery notes and manage customer deliveries with barcode picking</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg" onClick={() => {}}>
            <span className="mr-2">+</span> Create Delivery
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Ready for Delivery</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-ready-delivery">
                  {deliveryStats.readyForDelivery}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Shipped orders awaiting delivery
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mt-1">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Pending Delivery</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending-delivery">
                  {deliveryStats.pendingDelivery}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Deliveries in progress
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mt-1">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Partial Delivery</p>
                <p className="text-2xl font-bold text-amber-600" data-testid="stat-partial-delivery">
                  {deliveryStats.partialDelivery}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Partially delivered orders
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Complete Delivery</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-complete-delivery">
                  {deliveryStats.completeDelivery}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Successfully delivered orders
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivery Management</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search deliveries and orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                  data-testid="input-search-orders"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <DataTable
              data={paginatedDeliveryData}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No deliveries found. Create deliveries from shipped orders."
              onRowClick={(item) => {
                if (item.isPendingDelivery) {
                  setSelectedOrder(item.order);
                  setDeliveryData({
                    deliveryAddress: item.order.customer?.address || "",
                    deliveryNotes: "",
                    deliveryDocument: null,
                  });
                }
              }}
            />
            {/* Pagination Controls */}
            {filteredDeliveryData.length > pageSize && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="mx-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Delivery Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Delivery Note</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Order Number:</span> {selectedOrder.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer:</span> {selectedOrder.customer?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Order Value:</span> {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">PO Number:</span> {selectedOrder.customerPoNumber || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Enter delivery address..."
                  value={deliveryData.deliveryAddress}
                  onChange={(e) => setDeliveryData({ ...deliveryData, deliveryAddress: e.target.value })}
                  className="min-h-[80px]"
                  data-testid="textarea-delivery-address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Delivery Notes
                </label>
                <Textarea
                  placeholder="Special delivery instructions..."
                  value={deliveryData.deliveryNotes}
                  onChange={(e) => setDeliveryData({ ...deliveryData, deliveryNotes: e.target.value })}
                  className="min-h-[80px]"
                  data-testid="textarea-delivery-notes"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Delivery Document (Optional)
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  data-testid="dropzone-delivery-document"
                >
                  <input {...getInputProps()} />
                  {deliveryData.deliveryDocument ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {deliveryData.deliveryDocument.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeliveryData({ ...deliveryData, deliveryDocument: null });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {isDragActive
                          ? "Drop the delivery document here..."
                          : "Drag & drop delivery document, or click to select"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, PNG, JPG files up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setDeliveryData({ deliveryAddress: "", deliveryNotes: "", deliveryDocument: null });
                  }}
                  data-testid="button-cancel-delivery"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedOrder && deliveryData.deliveryAddress.trim()) {
                      createDelivery.mutate({
                        salesOrderId: selectedOrder.id,
                        ...deliveryData,
                      });
                    }
                  }}
                  disabled={!deliveryData.deliveryAddress.trim() || createDelivery.isPending}
                  data-testid="button-create-delivery"
                >
                  {createDelivery.isPending ? "Creating..." : "Create Delivery"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
