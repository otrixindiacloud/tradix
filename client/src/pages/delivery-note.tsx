import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusPill from "@/components/status/status-pill";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Search, Filter, FileText, Truck, Package, 
  AlertCircle, CheckCircle, Clock, Copy, RefreshCw,
  Edit, Trash2, Eye, Download, Upload, FileCheck, ClipboardList,
  QrCode, MapPin, User, Calendar
} from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { SYSTEM_USER_ID } from "@shared/utils/uuid";
import { useUserId } from "@/hooks/useUserId";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { SalesOrder, SalesOrderItem, Customer } from "@shared/schema";

interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrder?: SalesOrder & { customer?: Customer };
  deliveryDate: string | null;
  status: "Pending" | "Partial" | "Complete" | "Cancelled";
  deliveryType: string;
  deliveryAddress: string | null;
  deliveryNotes: string | null;
  deliveryDocument: string | null;
  deliveryDocumentName: string | null;
  deliveryDocumentSize: number | null;
  pickingStartedBy: string | null;
  pickingStartedAt: string | null;
  pickingCompletedBy: string | null;
  pickingCompletedAt: string | null;
  pickingNotes: string | null;
  deliveryConfirmedBy: string | null;
  deliveryConfirmedAt: string | null;
  deliverySignature: string | null;
  trackingNumber: string | null;
  carrierName: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items?: DeliveryItem[];
}

interface DeliveryItem {
  id: string;
  deliveryId: string;
  salesOrderItemId: string;
  itemId: string;
  barcode: string;
  supplierCode: string;
  description: string;
  orderedQuantity: number;
  pickedQuantity: number;
  deliveredQuantity: number;
  unitPrice: string;
  totalPrice: string;
  pickedBy: string | null;
  pickedAt: string | null;
  storageLocation: string | null;
  pickingNotes: string | null;
  qualityChecked: boolean;
  qualityCheckedBy: string | null;
  qualityCheckedAt: string | null;
  qualityNotes: string | null;
}

