import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeftRight,
  Plus, 
  Search, 
  Filter,
  Edit, 
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Building2,
  Package,
  MapPin,
  Truck,
  Navigation,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/tables/data-table";
import { formatDate, formatCurrency } from "@/lib/utils";

// Form schemas
const stockTransferSchema = z.object({
  transferNumber: z.string().min(1, "Transfer number is required"),
  itemId: z.string().min(1, "Item is required"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  transferDate: z.string().min(1, "Transfer date is required"),
  requestedBy: z.string().min(1, "Requested by is required"),
  reason: z.string().min(1, "Transfer reason is required"),
  status: z.enum(["Draft", "Pending Approval", "Approved", "In Transit", "Completed", "Cancelled"]),
  notes: z.string().optional(),
});

type StockTransferForm = z.infer<typeof stockTransferSchema>;

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "Pending Approval":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Approved":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "In Transit":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-300";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function StockTransferPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stock transfers (using stock movements with movementType = "Transfer")
  const { data: stockTransfers = [], isLoading } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/stock-movements?type=Transfer");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch stock transfers:", error);
        return [];
      }
    },
  });

  // Fetch items for dropdown
  const { data: items = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/inventory-items");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch inventory items:", error);
        return [];
      }
    },
  });

  // Mock locations (in a real app, this would come from an API)
  const locations = [
    { id: "warehouse-a", name: "Warehouse A" },
    { id: "warehouse-b", name: "Warehouse B" },
    { id: "warehouse-c", name: "Warehouse C" },
    { id: "store-front", name: "Store Front" },
    { id: "production", name: "Production Floor" },
    { id: "quality-control", name: "Quality Control" },
  ];

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["stock-transfers-stats"],
    queryFn: async () => {
      const transfersArray = Array.isArray(stockTransfers) ? stockTransfers : [];
      const total = transfersArray.length;
      const draft = transfersArray.filter(t => t.status === "Draft").length;
      const pending = transfersArray.filter(t => t.status === "Pending Approval").length;
      const approved = transfersArray.filter(t => t.status === "Approved").length;
      const inTransit = transfersArray.filter(t => t.status === "In Transit").length;
      const completed = transfersArray.filter(t => t.status === "Completed").length;
      const cancelled = transfersArray.filter(t => t.status === "Cancelled").length;
      
      // Calculate total value transferred
      const totalValue = transfersArray.reduce((sum, transfer) => {
        return sum + (parseFloat(transfer.quantity || "0") * parseFloat(transfer.unitPrice || "0"));
      }, 0);
      
      return { total, draft, pending, approved, inTransit, completed, cancelled, totalValue };
    },
    enabled: Array.isArray(stockTransfers) && stockTransfers.length > 0,
  });

  // Create stock transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: StockTransferForm) => {
      const transferData = {
        ...data,
        movementType: "Transfer",
        referenceType: "Transfer",
        status: "Draft",
      };
      return await apiRequest("POST", "/api/stock-movements", transferData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Stock transfer created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stock transfer",
        variant: "destructive",
      });
    },
  });

  const form = useForm<StockTransferForm>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      transferNumber: "",
      itemId: "",
      fromLocation: "",
      toLocation: "",
      quantity: 0,
      transferDate: "",
      requestedBy: "",
      reason: "",
      status: "Draft",
      notes: "",
    },
  });

  const onSubmit = (data: StockTransferForm) => {
    createTransferMutation.mutate(data);
  };

  // Filter stock transfers
  const filteredTransfers = (Array.isArray(stockTransfers) ? stockTransfers : []).filter((transfer: any) => {
    const matchesSearch = 
      transfer.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.requestedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.fromLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.toLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns = [
    {
      key: "referenceNumber",
      header: "Transfer Number",
      render: (value: string) => (
        <span className="font-mono text-sm font-medium">{value || "N/A"}</span>
      ),
    },
    {
      key: "itemName",
      header: "Item",
      render: (value: string, transfer: any) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span>{value || transfer.itemCode || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-blue-600">{value || "0"}</span>
        </div>
      ),
    },
    {
      key: "transferRoute",
      header: "Transfer Route",
      render: (value: string, transfer: any) => (
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {transfer.fromLocation || "N/A"} → {transfer.toLocation || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge className={`border ${getStatusColor(value || "Draft")}`}>
          {value || "Draft"}
        </Badge>
      ),
    },
    {
      key: "transferDate",
      header: "Transfer Date",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{value ? formatDate(value) : "N/A"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, transfer: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTransfer(transfer);
              setShowDetailsDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Info",
                description: "Edit functionality will be implemented soon",
              });
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-6 border border-slate-200/50 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/50">
              <ArrowLeftRight className="h-10 w-10 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Stock Transfer</h1>
              <p className="text-slate-600 text-base">Manage transfers between locations and warehouses</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Location Management</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 font-medium rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Stock Transfer</DialogTitle>
                <DialogDescription>
                  Transfer stock between locations or warehouses
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transferNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter transfer number" {...field} />
                          </FormControl>
                          <FormMessage />
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All transfers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                <p className="text-xs text-muted-foreground">Being prepared</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">Ready to transfer</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                <Truck className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.inTransit}</div>
                <p className="text-xs text-muted-foreground">Being moved</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Successfully transferred</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground">Cancelled transfers</p>
              </CardContent>
            </Card>
          </div>
        )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="itemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {items.length === 0 ? (
                                <div className="px-4 py-2 text-gray-500 text-sm">No items available</div>
                              ) : (
                                items.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name
                                      ? item.name
                                      : item.description
                                        ? item.description
                                        : item.itemCode
                                          ? item.itemCode
                                          : `Item-${item.id}`}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fromLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select from location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="toLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select to location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter quantity"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transferDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requestedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requested By</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter person name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Reason</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Stock Rebalancing">Stock Rebalancing</SelectItem>
                              <SelectItem value="Production Requirement">Production Requirement</SelectItem>
                              <SelectItem value="Store Replenishment">Store Replenishment</SelectItem>
                              <SelectItem value="Quality Control">Quality Control</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                              <SelectItem value="Emergency Request">Emergency Request</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="In Transit">In Transit</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any additional notes..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTransferMutation.isPending}>
                      {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All transfers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">Being prepared</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Ready to transfer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.inTransit}</div>
              <p className="text-xs text-muted-foreground">Being moved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Successfully transferred</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Cancelled transfers</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transfers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="In Transit">In Transit</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Transfers</CardTitle>
          <CardDescription>
            {filteredTransfers.length} of {Array.isArray(stockTransfers) ? stockTransfers.length : 0} transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredTransfers}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No stock transfers found. Create your first transfer to get started."
          />
        </CardContent>
      </Card>

      {/* Transfer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Stock Transfer Details</DialogTitle>
            <DialogDescription>
              Transfer #{selectedTransfer?.referenceNumber || "N/A"}
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Transfer Number</Label>
                    <p className="text-sm font-medium">{selectedTransfer.referenceNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Item</Label>
                    <p className="text-sm font-medium">{selectedTransfer.itemName || selectedTransfer.itemCode || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                    <p className="text-sm font-medium text-blue-600">{selectedTransfer.quantity || "0"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge className={`border ${getStatusColor(selectedTransfer.status || "Draft")}`}>
                      {selectedTransfer.status || "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Transfer Date</Label>
                    <p className="text-sm font-medium">
                      {selectedTransfer.transferDate ? formatDate(selectedTransfer.transferDate) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">From Location</Label>
                    <p className="text-sm font-medium">{selectedTransfer.fromLocation || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">To Location</Label>
                    <p className="text-sm font-medium">{selectedTransfer.toLocation || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Requested By</Label>
                    <p className="text-sm font-medium">{selectedTransfer.requestedBy || "N/A"}</p>
                  </div>
                </div>
              </div>
              {selectedTransfer.reason && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Transfer Reason</Label>
                  <p className="text-sm font-medium">{selectedTransfer.reason}</p>
                </div>
              )}
              {selectedTransfer.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedTransfer.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}