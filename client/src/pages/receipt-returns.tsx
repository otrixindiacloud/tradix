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
  RotateCcw,
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
  Undo2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/tables/data-table";
import { formatDate, formatCurrency } from "@/lib/utils";

// Form schemas
const receiptReturnSchema = z.object({
  returnNumber: z.string().min(1, "Return number is required"),
  goodsReceiptId: z.string().min(1, "Goods receipt is required"),
  itemId: z.string().min(1, "Item is required"),
  returnQuantity: z.number().min(1, "Return quantity must be greater than 0"),
  returnReason: z.string().min(1, "Return reason is required"),
  returnDate: z.string().min(1, "Return date is required"),
  returnedBy: z.string().min(1, "Returned by is required"),
  status: z.enum(["Draft", "Pending Approval", "Approved", "Returned", "Credited"]),
  notes: z.string().optional(),
});

type ReceiptReturnForm = z.infer<typeof receiptReturnSchema>;

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "Pending Approval":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Approved":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Returned":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "Credited":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function ReceiptReturnsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch receipt returns (using supplier returns)
  const { data: receiptReturns = [], isLoading } = useQuery({
    queryKey: ["receipt-returns"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/supplier-returns");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch receipt returns:", error);
        return [];
      }
    },
  });

  // Fetch goods receipts for dropdown
  const { data: goodsReceipts = [] } = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/goods-receipt-headers");
        const data = await response.json();
        // Ensure each receipt has a receiptNumber property
        return Array.isArray(data)
          ? data.map((receipt: any) => ({
              ...receipt,
              receiptNumber: receipt.receiptNumber || receipt.number || receipt.id,
            }))
          : [];
      } catch (error) {
        console.error("Failed to fetch goods receipts:", error);
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

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["receipt-returns-stats"],
    queryFn: async () => {
      const returnsArray = Array.isArray(receiptReturns) ? receiptReturns : [];
      const total = returnsArray.length;
      const draft = returnsArray.filter(r => r.status === "Draft").length;
      const pending = returnsArray.filter(r => r.status === "Pending Approval").length;
      const approved = returnsArray.filter(r => r.status === "Approved").length;
      const returned = returnsArray.filter(r => r.status === "Returned").length;
      const credited = returnsArray.filter(r => r.status === "Credited").length;
      
      // Calculate total return value
      const totalValue = returnsArray.reduce((sum, ret) => {
        return sum + (parseFloat(ret.returnQuantity || "0") * parseFloat(ret.unitPrice || "0"));
      }, 0);
      
      return { total, draft, pending, approved, returned, credited, totalValue };
    },
    enabled: Array.isArray(receiptReturns) && receiptReturns.length > 0,
  });

  // Create receipt return mutation
  const createReturnMutation = useMutation({
    mutationFn: async (data: ReceiptReturnForm) => {
      return await apiRequest("POST", "/api/supplier-returns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipt-returns"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Receipt return created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create receipt return",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ReceiptReturnForm>({
    resolver: zodResolver(receiptReturnSchema),
    defaultValues: {
      returnNumber: "",
      goodsReceiptId: "",
      itemId: "",
      returnQuantity: 0,
      returnReason: "",
      returnDate: "",
      returnedBy: "",
      status: "Draft",
      notes: "",
    },
  });

  const onSubmit = (data: ReceiptReturnForm) => {
    createReturnMutation.mutate(data);
  };

  // Filter receipt returns
  const filteredReturns = (Array.isArray(receiptReturns) ? receiptReturns : []).filter((returnItem: any) => {
    const matchesSearch = 
      returnItem.returnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.returnedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.returnReason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || returnItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns = [
    {
      key: "returnNumber",
      header: "Return Number",
      render: (value: string) => (
        <span className="font-mono text-sm font-medium">{value || "N/A"}</span>
      ),
    },
    {
      key: "itemName",
      header: "Item",
      render: (value: string, returnItem: any) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span>{value || returnItem.itemCode || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "returnQuantity",
      header: "Return Qty",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Undo2 className="h-4 w-4 text-orange-500" />
          <span className="font-medium text-orange-600">{value || "0"}</span>
        </div>
      ),
    },
    {
      key: "returnReason",
      header: "Reason",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <span className="truncate max-w-[150px]" title={value}>{value || "N/A"}</span>
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
      key: "returnDate",
      header: "Return Date",
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
      render: (_: any, returnItem: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedReturn(returnItem);
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
      <div className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-xl p-6 border border-slate-200/50 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/50">
              <RotateCcw className="h-10 w-10 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Returns Receipt</h1>
              <p className="text-slate-600 text-base">Manage returns of received goods and track return processing</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Return Processing</span>
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
              <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 font-medium rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Process Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Process Receipt Return</DialogTitle>
                <DialogDescription>
                  Create a new return for received goods
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="returnNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter return number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="goodsReceiptId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goods Receipt (Receipt Number)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select goods receipt" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {goodsReceipts.length === 0 ? (
                                <div className="px-4 py-2 text-gray-500 text-sm">No goods receipts available</div>
                              ) : (
                                goodsReceipts.map((receipt: any) => (
                                  <SelectItem key={receipt.id} value={receipt.id}>
                                    {receipt.receiptNumber && typeof receipt.receiptNumber === "string"
                                      ? receipt.receiptNumber
                                      : `GR-${receipt.id}`}
                                    {receipt.supplierName
                                      ? ` — ${receipt.supplierName}`
                                      : receipt.supplier?.name
                                        ? ` — ${receipt.supplier.name}`
                                        : ""}
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
                    <FormField
                      control={form.control}
                      name="returnQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Quantity</FormLabel>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="returnDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="returnedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Returned By</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter person name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="returnReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Reason</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select return reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                            <SelectItem value="Wrong Item">Wrong Item</SelectItem>
                            <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                            <SelectItem value="Excess Quantity">Excess Quantity</SelectItem>
                            <SelectItem value="Expired">Expired</SelectItem>
                            <SelectItem value="Customer Request">Customer Request</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <SelectItem value="Returned">Returned</SelectItem>
                            <SelectItem value="Credited">Credited</SelectItem>
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
                    <Button type="submit" disabled={createReturnMutation.isPending}>
                      {createReturnMutation.isPending ? "Creating..." : "Process Return"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All returns</p>
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
              <p className="text-xs text-muted-foreground">Ready to return</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Returned</CardTitle>
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.returned}</div>
              <p className="text-xs text-muted-foreground">Items returned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credited</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.credited}</div>
              <p className="text-xs text-muted-foreground">Credit processed</p>
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
                placeholder="Search returns..."
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
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Credited">Credited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Returns Receipt </CardTitle>
          <CardDescription>
            {filteredReturns.length} of {Array.isArray(receiptReturns) ? receiptReturns.length : 0} returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredReturns}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No receipt returns found. Process your first return to get started."
          />
        </CardContent>
      </Card>

      {/* Return Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Returns Receipt Details</DialogTitle>
            <DialogDescription>
              Return #{selectedReturn?.returnNumber || "N/A"}
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Return Number</Label>
                    <p className="text-sm font-medium">{selectedReturn.returnNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Item</Label>
                    <p className="text-sm font-medium">{selectedReturn.itemName || selectedReturn.itemCode || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Return Quantity</Label>
                    <p className="text-sm font-medium text-orange-600">{selectedReturn.returnQuantity || "0"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge className={`border ${getStatusColor(selectedReturn.status || "Draft")}`}>
                      {selectedReturn.status || "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Return Date</Label>
                    <p className="text-sm font-medium">
                      {selectedReturn.returnDate ? formatDate(selectedReturn.returnDate) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Returned By</Label>
                    <p className="text-sm font-medium">{selectedReturn.returnedBy || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Return Reason</Label>
                    <p className="text-sm font-medium">{selectedReturn.returnReason || "N/A"}</p>
                  </div>
                </div>
              </div>
              {selectedReturn.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedReturn.notes}
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