export default function DeliveryNote() {
  const [currentPage, setCurrentPage] = useState(1);
  // Page size is now dynamic to allow a "Show All" toggle (sets a large size)
  const [pageSize, setPageSize] = useState(15);
  // Separate search term for delivery notes table
  const [deliverySearchTerm, setDeliverySearchTerm] = useState("");
  // Independent search term for sales order selection inside the create dialog
  const [salesOrderSearchTerm, setSalesOrderSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("");
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPickingDialog, setShowPickingDialog] = useState(false);
  const [showConfirmDeliveryDialog, setShowConfirmDeliveryDialog] = useState(false);
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [deliveryConfirmationName, setDeliveryConfirmationName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useUserId();

  // Helper to format ISO or date string for datetime-local input (strip seconds & timezone)
  const formatForDateTimeLocal = (value: string | null): string => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  // Fetch delivery notes
  const { data: deliveryNotesData = [], isLoading, error, refetch } = useQuery({
  queryKey: ["delivery-notes", currentPage, deliverySearchTerm, statusFilter, customerFilter, pageSize],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('pageSize', pageSize.toString());
        if (deliverySearchTerm) params.set('search', deliverySearchTerm);
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
        
        // Try relative URL first (for production), then absolute URL (for development)
        let response;
        try {
          response = await fetch(`/api/delivery-notes?${params}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        } catch (relativeError) {
          console.log('Relative URL failed, trying absolute URL...');
          response = await fetch(`/api/delivery-notes?${params}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Delivery notes fetched successfully:', data.length, 'records');
        return data as DeliveryNote[];
      } catch (error) {
        console.error('Error fetching delivery notes:', error);
        throw new Error(`Failed to fetch delivery notes: ${error instanceof Error ? error.message : 'Network error - please ensure the server is running on port 5000'}`);
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch available sales orders for delivery note creation
  // Fetch all sales orders for order number selection
  const { data: availableSalesOrders = [] } = useQuery({
    queryKey: ["sales-orders-list"],
    queryFn: async () => {
      try {
        let response;
        try {
          response = await fetch("/api/sales-orders", {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        } catch (relativeError) {
          response = await fetch("/api/sales-orders", {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        }
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Sales orders fetch failed: HTTP ${response.status}: ${errorText}`);
          return [];
        }
        const data = await response.json();
        // Only return orderNumber, id, and customer for selection
        return (Array.isArray(data) ? data : []).map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer
        }));
      } catch (error) {
        console.error('Error fetching sales orders:', error);
        return [];
      }
    }
  });

  // Create delivery note mutation
  const createDeliveryNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/delivery-notes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      setCurrentPage(1);
  setDeliverySearchTerm("");
      setStatusFilter("all");
      setCustomerFilter("");
      refetch();
      toast({
        title: "Success",
        description: "Delivery note created successfully"
      });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create delivery note",
        variant: "destructive"
      });
    }
  });

  // Update delivery note status mutation
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/delivery-notes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      setCurrentPage(1);
  setDeliverySearchTerm("");
      setStatusFilter("all");
      setCustomerFilter("");
      refetch();
      toast({
        title: "Success",
        description: "Delivery note updated successfully"
      });
      setShowPickingDialog(false);
      setShowConfirmDeliveryDialog(false);
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery note",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedSalesOrderId("");
    setDeliveryDate("");
    setDeliveryAddress("");
    setDeliveryNotes("");
    setTrackingNumber("");
    setCarrierName("");
    setDeliveryConfirmationName("");
    setSelectedDeliveryNote(null);
    setSalesOrderSearchTerm("");
  };

  const handleCreateDeliveryNote = () => {
    if (!selectedSalesOrderId) {
      toast({
        title: "Error",
        description: "Please select a sales order",
        variant: "destructive"
      });
      return;
    }

    // Find selected sales order to get orderNumber
    const selectedOrder = availableSalesOrders.find(order => order.id === selectedSalesOrderId);
    if (!selectedOrder || !selectedOrder.orderNumber) {
      toast({
        title: "Error",
        description: "Selected sales order is invalid or missing order number",
        variant: "destructive"
      });
      return;
    }

    const deliveryData = {
      salesOrderId: selectedSalesOrderId,
      deliveryNumber: selectedOrder.orderNumber,
      deliveryDate: deliveryDate || null,
      deliveryAddress,
      deliveryNotes,
      trackingNumber,
      carrierName,
      status: "Pending",
      deliveryType: "Full",
      createdBy: userId || SYSTEM_USER_ID
    };
    createDeliveryNoteMutation.mutate(deliveryData);
  };

  const handleStartPicking = () => {
    if (!selectedDeliveryNote) return;
    
    const updateData = {
      pickingStartedBy: userId || SYSTEM_USER_ID,
      pickingStartedAt: new Date().toISOString(),
      status: "Partial"
    };
    updateDeliveryStatusMutation.mutate({
      id: selectedDeliveryNote.id,
      data: updateData
    });
  };

  const handleCompletePicking = () => {
    if (!selectedDeliveryNote) return;
    
    const updateData = {
      pickingCompletedBy: userId || SYSTEM_USER_ID,
      pickingCompletedAt: new Date().toISOString(),
      pickingNotes: deliveryNotes,
      status: "Complete"
    };
    updateDeliveryStatusMutation.mutate({
      id: selectedDeliveryNote.id,
      data: updateData
    });
  };

  const handleConfirmDelivery = () => {
    if (!selectedDeliveryNote) return;
    
    const updateData = {
      deliveryConfirmedBy: deliveryConfirmationName,
      deliveryConfirmedAt: new Date().toISOString(),
      actualDeliveryDate: new Date().toISOString(),
      status: "Complete"
    };
    updateDeliveryStatusMutation.mutate({
      id: selectedDeliveryNote.id,
      data: updateData
    });
  };

  const columns: Column<DeliveryNote>[] = [
    {
      key: "deliveryNumber",
      header: "Delivery Number",
      render: (_value, item) => (
        <div className="font-medium text-blue-600">
          {item?.deliveryNumber || 'N/A'}
        </div>
      )
    },
    {
      key: "salesOrder.customer.name",
      header: "Customer",
      render: (_value, item) => (
        <div>
          <div className="font-medium">{item.salesOrder?.customer?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{item.salesOrder?.customer?.email || ''}</div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (_value, item) => (
        <StatusPill status={item?.status || 'Unknown'} />
      )
    },
    {
      key: "deliveryType",
      header: "Type",
      render: (_value, item) => (
        <Badge variant="outline">{item?.deliveryType || 'Unknown'}</Badge>
      )
    },
    {
      key: "deliveryDate",
      header: "Delivery Date",
      render: (_value, item) => (
        <div>
          {item?.deliveryDate ? formatDate(item.deliveryDate) : "Not scheduled"}
        </div>
      )
    },
    {
      key: "trackingNumber",
      header: "Tracking",
      render: (_value, item) => (
        <div>
          {item?.trackingNumber ? (
            <div>
              <div className="font-medium">{item.trackingNumber}</div>
              <div className="text-sm text-gray-500">{item.carrierName || ''}</div>
            </div>
          ) : (
            <span className="text-gray-400">No tracking</span>
          )}
        </div>
      )
    },
    {
      key: "createdAt",
      header: "Created",
      render: (_value, item) => formatDate(item?.createdAt)
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value, item) => (
        <div className="flex items-center gap-1">
          {/* View */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="View"
            aria-label="View"
            onClick={() => {
              setSelectedDeliveryNote(item);
              setShowDetailsDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {/* Edit */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Edit"
            aria-label="Edit"
            onClick={() => {
              setSelectedDeliveryNote(item);
              // Pre-fill edit form values
              setDeliveryDate(formatForDateTimeLocal(item.deliveryDate));
              setDeliveryAddress(item.deliveryAddress || "");
              setCarrierName(item.carrierName || "");
              setTrackingNumber(item.trackingNumber || "");
              setDeliveryNotes(item.deliveryNotes || "");
              setShowEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            title="Delete"
            aria-label="Delete"
            onClick={() => {
              // Placeholder delete logic; ideally show confirmation dialog
              toast({
                title: "Delete Delivery Note",
                description: `Delete action for ${item.deliveryNumber} triggered. Implement logic as needed.`,
                variant: "destructive"
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {/* Start Picking (only Pending) */}
          {item.status === "Pending" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Start Picking"
              aria-label="Start Picking"
              onClick={() => {
                setSelectedDeliveryNote(item);
                setShowPickingDialog(true);
              }}
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
          {/* Confirm Delivery (Partial or Complete but not yet confirmed) */}
          {(item.status === "Partial" || item.status === "Complete") && !item.deliveryConfirmedBy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700"
              title="Confirm Delivery"
              aria-label="Confirm Delivery"
              onClick={() => {
                setSelectedDeliveryNote(item);
                setShowConfirmDeliveryDialog(true);
              }}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Delivery Notes</h3>
          <p className="text-gray-600 mb-4">
            {error.message || "There was a problem loading the delivery notes."}
          </p>
          <div className="space-y-2">
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <p className="text-sm text-gray-500">
              If the problem persists, please ensure the server is running on port 5000
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Delivery Notes
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Step 8: Manage delivery notes generated from sales orders with barcode picking and delivery confirmation
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Delivery Management</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Deliveries: {deliveryNotesData.filter((d: DeliveryNote) => d.status !== "Complete" && d.status !== "Cancelled").length}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Delivery Note
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by delivery number, customer, or tracking..."
                value={deliverySearchTerm}
                onChange={(e) => {
                  setDeliverySearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-md"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                if (showAll) {
                  // revert
                  setPageSize(15);
                  setShowAll(false);
                  setCurrentPage(1);
                } else {
                  setPageSize(500); // large number to effectively show all
                  setShowAll(true);
                  setCurrentPage(1);
                }
              }}
            >
              {showAll ? (
                <>
                  <Filter className="h-4 w-4 mr-2" /> Paginate
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" /> Show All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Notes Table with empty state */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : deliveryNotesData.length > 0 ? (
            <>
              <DataTable
                data={deliveryNotesData}
                columns={[...columns]}
                className="w-full"
              />
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">Page {currentPage}</span>
                <Button
                  variant="outline"
                  disabled={deliveryNotesData.length < pageSize}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500 space-y-4">
              <p>No delivery notes found. Create a new delivery note to get started.</p>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Delivery Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Delivery Note Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Delivery Note</DialogTitle>
            <DialogDescription>
              Generate a delivery note from an existing sales order for picking and delivery management.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="salesOrder">Sales Order *</Label>
              {/* Single field: search and select sales order */}
              <Select value={selectedSalesOrderId} onValueChange={setSelectedSalesOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Type or select sales order..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2">
                    <Input
                      id="salesOrderSearch"
                      placeholder="Search sales order number or customer..."
                      value={salesOrderSearchTerm}
                      onChange={e => setSalesOrderSearchTerm(e.target.value)}
                      className="mb-2"
                      autoFocus
                    />
                  </div>
                  {availableSalesOrders
                    .filter(order => {
                      const term = salesOrderSearchTerm.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        order.orderNumber?.toLowerCase().includes(term) ||
                        order.customer?.name?.toLowerCase().includes(term)
                      );
                    })
                    .map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {order.customer?.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryDate">Scheduled Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="datetime-local"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Textarea
                id="deliveryAddress"
                placeholder="Enter delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="carrierName">Carrier/Transporter</Label>
              <Input
                id="carrierName"
                placeholder="Enter carrier or transporter name"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                placeholder="Enter tracking number (if available)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                placeholder="Enter any special delivery instructions..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDeliveryNote}
              disabled={createDeliveryNoteMutation.isPending}
            >
              {createDeliveryNoteMutation.isPending && <LoadingSpinner className="mr-2" />}
              Create Delivery Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Delivery Note Details</DialogTitle>
            <DialogDescription>
              {selectedDeliveryNote?.deliveryNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedDeliveryNote && (
            <div className="space-y-6">
              {/* ...existing details rendering... */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Delivery Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Customer:</strong> {selectedDeliveryNote.salesOrder?.customer?.name}</div>
                    <div><strong>Status:</strong> <StatusPill status={selectedDeliveryNote.status} /></div>
                    <div><strong>Type:</strong> {selectedDeliveryNote.deliveryType}</div>
                    <div><strong>Delivery Date:</strong> {selectedDeliveryNote.deliveryDate ? formatDate(selectedDeliveryNote.deliveryDate) : "Not scheduled"}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Tracking Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Tracking Number:</strong> {selectedDeliveryNote.trackingNumber || "N/A"}</div>
                    <div><strong>Carrier:</strong> {selectedDeliveryNote.carrierName || "N/A"}</div>
                    <div><strong>Estimated Delivery:</strong> {selectedDeliveryNote.estimatedDeliveryDate ? formatDate(selectedDeliveryNote.estimatedDeliveryDate) : "N/A"}</div>
                    <div><strong>Actual Delivery:</strong> {selectedDeliveryNote.actualDeliveryDate ? formatDate(selectedDeliveryNote.actualDeliveryDate) : "Pending"}</div>
                  </div>
                </div>
              </div>
              {selectedDeliveryNote.deliveryAddress && (
                <div>
                  <h3 className="font-semibold mb-2">Delivery Address</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedDeliveryNote.deliveryAddress}
                  </p>
                </div>
              )}
              {selectedDeliveryNote.deliveryNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Delivery Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedDeliveryNote.deliveryNotes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Picking Information</h3>
                  <div className="space-y-1">
                    <div><strong>Started:</strong> {selectedDeliveryNote.pickingStartedAt ? formatDate(selectedDeliveryNote.pickingStartedAt) : "Not started"}</div>
                    <div><strong>Completed:</strong> {selectedDeliveryNote.pickingCompletedAt ? formatDate(selectedDeliveryNote.pickingCompletedAt) : "Not completed"}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delivery Confirmation</h3>
                  <div className="space-y-1">
                    <div><strong>Confirmed By:</strong> {selectedDeliveryNote.deliveryConfirmedBy || "Not confirmed"}</div>
                    <div><strong>Confirmed At:</strong> {selectedDeliveryNote.deliveryConfirmedAt ? formatDate(selectedDeliveryNote.deliveryConfirmedAt) : "Not confirmed"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Delivery Note Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Delivery Note</DialogTitle>
            <DialogDescription>
              {selectedDeliveryNote?.deliveryNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedDeliveryNote && (
            <div className="space-y-4">
              {/* Example editable fields: deliveryDate, deliveryAddress, deliveryNotes, trackingNumber, carrierName */}
              <div>
                <Label htmlFor="editDeliveryDate">Scheduled Delivery Date</Label>
                <Input
                  id="editDeliveryDate"
                  type="datetime-local"
                  value={deliveryDate || selectedDeliveryNote.deliveryDate || ""}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editDeliveryAddress">Delivery Address</Label>
                <Textarea
                  id="editDeliveryAddress"
                  placeholder="Enter delivery address..."
                  value={deliveryAddress || selectedDeliveryNote.deliveryAddress || ""}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="editCarrierName">Carrier/Transporter</Label>
                <Input
                  id="editCarrierName"
                  placeholder="Enter carrier or transporter name"
                  value={carrierName || selectedDeliveryNote.carrierName || ""}
                  onChange={e => setCarrierName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editTrackingNumber">Tracking Number</Label>
                <Input
                  id="editTrackingNumber"
                  placeholder="Enter tracking number (if available)"
                  value={trackingNumber || selectedDeliveryNote.trackingNumber || ""}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editDeliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="editDeliveryNotes"
                  placeholder="Enter any special delivery instructions..."
                  value={deliveryNotes || selectedDeliveryNote.deliveryNotes || ""}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedDeliveryNote) return;
                // Prepare update data
                const updateData = {
                  deliveryDate: deliveryDate || selectedDeliveryNote.deliveryDate,
                  deliveryAddress: deliveryAddress || selectedDeliveryNote.deliveryAddress,
                  deliveryNotes: deliveryNotes || selectedDeliveryNote.deliveryNotes,
                  trackingNumber: trackingNumber || selectedDeliveryNote.trackingNumber,
                  carrierName: carrierName || selectedDeliveryNote.carrierName
                };
                updateDeliveryStatusMutation.mutate({
                  id: selectedDeliveryNote.id,
                  data: updateData
                });
                setShowEditDialog(false);
              }}
              disabled={updateDeliveryStatusMutation.isPending}
            >
              {updateDeliveryStatusMutation.isPending && <LoadingSpinner className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Picking Dialog */}
      <Dialog open={showPickingDialog} onOpenChange={setShowPickingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Picking Process</DialogTitle>
            <DialogDescription>
              Begin the picking process for delivery {selectedDeliveryNote?.deliveryNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <QrCode className="h-4 w-4" />
              Use barcode scanner to pick items efficiently
            </div>
            <Button onClick={handleStartPicking} className="w-full">
              Start Picking Process
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delivery Dialog */}
      <Dialog open={showConfirmDeliveryDialog} onOpenChange={setShowConfirmDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>
              Confirm delivery completion for {selectedDeliveryNote?.deliveryNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmationName">Receiver Name *</Label>
              <Input
                id="confirmationName"
                placeholder="Name of person who received the delivery"
                value={deliveryConfirmationName}
                onChange={(e) => setDeliveryConfirmationName(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDeliveryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelivery}
              disabled={!deliveryConfirmationName.trim() || updateDeliveryStatusMutation.isPending}
            >
              {updateDeliveryStatusMutation.isPending && <LoadingSpinner className="mr-2" />}
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}