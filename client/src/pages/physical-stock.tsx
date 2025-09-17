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
  Boxes,
  Plus, 
  Search, 
  Edit, 
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  TrendingUp,
  Package,
  Warehouse,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/tables/data-table";
import { formatDate, formatCurrency } from "@/lib/utils";

const physicalStockSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  location: z.string().min(1, "Location is required"),
  quantity: z.number().min(0, "Quantity must be 0 or more"),
  lastCounted: z.string().min(1, "Date is required"),
  countedBy: z.string().min(1, "Counted by is required"),
  notes: z.string().optional(),
});

type PhysicalStockForm = z.infer<typeof physicalStockSchema>;

const getStatusColor = (quantity: number) => {
  if (quantity === 0) return "bg-red-100 text-red-800 border-red-300";
  if (quantity < 10) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

export default function PhysicalStockPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch physical stock
  const { data: physicalStock = [], isLoading } = useQuery({
    queryKey: ["physical-stock"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/physical-stock");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch items for dropdown
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/items");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Mock locations
  const locations = [
    { id: "warehouse-a", name: "Warehouse A" },
    { id: "warehouse-b", name: "Warehouse B" },
    { id: "store-front", name: "Store Front" },
    { id: "production", name: "Production Floor" },
  ];

  // Statistics
  const stats = {
    totalItems: physicalStock.length,
    zeroStock: physicalStock.filter((s: any) => s.quantity === 0).length,
    lowStock: physicalStock.filter((s: any) => s.quantity > 0 && s.quantity < 10).length,
    healthyStock: physicalStock.filter((s: any) => s.quantity >= 10).length,
    totalQuantity: physicalStock.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0),
  };

  // Create mutation
  const createStockMutation = useMutation({
    mutationFn: async (data: PhysicalStockForm) => {
      return await apiRequest("POST", "/api/physical-stock", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physical-stock"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Physical stock entry created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create entry",
        variant: "destructive",
      });
    },
  });

  const form = useForm<PhysicalStockForm>({
    resolver: zodResolver(physicalStockSchema),
    defaultValues: {
      itemId: "",
      location: "",
      quantity: 0,
      lastCounted: "",
      countedBy: "",
      notes: "",
    },
  });

  const onSubmit = (data: PhysicalStockForm) => {
    createStockMutation.mutate(data);
  };

  // Filter
  const filteredStock = (Array.isArray(physicalStock) ? physicalStock : []).filter((stock: any) => {
    const matchesSearch =
      stock.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.countedBy?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Table columns
  const columns = [
    {
      key: "itemName",
      header: "Item",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span>{value || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-gray-500" />
          <span>{value || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (value: number) => (
        <Badge className={`border ${getStatusColor(value)}`}>{value}</Badge>
      ),
    },
    {
      key: "lastCounted",
      header: "Last Counted",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{value ? formatDate(value) : "N/A"}</span>
        </div>
      ),
    },
    {
      key: "countedBy",
      header: "Counted By",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span>{value || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, stock: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStock(stock);
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
      <div className="bg-gradient-to-r from-slate-50 to-green-50 rounded-xl p-6 border border-slate-200/50 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/50">
              <Boxes className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Physical Stock</h1>
              <p className="text-slate-600 text-base">View and update physical inventory counts</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Inventory Control</span>
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
              <Button className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 text-white font-medium rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Count
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Physical Stock Count</DialogTitle>
                <DialogDescription>
                  Record a new physical stock count for an item
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              {items.map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name || item.description || item.itemCode}
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
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.name}>
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
                      name="lastCounted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Counted</FormLabel>
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
                      name="countedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Counted By</FormLabel>
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
                    <Button type="submit" disabled={createStockMutation.isPending}>
                      {createStockMutation.isPending ? "Creating..." : "Create Count"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">All items counted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.zeroStock}</div>
            <p className="text-xs text-muted-foreground">Items out of stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.healthyStock}</div>
            <p className="text-xs text-muted-foreground">Sufficient quantity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.totalQuantity}</div>
            <p className="text-xs text-muted-foreground">All counted stock</p>
          </CardContent>
        </Card>
      </div>

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
                placeholder="Search stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Physical Stock</CardTitle>
          <CardDescription>
            {filteredStock.length} of {Array.isArray(physicalStock) ? physicalStock.length : 0} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredStock}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No physical stock found. Record your first count to get started."
          />
        </CardContent>
      </Card>

      {/* Stock Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Physical Stock Details</DialogTitle>
            <DialogDescription>
              Item: {selectedStock?.itemName || "N/A"}
            </DialogDescription>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Item</Label>
                    <p className="text-sm font-medium">{selectedStock.itemName || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Location</Label>
                    <p className="text-sm font-medium">{selectedStock.location || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                    <Badge className={`border ${getStatusColor(selectedStock.quantity || 0)}`}>{selectedStock.quantity || 0}</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Counted</Label>
                    <p className="text-sm font-medium">
                      {selectedStock.lastCounted ? formatDate(selectedStock.lastCounted) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Counted By</Label>
                    <p className="text-sm font-medium">{selectedStock.countedBy || "N/A"}</p>
                  </div>
                </div>
              </div>
              {selectedStock.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedStock.notes}
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