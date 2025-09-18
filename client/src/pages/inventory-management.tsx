import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package,
  Boxes,
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ScanLine,
  Truck,
  FileText,
  History,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { 
  Item,
  InventoryLevel, 
  GoodsReceiptHeader,
  StockMovement 
} from "@shared/schema";

// Form schemas
const inventoryItemSchema = z.object({
  supplierCode: z.string().min(1, "Supplier code is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  barcode: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  isActive: z.boolean().default(true),
});

const inventoryVariantSchema = z.object({
  inventoryItemId: z.string().min(1, "Item is required"),
  variantName: z.string().min(1, "Variant name is required"),
  variantValue: z.string().min(1, "Variant value is required"),
  additionalCost: z.number().optional(),
  barcode: z.string().optional(),
});

const goodsReceiptSchema = z.object({
  receiptNumber: z.string().min(1, "Receipt number is required"),
  supplierLpoId: z.string().min(1, "Supplier LPO is required"),
  receiptDate: z.string().min(1, "Receipt date is required"),
  receivedBy: z.string().min(1, "Received by is required"),
  status: z.enum(["Draft", "Completed", "Partially Received"]),
  notes: z.string().optional(),
});

const supplierReturnSchema = z.object({
  returnNumber: z.string().min(1, "Return number is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  returnDate: z.string().min(1, "Return date is required"),
  reason: z.string().min(1, "Return reason is required"),
  status: z.enum(["Draft", "Pending", "Approved", "Completed"]),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  notes: z.string().optional(),
});

type InventoryItemForm = z.infer<typeof inventoryItemSchema>;
type InventoryVariantForm = z.infer<typeof inventoryVariantSchema>;
type GoodsReceiptForm = z.infer<typeof goodsReceiptSchema>;
type SupplierReturnForm = z.infer<typeof supplierReturnSchema>;

function InventoryItemsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showInactiveItems, setShowInactiveItems] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InventoryItemForm>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      supplierCode: "",
      description: "",
      category: "",
      unitOfMeasure: "",
      supplierId: "",
      barcode: "",
      weight: undefined,
      dimensions: "",
      isActive: true,
    },
  });

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading, error: itemsError } = useQuery({
    queryKey: ["/api/inventory-items", { 
      search: searchQuery, 
      category: selectedCategory === "all" ? undefined : selectedCategory,
      isActive: !showInactiveItems ? true : undefined 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (!showInactiveItems) params.append('isActive', 'true');
      
      const url = `/api/inventory-items${params.toString() ? '?' + params.toString() : ''}`;
      console.log("Fetching inventory items from:", url);
      const response = await fetch(url, { credentials: "include" });
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory items: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Inventory items data:", data);
      return data;
    },
    enabled: true,
  });

  // Fetch suppliers for the form
  const { data: suppliers = [], error: suppliersError } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true,
  });

  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: InventoryItemForm) => {
      const response = await apiRequest("POST", "/api/inventory-items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-items"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Inventory item created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItemForm> }) => {
      const response = await apiRequest("PUT", `/api/inventory-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-items"] });
      setEditingItem(null);
      form.reset();
      toast({ title: "Success", description: "Inventory item updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/inventory-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-items"] });
      toast({ title: "Success", description: "Inventory item deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: InventoryItemForm) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      supplierCode: item.supplierCode,
      description: item.description,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      supplierId: item.supplierId,
      barcode: item.barcode || "",
      weight: item.weight || undefined,
      dimensions: item.dimensions || "",
      isActive: item.isActive,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set((inventoryItems as any[]).map((item: any) => item.category).filter(Boolean)));

  return (
    <div className="space-y-6" data-testid="inventory-items-tab">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by supplier code, description, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-items"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="select-category-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactiveItems}
            onChange={(e) => setShowInactiveItems(e.target.checked)}
            data-testid="checkbox-show-inactive"
          />
          <Label htmlFor="showInactive">Show inactive items</Label>
        </div>

        <Dialog open={showCreateDialog || !!editingItem} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingItem(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-item">
              <Plus className="h-4 w-4 mr-2" />
              Add Inventory Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Inventory Item" : "Create New Inventory Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the inventory item details." : "Add a new item to your inventory."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-supplier-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-barcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unitOfMeasure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., kg, pcs, m" data-testid="input-unit-measure" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier: any) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                            data-testid="input-weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 10x20x30 cm" data-testid="input-dimensions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-is-active"
                        />
                      </FormControl>
                      <FormLabel>Active Item</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingItem(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    data-testid="button-save"
                  >
                    {editingItem ? "Update Item" : "Create Item"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items Grid */}
      {itemsError || suppliersError ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Error loading data: {itemsError?.message || suppliersError?.message}
          </p>
          <Button onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/inventory-items"] });
            queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
          }}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(inventoryItems as any[]).map((item: any) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow border border-gray-200 bg-white rounded-xl" data-testid={`card-item-${item.id}`}> 
              <CardHeader className="pb-2 flex flex-row items-center gap-3">
                {/* Avatar or placeholder image */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <Boxes className="h-7 w-7 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold text-gray-900 truncate">
                    {item.description}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded">{item.supplierCode}</span>
                    <span className="text-xs text-gray-400">{item.category}</span>
                  </div>
                </div>
                <Badge variant={item.isActive ? "default" : "secondary"} className="ml-2">
                  {item.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium text-gray-900">{item.supplierName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Unit:</span>
                    <span>{item.unitOfMeasure}</span>
                  </div>
                  {item.barcode && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Barcode:</span>
                      <span className="font-mono text-blue-700">{item.barcode}</span>
                    </div>
                  )}
                  {item.weight && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Weight:</span>
                      <span>{item.weight} kg</span>
                    </div>
                  )}
                  {item.dimensions && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Dimensions:</span>
                      <span>{item.dimensions}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-${item.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {inventoryItems.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by adding your first inventory item to the system.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-item">
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StockLevelsTab() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: stockLevels = [], isLoading } = useQuery({
    queryKey: ["/api/inventory-levels", { location: selectedLocation, lowStock: showLowStock }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocation) params.append('location', selectedLocation);
      if (showLowStock) params.append('lowStock', 'true');
      
      const url = `/api/inventory-levels${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: true,
  });

  const locations = Array.from(new Set((stockLevels as any[]).map((level: any) => level.storageLocation).filter(Boolean)));

  return (
    <div className="space-y-6" data-testid="stock-levels-tab">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-48" data-testid="select-location-filter">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showLowStock"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            data-testid="checkbox-low-stock"
          />
          <Label htmlFor="showLowStock">Show only low stock items</Label>
        </div>
      </div>

      {/* Stock Levels Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stockLevels as any[]).map((level: any) => {
            const isLowStock = level.quantityAvailable < level.reorderLevel;
            
            return (
              <Card key={level.id} className="hover:shadow-md transition-shadow" data-testid={`card-stock-${level.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium">Item: {level.itemId}</CardTitle>
                    {isLowStock && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{level.storageLocation}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">On Hand:</span>
                      <span className="font-medium">{level.quantityOnHand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-medium text-green-600">{level.quantityAvailable}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reserved:</span>
                      <span className="font-medium text-orange-600">{level.quantityReserved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reorder Level:</span>
                      <span className="font-medium">{level.reorderLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Level:</span>
                      <span className="font-medium">{level.maxLevel}</span>
                    </div>
                  </div>

                  {/* Stock Status Indicator */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Stock Level</span>
                      {isLowStock ? (
                        <span className="text-red-600 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Low Stock
                        </span>
                      ) : level.quantityAvailable > level.maxLevel * 0.8 ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          High Stock
                        </span>
                      ) : (
                        <span className="text-blue-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Normal Stock
                        </span>
                      )}
                    </div>
                    
                    {/* Main Stock Level Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>{level.maxLevel}</span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-3">
                        {/* Background markers for reorder level */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10"
                          style={{ left: `${(level.reorderLevel / level.maxLevel) * 100}%` }}
                          title={`Reorder Level: ${level.reorderLevel}`}
                        />
                        
                        {/* Available stock bar */}
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            isLowStock 
                              ? "bg-gradient-to-r from-red-500 to-red-600" 
                              : level.quantityAvailable > level.maxLevel * 0.8
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : "bg-gradient-to-r from-blue-500 to-blue-600"
                          }`}
                          style={{
                            width: `${Math.min((level.quantityAvailable / level.maxLevel) * 100, 100)}%`,
                          }}
                        />
                        
                        {/* Reserved stock overlay */}
                        {level.quantityReserved > 0 && (
                          <div
                            className="absolute top-0 h-3 bg-orange-300 opacity-60 rounded-full"
                            style={{
                              left: `${Math.max(0, ((level.quantityAvailable - level.quantityReserved) / level.maxLevel) * 100)}%`,
                              width: `${Math.min((level.quantityReserved / level.maxLevel) * 100, 100)}%`,
                            }}
                            title={`Reserved: ${level.quantityReserved}`}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Stock Composition Mini Chart */}
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center">
                        <div className="h-1 bg-blue-500 rounded mb-1"></div>
                        <span className="text-gray-600">Available</span>
                        <div className="font-medium">{level.quantityAvailable}</div>
                      </div>
                      <div className="text-center">
                        <div className="h-1 bg-orange-300 rounded mb-1"></div>
                        <span className="text-gray-600">Reserved</span>
                        <div className="font-medium">{level.quantityReserved}</div>
                      </div>
                      <div className="text-center">
                        <div className="h-1 bg-gray-300 rounded mb-1"></div>
                        <span className="text-gray-600">Total</span>
                        <div className="font-medium">{level.quantityOnHand}</div>
                      </div>
                    </div>
                    
                    {/* Stock Status Summary */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Fill Rate:</span>
                        <span className="font-medium">
                          {Math.round((level.quantityAvailable / level.maxLevel) * 100)}%
                        </span>
                      </div>
                      {isLowStock && (
                        <div className="mt-1 text-xs text-red-600">
                          Reorder needed: {level.reorderLevel - level.quantityAvailable} units
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(stockLevels as any[]).length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock levels found</h3>
            <p className="text-gray-600 text-center">
              Stock levels will appear here once you have inventory items and stock movements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GoodsReceiptsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<any | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    receiptNumber: "",
    receiptDate: "",
    receivedBy: "",
    status: "Draft",
    notes: "",
  });
  const [editFormData, setEditFormData] = useState({
    receiptNumber: "",
    receiptDate: "",
    receivedBy: "",
    status: "Draft",
    notes: "",
    expectedDeliveryDate: "",
    actualDeliveryDate: "",
    totalItems: 0,
    totalQuantityExpected: 0,
    totalQuantityReceived: 0,
    discrepancyFlag: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goodsReceipts = [], isLoading } = useQuery({
    queryKey: ["/api/goods-receipt-headers", { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
      
      const url = `/api/goods-receipt-headers${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch goods receipts');
      }
      return response.json();
    },
    enabled: true,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-500">{status}</Badge>;
      case "Partially Received":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">{status}</Badge>;
      case "Draft":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // State for selected Supplier LPO ID
  const [selectedLpoId, setSelectedLpoId] = useState("");
  const [editSelectedLpoId, setEditSelectedLpoId] = useState("");
  // Fetch supplier LPOs for dropdown
  const { data: supplierLpos = [] } = useQuery({
    queryKey: ["/api/supplier-lpos"],
    queryFn: async () => {
      const response = await fetch("/api/supplier-lpos");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: showCreateDialog || showEditDialog,
  });

  // Create goods receipt mutation
  const createGoodsReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/goods-receipt-headers", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create goods receipt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goods-receipt-headers"] });
      setShowCreateDialog(false);
      setSelectedLpoId("");
      setReceiptFile(null);
      setFormData({
        receiptNumber: "",
        receiptDate: "",
        receivedBy: "",
        status: "Draft",
        notes: "",
      });
      toast({
        title: "Success",
        description: "Goods receipt created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating goods receipt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create goods receipt",
        variant: "destructive",
      });
    },
  });

  // Update goods receipt mutation
  const updateGoodsReceiptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/goods-receipt-headers/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update goods receipt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goods-receipt-headers"] });
      setShowEditDialog(false);
      setEditingReceipt(null);
      setEditSelectedLpoId("");
      setEditFormData({
        receiptNumber: "",
        receiptDate: "",
        receivedBy: "",
        status: "Draft",
        notes: "",
        expectedDeliveryDate: "",
        actualDeliveryDate: "",
        totalItems: 0,
        totalQuantityExpected: 0,
        totalQuantityReceived: 0,
        discrepancyFlag: false,
      });
      toast({
        title: "Success",
        description: "Goods receipt updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating goods receipt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update goods receipt",
        variant: "destructive",
      });
    },
  });

  const handleCreateReceipt = async () => {
    if (!formData.receiptNumber || !selectedLpoId || !formData.receiptDate || !formData.receivedBy) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected LPO to extract supplier information
      const selectedLpo = supplierLpos.find((lpo: any) => lpo.id === selectedLpoId);
      if (!selectedLpo) {
        toast({
          title: "Error",
          description: "Selected supplier LPO not found",
          variant: "destructive",
        });
        return;
      }

      console.log("Selected LPO:", selectedLpo);
      console.log("Form Data:", formData);

      const submitData = {
        receiptNumber: formData.receiptNumber,
        supplierLpoId: selectedLpoId,
        supplierId: selectedLpo.supplierId || selectedLpo.supplier?.id,
        receiptDate: formData.receiptDate,
        receivedBy: formData.receivedBy,
        status: formData.status,
        notes: formData.notes || null,
      };

      console.log("Submit Data:", submitData);

      // TODO: Handle file upload separately if needed
      if (receiptFile) {
        console.log("File upload not yet implemented:", receiptFile.name);
      }

      createGoodsReceiptMutation.mutate(submitData);
    } catch (error) {
      console.error("Error preparing goods receipt data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare goods receipt data",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleViewReceipt = (receipt: any) => {
    setSelectedReceipt(receipt);
    setShowViewDialog(true);
  };

  const handleEditReceipt = (receipt: any) => {
    setEditingReceipt(receipt);
    setEditFormData({
      receiptNumber: receipt.receiptNumber,
      receiptDate: receipt.receiptDate,
      receivedBy: receipt.receivedBy,
      status: receipt.status,
      notes: receipt.notes || "",
      expectedDeliveryDate: receipt.expectedDeliveryDate || "",
      actualDeliveryDate: receipt.actualDeliveryDate || "",
      totalItems: typeof receipt.totalItems !== "undefined" ? receipt.totalItems : 0,
      totalQuantityExpected: typeof receipt.totalQuantityExpected !== "undefined" ? receipt.totalQuantityExpected : 0,
      totalQuantityReceived: typeof receipt.totalQuantityReceived !== "undefined" ? receipt.totalQuantityReceived : 0,
      discrepancyFlag: typeof receipt.discrepancyFlag !== "undefined" ? receipt.discrepancyFlag : false,
    });
    setEditSelectedLpoId(receipt.supplierLpoId || "");
    setShowEditDialog(true);
  };

  const handleUpdateReceipt = async () => {
    if (!editFormData.receiptNumber || !editSelectedLpoId || !editFormData.receiptDate || !editFormData.receivedBy) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!editingReceipt) {
      toast({
        title: "Error",
        description: "No receipt selected for editing",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected LPO to extract supplier information
      const selectedLpo = supplierLpos.find((lpo: any) => lpo.id === editSelectedLpoId);
      if (!selectedLpo) {
        toast({
          title: "Error",
          description: "Selected supplier LPO not found",
          variant: "destructive",
        });
        return;
      }

      const updateData = {
        receiptNumber: editFormData.receiptNumber,
        supplierLpoId: editSelectedLpoId,
        supplierId: selectedLpo.supplierId || selectedLpo.supplier?.id,
        receiptDate: editFormData.receiptDate,
        receivedBy: editFormData.receivedBy,
        status: editFormData.status,
        notes: editFormData.notes || null,
        expectedDeliveryDate: editFormData.expectedDeliveryDate || editingReceipt.expectedDeliveryDate || null,
        actualDeliveryDate: editFormData.actualDeliveryDate || editingReceipt.actualDeliveryDate || null,
        totalItems: typeof editFormData.totalItems !== 'undefined' ? editFormData.totalItems : (editingReceipt.totalItems || 0),
        totalQuantityExpected: typeof editFormData.totalQuantityExpected !== 'undefined' ? editFormData.totalQuantityExpected : (editingReceipt.totalQuantityExpected || 0),
        totalQuantityReceived: typeof editFormData.totalQuantityReceived !== 'undefined' ? editFormData.totalQuantityReceived : (editingReceipt.totalQuantityReceived || 0),
        discrepancyFlag: typeof editFormData.discrepancyFlag !== 'undefined' ? editFormData.discrepancyFlag : (editingReceipt.discrepancyFlag || false),
      };

      updateGoodsReceiptMutation.mutate({ id: editingReceipt.id, data: updateData });
    } catch (error) {
      console.error("Error preparing goods receipt update data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare goods receipt update data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="goods-receipts-tab">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Partially Received">Partially Received</SelectItem>
          </SelectContent>
        </Select>

        <Button data-testid="button-create-receipt" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goods Receipt
        </Button>
      </div>

      {/* New Goods Receipt Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Goods Receipt</DialogTitle>
            <DialogDescription>Enter details for the new goods receipt.</DialogDescription>
          </DialogHeader>
          {/* TODO: Add form fields for goods receipt creation */}
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="receiptNumber">Receipt Number *</Label>
              <Input
                id="receiptNumber"
                placeholder="Enter receipt number"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                data-testid="input-receipt-number"
              />
            </div>
            
            <div>
              <Label htmlFor="supplierLpo">Supplier LPO *</Label>
              {/* Supplier LPO Dropdown */}
              <Select value={selectedLpoId} onValueChange={setSelectedLpoId}>
                <SelectTrigger data-testid="select-supplier-lpo">
                  <SelectValue placeholder="Select Supplier LPO" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(supplierLpos) && supplierLpos.map((lpo: any) => (
                    <SelectItem key={lpo.id} value={lpo.id}>
                      {lpo.lpoNumber} - {lpo.supplier?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="receiptDate">Receipt Date *</Label>
              <Input
                id="receiptDate"
                type="date"
                value={formData.receiptDate}
                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                data-testid="input-receipt-date"
              />
            </div>
            
            <div>
              <Label htmlFor="receivedBy">Received By *</Label>
              <Input
                id="receivedBy"
                placeholder="Enter name of person who received"
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                data-testid="input-received-by"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Partially Received">Partially Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="receiptFile">Receipt Document (Optional)</Label>
              <Input
                id="receiptFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                data-testid="input-receipt-file"
                className="cursor-pointer"
              />
              {receiptFile && (
                <div className="text-sm text-gray-600 mt-1">
                  Selected: {receiptFile.name}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the receipt"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="textarea-notes"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateReceipt}
                disabled={createGoodsReceiptMutation.isPending}
                data-testid="button-create-receipt"
              >
                {createGoodsReceiptMutation.isPending ? "Creating..." : "Create Receipt"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Goods Receipt Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Goods Receipt Details</DialogTitle>
            <DialogDescription>
              {selectedReceipt ? `Receipt #${selectedReceipt.receiptNumber}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Receipt Number</Label>
                    <div className="mt-1 text-sm">{selectedReceipt.receiptNumber}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Receipt Date</Label>
                    <div className="mt-1 text-sm">
                      {new Date(selectedReceipt.receiptDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Received By</Label>
                    <div className="mt-1 text-sm">{selectedReceipt.receivedBy}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedReceipt.status)}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Supplier LPO ID</Label>
                    <div className="mt-1 text-sm">{selectedReceipt.supplierLpoId || "N/A"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Supplier ID</Label>
                    <div className="mt-1 text-sm">{selectedReceipt.supplierId || "N/A"}</div>
                  </div>
                  {selectedReceipt.expectedDeliveryDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Expected Delivery Date</Label>
                      <div className="mt-1 text-sm">
                        {new Date(selectedReceipt.expectedDeliveryDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {selectedReceipt.actualDeliveryDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Actual Delivery Date</Label>
                      <div className="mt-1 text-sm">
                        {new Date(selectedReceipt.actualDeliveryDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Summary */}
              {(selectedReceipt.totalItems || selectedReceipt.totalQuantityExpected || selectedReceipt.totalQuantityReceived) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Quantity Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedReceipt.totalItems !== undefined && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Total Items</Label>
                        <div className="mt-1 text-lg font-semibold">{selectedReceipt.totalItems}</div>
                      </div>
                    )}
                    {selectedReceipt.totalQuantityExpected !== undefined && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Expected Quantity</Label>
                        <div className="mt-1 text-lg font-semibold">{selectedReceipt.totalQuantityExpected}</div>
                      </div>
                    )}
                    {selectedReceipt.totalQuantityReceived !== undefined && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Received Quantity</Label>
                        <div className="mt-1 text-lg font-semibold text-green-600">{selectedReceipt.totalQuantityReceived}</div>
                      </div>
                    )}
                  </div>
                  {selectedReceipt.discrepancyFlag && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center text-yellow-800">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Discrepancy Detected</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedReceipt.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notes</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                    {selectedReceipt.notes}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Created At</Label>
                    <div className="mt-1">
                      {selectedReceipt.createdAt ? new Date(selectedReceipt.createdAt).toLocaleString() : "N/A"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Updated At</Label>
                    <div className="mt-1">
                      {selectedReceipt.updatedAt ? new Date(selectedReceipt.updatedAt).toLocaleString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewDialog(false)}
                  data-testid="button-close-view"
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditReceipt(selectedReceipt);
                  }}
                  data-testid="button-edit-receipt"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Goods Receipt Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Goods Receipt</DialogTitle>
            <DialogDescription>
              {editingReceipt ? `Edit receipt #${editingReceipt.receiptNumber}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>
          
          {editingReceipt && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="editReceiptNumber">Receipt Number *</Label>
                <Input
                  id="editReceiptNumber"
                  placeholder="Enter receipt number"
                  value={editFormData.receiptNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, receiptNumber: e.target.value })}
                  data-testid="input-edit-receipt-number"
                />
              </div>
              
              <div>
                <Label htmlFor="editSupplierLpo">Supplier LPO *</Label>
                <Select value={editSelectedLpoId} onValueChange={setEditSelectedLpoId}>
                  <SelectTrigger data-testid="select-edit-supplier-lpo">
                    <SelectValue placeholder="Select Supplier LPO" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(supplierLpos) && supplierLpos.map((lpo: any) => (
                      <SelectItem key={lpo.id} value={lpo.id}>
                        {lpo.lpoNumber} - {lpo.supplier?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editReceiptDate">Receipt Date *</Label>
                <Input
                  id="editReceiptDate"
                  type="date"
                  value={editFormData.receiptDate}
                  onChange={(e) => setEditFormData({ ...editFormData, receiptDate: e.target.value })}
                  data-testid="input-edit-receipt-date"
                />
              </div>
              
              <div>
                <Label htmlFor="editReceivedBy">Received By *</Label>
                <Input
                  id="editReceivedBy"
                  placeholder="Enter name of person who received"
                  value={editFormData.receivedBy}
                  onChange={(e) => setEditFormData({ ...editFormData, receivedBy: e.target.value })}
                  data-testid="input-edit-received-by"
                />
              </div>
              
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select 
                  value={editFormData.status} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Partially Received">Partially Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editNotes">Notes (Optional)</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Additional notes about the receipt"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  data-testid="textarea-edit-notes"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingReceipt(null);
                    setEditSelectedLpoId("");
                    setEditFormData({
                      receiptNumber: "",
                      receiptDate: "",
                      receivedBy: "",
                      status: "Draft",
                      notes: "",
                      expectedDeliveryDate: "",
                      actualDeliveryDate: "",
                      totalItems: 0,
                      totalQuantityExpected: 0,
                      totalQuantityReceived: 0,
                      discrepancyFlag: false,
                    });
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateReceipt}
                  disabled={updateGoodsReceiptMutation.isPending}
                  data-testid="button-update-receipt"
                >
                  {updateGoodsReceiptMutation.isPending ? "Updating..." : "Update Receipt"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Goods Receipts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {goodsReceipts.map((receipt: GoodsReceiptHeader) => (
            <Card key={receipt.id} className="hover:shadow-md transition-shadow" data-testid={`card-receipt-${receipt.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{receipt.receiptNumber}</h3>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Receipt Date: {new Date(receipt.receiptDate).toLocaleDateString()}</div>
                      <div>Received By: {receipt.receivedBy}</div>
                      {receipt.notes && <div>Notes: {receipt.notes}</div>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewReceipt(receipt)}
                      data-testid={`button-view-receipt-${receipt.id}`}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {/* <Button size="sm" variant="outline" data-testid={`button-scan-receipt-${receipt.id}`}>
                      <ScanLine className="h-4 w-4 mr-1" />
                      Scan Items
                    </Button> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {goodsReceipts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goods receipts found</h3>
            <p className="text-gray-600 text-center mb-4">
              Goods receipts will appear here when you receive items from suppliers.
            </p>
            <Button data-testid="button-create-first-receipt" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Receipt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SupplierReturnsTab() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: supplierReturns = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-returns", { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
      
      const url = `/api/supplier-returns${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: true,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-500">{status}</Badge>;
      case "Approved":
        return <Badge variant="default" className="bg-blue-500">{status}</Badge>;
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">{status}</Badge>;
      case "Draft":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // State for create dialog and form
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    returnNumber: "",
    supplierId: "",
    returnDate: "",
    reason: "",
    status: "Draft",
    totalAmount: 0,
    notes: "",
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: showCreateDialog,
  });

  // Mutation for creating supplier return
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSupplierReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/supplier-returns", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create supplier return");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      setShowCreateDialog(false);
      setFormData({
        returnNumber: "",
        supplierId: "",
        returnDate: "",
        reason: "",
        status: "Draft",
        totalAmount: 0,
        notes: "",
      });
      toast({ title: "Success", description: "Supplier return created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handler for submit
  const handleCreateReturn = () => {
    if (!formData.returnNumber || !formData.supplierId || !formData.returnDate || !formData.reason || formData.totalAmount <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields and total amount must be positive", variant: "destructive" });
      return;
    }
    createSupplierReturnMutation.mutate(formData);
  };

  return (
    <div className="space-y-6" data-testid="supplier-returns-tab">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-return-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Button data-testid="button-create-return" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Supplier Return
        </Button>
      </div>

      {/* Create Supplier Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Supplier Return</DialogTitle>
            <DialogDescription>Enter details for the new supplier return.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="returnNumber">Return Number *</Label>
              <Input
                id="returnNumber"
                placeholder="Enter return number"
                value={formData.returnNumber}
                onChange={(e) => setFormData({ ...formData, returnNumber: e.target.value })}
                data-testid="input-return-number"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                <SelectTrigger data-testid="select-supplier">
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="returnDate">Return Date *</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                data-testid="input-return-date"
              />
            </div>
            <div>
              <Label htmlFor="reason">Return Reason *</Label>
              <Input
                id="reason"
                placeholder="Enter reason for return"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                data-testid="input-return-reason"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger data-testid="select-return-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                min={0}
                step={0.01}
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                data-testid="input-total-amount"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the return"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="textarea-return-notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel-create-return"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateReturn}
                disabled={createSupplierReturnMutation.isPending}
                data-testid="button-create-return"
              >
                {createSupplierReturnMutation.isPending ? "Creating..." : "Create Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ...existing code for Supplier Returns List... */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(supplierReturns as any[]).map((supplierReturn: any) => (
            <Card key={supplierReturn.id} className="hover:shadow-md transition-shadow" data-testid={`card-return-${supplierReturn.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{supplierReturn.returnNumber}</h3>
                      {getStatusBadge(supplierReturn.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Return Date: {new Date(supplierReturn.returnDate).toLocaleDateString()}</div>
                      <div>Reason: {supplierReturn.reason}</div>
                      <div>Total Amount: ${supplierReturn.totalAmount.toFixed(2)}</div>
                      {supplierReturn.notes && <div>Notes: {supplierReturn.notes}</div>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" data-testid={`button-view-return-${supplierReturn.id}`}>
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-return-${supplierReturn.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(supplierReturns as any[]).length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No supplier returns found</h3>
            <p className="text-gray-600 text-center mb-4">
              Supplier returns will appear here when you need to return items to suppliers.
            </p>
            <Button data-testid="button-create-first-return" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Return
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StockMovementsTab() {
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");

  const { data: stockMovements = [], isLoading } = useQuery({
    queryKey: ["/api/stock-movements", { movementType: movementTypeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (movementTypeFilter && movementTypeFilter !== "all") params.append('movementType', movementTypeFilter);
      
      const url = `/api/stock-movements${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: true,
  });

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "Receipt":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "Issue":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case "Transfer":
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case "Adjustment":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="stock-movements-tab">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
          <SelectTrigger className="w-48" data-testid="select-movement-type-filter">
            <SelectValue placeholder="Filter by movement type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Movement Types</SelectItem>
            <SelectItem value="Receipt">Receipt</SelectItem>
            <SelectItem value="Issue">Issue</SelectItem>
            <SelectItem value="Transfer">Transfer</SelectItem>
            <SelectItem value="Adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stock Movements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(stockMovements as any[]).map((movement: any) => (
            <Card key={movement.id} className="hover:shadow-md transition-shadow" data-testid={`card-movement-${movement.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getMovementTypeIcon(movement.movementType)}
                    <div>
                      <div className="font-medium text-sm">
                        {movement.movementType} - Item: {movement.itemId}
                      </div>
                      <div className="text-xs text-gray-600">
                        {movement.storageLocation} • {movement.createdAt ? new Date(movement.createdAt).toLocaleString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Qty: {movement.quantityMoved}
                    </div>
                    <div className="text-xs text-gray-600">
                      {movement.quantityBefore} → {movement.quantityAfter}
                    </div>
                  </div>
                </div>
                
                {movement.notes && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {movement.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(stockMovements as any[]).length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock movements found</h3>
            <p className="text-gray-600 text-center">
              Stock movements will appear here when inventory levels change.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function InventoryManagementPage() {
  return (
    <div className="container mx-auto py-6" data-testid="inventory-management-page">
      <div className="mb-6">
        <div className="rounded-xl shadow-sm flex items-center justify-between px-6 py-6 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="p-2 rounded-lg bg-gray-100 flex items-center justify-center">
              <Boxes className="h-9 w-9 text-blue-600" aria-label="Inventory Management Icon" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 mt-1">Step 8: Monitor stock levels and manage inventory with barcode tracking</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="items" data-testid="tab-items">
            <Package className="h-4 w-4 mr-2" />
            Items
          </TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">
            <BarChart3 className="h-4 w-4 mr-2" />
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="receipts" data-testid="tab-receipts">
            <Truck className="h-4 w-4 mr-2" />
            Goods Receipts
          </TabsTrigger>
          <TabsTrigger value="returns" data-testid="tab-returns">
            <FileText className="h-4 w-4 mr-2" />
            Supplier Returns
          </TabsTrigger>
          <TabsTrigger value="movements" data-testid="tab-movements">
            <History className="h-4 w-4 mr-2" />
            Stock Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <InventoryItemsTab />
        </TabsContent>

        <TabsContent value="stock">
          <StockLevelsTab />
        </TabsContent>

        <TabsContent value="receipts">
          <GoodsReceiptsTab />
        </TabsContent>

        <TabsContent value="returns">
          <SupplierReturnsTab />
        </TabsContent>

        <TabsContent value="movements">
          <StockMovementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}