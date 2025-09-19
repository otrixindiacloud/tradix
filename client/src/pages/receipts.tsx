import React, { useState } from "react";
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
  Package,
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
  Truck,
  Scan,
  ClipboardCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/tables/data-table";
import { formatDate, formatCurrency } from "@/lib/utils";

// Form schemas
const goodsReceiptSchema = z.object({
  receiptNumber: z.string().min(1, "Receipt number is required"),
  supplierLpoId: z.string().min(1, "Supplier LPO is required"),
  receiptDate: z.string().min(1, "Receipt date is required"),
  receivedBy: z.string().min(1, "Received by is required"),
  status: z.enum(["Pending", "Partial", "Complete", "Discrepancy"]),
  notes: z.string().optional(),
});

type GoodsReceiptForm = z.infer<typeof goodsReceiptSchema>;

// Status badge colors


const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "Partial":
      return <Truck className="h-4 w-4 text-blue-600" />;
    case "Complete":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "Discrepancy":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "Draft":
      return <Clock className="h-4 w-4 text-gray-600" />;
    case "Pending Approval":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case "Approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "Paid":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "Partially Paid":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "Overdue":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "Disputed":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "Cancelled":
      return <XCircle className="h-4 w-4 text-gray-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  let colorClass = "text-gray-600 border-gray-300 bg-gray-50";
  let icon = getStatusIcon(status);
  switch (status) {
    case "Pending":
      colorClass = "text-yellow-600 border-yellow-300 bg-yellow-50";
      icon = <Clock className="h-4 w-4 text-yellow-600" />;
      break;
    case "Partial":
      colorClass = "text-blue-600 border-blue-300 bg-blue-50";
      icon = <Truck className="h-4 w-4 text-blue-600" />;
      break;
    case "Completed":
      colorClass = "text-green-600 border-green-300 bg-green-50";
      icon = <CheckCircle className="h-4 w-4 text-green-600" />;
      break;
    case "Discrepancy":
      colorClass = "text-red-600 border-red-300 bg-red-50";
      icon = <AlertTriangle className="h-4 w-4 text-red-600" />;
      break;
    case "Draft":
      colorClass = "text-yellow-600 border-yellow-300 bg-yellow-50";
      icon = <Clock className="h-4 w-4 text-yellow-600" />;
      break;
    default:
      colorClass = "text-gray-600 border-gray-300 bg-gray-50";
      icon = <Clock className="h-4 w-4 text-gray-600" />;
  }
  return (
    <Badge variant="outline" className={`${colorClass} flex items-center  gap-1 px-3 py-1 font-semibold`}>
      {icon}
      <span className="ml-0 ">{status}</span>
    </Badge>
  );
};

