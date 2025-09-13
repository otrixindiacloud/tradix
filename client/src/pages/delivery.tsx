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

  // Filter for sales orders ready for delivery (shipped status)
  const shippedOrders = salesOrders?.filter((order: any) => order.status === "Shipped");
  
  const filteredOrders = shippedOrders?.filter((order: any) =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      key: "deliveryStatus",
      header: "Delivery Status",
      render: (_, order: any) => {
        const delivery = deliveries?.find((d: any) => d.salesOrderId === order.id);
        if (!delivery) {
          return (
            <Badge variant="outline" className="text-orange-600">
              <Package className="h-3 w-3 mr-1" />
              Ready for Delivery
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className={getStatusColor(delivery.status)}>
            {delivery.status}
          </Badge>
        );
      },
    },
    {
      key: "orderDate",
      header: "Order Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, order: any) => {
        const delivery = deliveries?.find((d: any) => d.salesOrderId === order.id);
        return (
          <div className="flex items-center space-x-2">
            {!delivery && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(order);
                  setDeliveryData({
                    deliveryAddress: order.customer?.address || "",
                    deliveryNotes: "",
                    deliveryDocument: null,
                  });
                }}
                data-testid={`button-create-delivery-${order.id}`}
              >
                <Truck className="h-4 w-4 mr-1" />
                Create Delivery
              </Button>
            )}
            {delivery && delivery.status === "Pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  updateDeliveryStatus.mutate({ id: delivery.id, status: "Complete" });
                }}
                data-testid={`button-complete-delivery-${delivery.id}`}
              >
                Complete
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                console.log("View order details:", order);
              }}
              data-testid={`button-view-${order.id}`}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const deliveryStats = {
    readyForDelivery: shippedOrders?.filter((order: any) => 
      !deliveries?.some((d: any) => d.salesOrderId === order.id)
    ).length || 0,
    pendingDelivery: deliveries?.filter((d: any) => d.status === "Pending").length || 0,
    partialDelivery: deliveries?.filter((d: any) => d.status === "Partial").length || 0,
    completeDelivery: deliveries?.filter((d: any) => d.status === "Complete").length || 0,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            Customer Delivery
          </h2>
          <p className="text-gray-600">
            Step 9: Generate delivery notes and manage customer deliveries with barcode picking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600">
            <Truck className="h-4 w-4 mr-1" />
            {deliveryStats.readyForDelivery} Ready for Delivery
          </Badge>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready for Delivery</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-ready-delivery">
                  {deliveryStats.readyForDelivery}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Shipped orders awaiting delivery
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Delivery</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending-delivery">
                  {deliveryStats.pendingDelivery}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Deliveries in progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Delivery</p>
                <p className="text-2xl font-bold text-amber-600" data-testid="stat-partial-delivery">
                  {deliveryStats.partialDelivery}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Partially delivered orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Complete Delivery</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-complete-delivery">
                  {deliveryStats.completeDelivery}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Successfully delivered orders
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
                  placeholder="Search orders..."
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
          <DataTable
            data={filteredOrders || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No orders ready for delivery. Orders must be shipped first."
            onRowClick={(order) => {
              const delivery = deliveries?.find((d: any) => d.salesOrderId === order.id);
              if (!delivery) {
                setSelectedOrder(order);
                setDeliveryData({
                  deliveryAddress: order.customer?.address || "",
                  deliveryNotes: "",
                  deliveryDocument: null,
                });
              }
            }}
          />
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