export default function ReceiptsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  // Fetch supplier LPOs for dropdown
  const { data: supplierLpos = [] } = useQuery({
    queryKey: ["supplier-lpos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/supplier-lpos");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: showCreateDialog,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<any | null>(null);

  // Sync form values with editForm when opening the edit dialog
  React.useEffect(() => {
    if (showEditDialog && editForm) {
      form.setValue("receiptNumber", editForm.receiptNumber || "");
      form.setValue("supplierLpoId", editForm.supplierLpoId || "");
      form.setValue("receiptDate", editForm.receiptDate || "");
      form.setValue("receivedBy", editForm.receivedBy || "");
      form.setValue("status", editForm.status || "Pending");
      form.setValue("notes", editForm.notes || "");
    }
    // Reset form when dialog closes
    if (!showEditDialog) {
      form.reset();
    }
  }, [showEditDialog, editForm]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch goods receipts
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/receipts");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["receipts-stats"],
    queryFn: async () => {
      const receiptsArray = Array.isArray(receipts) ? receipts : [];
      const total = receiptsArray.length;
      const pending = receiptsArray.filter(r => r.status === "Pending").length;
      const partial = receiptsArray.filter(r => r.status === "Partial").length;
      const complete = receiptsArray.filter(r => r.status === "Complete").length;
      const discrepancy = receiptsArray.filter(r => r.status === "Discrepancy").length;
      
      return { total, pending, partial, complete, discrepancy };
    },
    enabled: Array.isArray(receipts) && receipts.length > 0,
  });

  // Create goods receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (data: GoodsReceiptForm) => {
      return await apiRequest("POST", "/api/receipts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: " receipt created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goods receipt",
        variant: "destructive",
      });
    },
  });

  // Update goods receipt mutation
  const updateReceiptMutation = useMutation({
    mutationFn: async (data: GoodsReceiptForm & { id: string }) => {
      return await apiRequest("PUT", `/api/receipts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Goods receipt updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goods receipt",
        variant: "destructive",
      });
    },
  });

  const form = useForm<GoodsReceiptForm>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      receiptNumber: "",
      supplierLpoId: "",
      receiptDate: "",
      receivedBy: "",
      status: "Pending",
      notes: "",
    },
  });

  const onSubmit = (data: GoodsReceiptForm) => {
    createReceiptMutation.mutate(data);
  };

  // Filter receipts
  const filteredReceipts = (Array.isArray(receipts) ? receipts : []).filter((receipt: any) => {
    const matchesSearch = 
      receipt.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.receivedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns = [
    {
      key: "receiptNumber",
      header: "Receipt Number",
      render: (value: string) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: "supplierName",
      header: "Supplier",
      render: (_: string, receipt: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span>{receipt.supplierName || receipt.supplierLpoId || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "receivedBy",
      header: "Received By",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "receiptDate",
      header: "Receipt Date",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, receipt: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedReceipt(receipt);
              setShowDetailsDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditForm(receipt);
              setShowEditDialog(true);
              // Set form values for editing
              form.setValue("receiptNumber", receipt.receiptNumber || "");
              form.setValue("supplierLpoId", receipt.supplierLpoId || "");
              form.setValue("receiptDate", receipt.receiptDate || "");
              form.setValue("receivedBy", receipt.receivedBy || "");
              form.setValue("status", receipt.status || "Pending");
              form.setValue("notes", receipt.notes || "");
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
      <div className="bg-gradient-to-r from-slate-50 to-green-50 rounded-xl p-6 border border-slate-200/50 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/50">
              <Package className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Inventory Receipts</h1>
              <p className="text-slate-600 text-base">Record and manage incoming inventory receipts for inventory tracking</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>System Active</span>
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
              <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-100 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 font-medium rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Inventory Receipt</DialogTitle>
                <DialogDescription>
                  Record a new inventory receipt for inventory tracking
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="receiptNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter receipt number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierLpoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier LPO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Supplier LPO" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {supplierLpos.map((lpo: any) => (
                                <SelectItem key={lpo.id} value={lpo.id}>
                                  {lpo.lpoNumber}
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
                      name="receiptDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received By</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter receiver name" {...field} />
                          </FormControl>
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
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                            <SelectItem value="Discrepancy">Discrepancy</SelectItem>
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
                    <Button type="submit" disabled={createReceiptMutation.isPending}>
                      {createReceiptMutation.isPending ? "Creating..." : "Create Receipt"}
                    </Button>
                  </div>
                </form>
              </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Receipt Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Receipt</DialogTitle>
            <DialogDescription>
              Update details for receipt #{form.getValues("receiptNumber")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                if (editForm && editForm.id) {
                  // Update via API (PUT /api/receipts/:id)
                  updateReceiptMutation.mutate({ ...data, id: editForm.id }, {
                    onSuccess: () => {
                      setShowEditDialog(false);
                      setEditForm(null);
                      form.reset();
                      queryClient.invalidateQueries({ queryKey: ["receipts"] });
                    }
                  });
                }
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplierLpoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier LPO</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Supplier LPO" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supplierLpos.map((lpo: any) => (
                            <SelectItem key={lpo.id} value={lpo.id}>
                              {lpo.lpoNumber}
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
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received By</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                        <SelectItem value="Discrepancy">Discrepancy</SelectItem>
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateReceiptMutation.isPending}>
                  {updateReceiptMutation.isPending ? "Saving..." : "Save Changes"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All receipts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting receipt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partial</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.partial}</div>
              <p className="text-xs text-muted-foreground">Partially received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complete</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
              <p className="text-xs text-muted-foreground">Fully received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.discrepancy}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
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
                placeholder="Search receipts..."
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
                <SelectItem value="Discrepancy">Discrepancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Receipts</CardTitle>
          <CardDescription>
            {filteredReceipts.length} of {Array.isArray(receipts) ? receipts.length : 0} receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredReceipts}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No goods receipts found. Create your first receipt to get started."
          />
        </CardContent>
      </Card>

      {/* Receipt Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Goods Receipt Details</DialogTitle>
            <DialogDescription>
              Receipt #{selectedReceipt?.receiptNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Receipt Number</Label>
                    <p className="text-sm font-medium">{selectedReceipt.receiptNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Received By</Label>
                    <p className="text-sm font-medium">{selectedReceipt.receivedBy}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    {getStatusBadge(selectedReceipt.status || "Pending")}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Receipt Date</Label>
                    <p className="text-sm font-medium">
                      {selectedReceipt.receiptDate ? formatDate(selectedReceipt.receiptDate) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Supplier LPO</Label>
                    <p className="text-sm font-medium">{selectedReceipt.supplierLpoId || "N/A"}</p>
                  </div>
                </div>
              </div>
              {selectedReceipt.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedReceipt.notes}
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