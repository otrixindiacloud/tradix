import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown, Scan, Boxes, DollarSign, Lock, XCircle } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory, isLoading, error: inventoryError } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const response = await fetch("/api/inventory");
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: items, error: itemsError } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await fetch("/api/items");
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ itemId, quantity, type }: { itemId: string; quantity: number; type: "adjustment" | "cycle_count" }) => {
      const response = await apiRequest("PUT", `/api/inventory/${itemId}`, { quantity, type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Inventory updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    },
  });

  // Combine inventory data with item details
  const inventoryWithDetails = inventory?.map((inv: any) => {
    const item = items?.find((i: any) => i.id === inv.itemId);
    return {
      ...inv,
      item,
      availableQuantity: inv.quantity - inv.reservedQuantity,
    };
  });

  const filteredInventory = inventoryWithDetails?.filter((inv: any) => {
    const matchesSearch = inv.item?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.item?.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.item?.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || inv.item?.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = inv.availableQuantity <= 10; // Low stock threshold
    } else if (stockFilter === "out") {
      matchesStock = inv.availableQuantity <= 0;
    } else if (stockFilter === "reserved") {
      matchesStock = inv.reservedQuantity > 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const columns: Column<any>[] = [
    {
      key: "item.supplierCode",
      header: "Supplier Code",
      render: (value: string) => (
        <span className="font-mono text-sm text-blue-600">{value}</span>
      ),
    },
    {
      key: "item.barcode",
      header: "Barcode",
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-600">{value || "N/A"}</span>
      ),
    },
    {
      key: "item.description",
      header: "Item Description",
      render: (value: string, inv: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-600">
            {inv.item?.category} | {inv.item?.unitOfMeasure}
          </p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Total Stock",
      render: (value: number) => (
        <span className="text-sm font-medium">{value}</span>
      ),
      className: "text-center",
    },
    {
      key: "reservedQuantity",
      header: "Reserved",
      render: (value: number) => (
        <span className={`text-sm ${value > 0 ? "text-orange-600 font-medium" : "text-gray-500"}`}>
          {value}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "availableQuantity",
      header: "Available",
      render: (value: number) => {
        let colorClass = "text-green-600";
        if (value <= 0) colorClass = "text-red-600";
        else if (value <= 10) colorClass = "text-orange-600";
        
        return (
          <span className={`text-sm font-medium ${colorClass}`}>
            {value}
          </span>
        );
      },
      className: "text-center",
    },
    {
      key: "storageLocation",
      header: "Location",
      render: (value: string) => (
        <span className="text-sm">{value || "N/A"}</span>
      ),
    },
    {
      key: "stockStatus",
      header: "Status",
      render: (_, inv: any) => {
        if (inv.availableQuantity <= 0) {
          return (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Out of Stock
            </Badge>
          );
        } else if (inv.availableQuantity <= 10) {
          return (
            <Badge className="underline decoration-orange-500 text-orange-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          );
        } else {
          return (
            <Badge className="underline decoration-green-500 text-green-700">
              In Stock
            </Badge>
          );
        }
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, inv: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(inv);
            }}
            data-testid={`button-view-${inv.id}`}
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Scan barcode for:", inv.item?.barcode);
            }}
            data-testid={`button-scan-${inv.id}`}
          >
            <Scan className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const inventoryStats = {
    totalItems: inventoryWithDetails?.length || 0,
    totalValue: inventoryWithDetails?.reduce((sum: number, inv: any) => 
      sum + (inv.quantity * (inv.item?.costPrice || 0)), 0) || 0,
    lowStock: inventoryWithDetails?.filter((inv: any) => inv.availableQuantity <= 10 && inv.availableQuantity > 0).length || 0,
    outOfStock: inventoryWithDetails?.filter((inv: any) => inv.availableQuantity <= 0).length || 0,
    reserved: inventoryWithDetails?.filter((inv: any) => inv.reservedQuantity > 0).length || 0,
  };

  const categories = Array.from(new Set(items?.map((item: any) => item.category).filter(Boolean))) as string[];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            Inventory Management
          </h2>
          <p className="text-gray-600">
            Step 8: Monitor stock levels and manage inventory with barcode tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-orange-600">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {inventoryStats.lowStock} Low Stock
          </Badge>
          <Badge variant="outline" className="text-red-600">
            {inventoryStats.outOfStock} Out of Stock
          </Badge>
        </div>
      </div>

      {/* Inventory Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-total-items">
                  {inventoryStats.totalItems}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Boxes className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-inventory-value">
                  {formatCurrency(inventoryStats.totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">Total stock value</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-low-stock">
                  {inventoryStats.lowStock}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Items with ≤10 units
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600" data-testid="stat-out-of-stock">
                  {inventoryStats.outOfStock}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-red-600">Requires restocking</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reserved Stock</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="stat-reserved-stock">
                  {inventoryStats.reserved}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Items with reserved qty
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Items</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
                  data-testid="input-search-inventory"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
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
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="reserved">Reserved Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryError || itemsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">
                Error loading inventory: {inventoryError?.message || itemsError?.message}
              </p>
              <Button onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
                queryClient.invalidateQueries({ queryKey: ["/api/items"] });
              }}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              data={filteredInventory || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No inventory items found."
              onRowClick={(item) => {
                setSelectedItem(item);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Item Information</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {selectedItem.item?.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Supplier Code:</span> {selectedItem.item?.supplierCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Barcode:</span> {selectedItem.item?.barcode || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Category:</span> {selectedItem.item?.category || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Stock Information</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Total Quantity:</span> {selectedItem.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reserved:</span> {selectedItem.reservedQuantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Available:</span> {selectedItem.availableQuantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {selectedItem.storageLocation || "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Pricing Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Cost Price</p>
                    <p className="text-sm font-medium">{formatCurrency(selectedItem.item?.costPrice || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Stock Value</p>
                    <p className="text-sm font-medium">
                      {formatCurrency((selectedItem.item?.costPrice || 0) * selectedItem.quantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Available Value</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency((selectedItem.item?.costPrice || 0) * selectedItem.availableQuantity)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => console.log("Stock adjustment for:", selectedItem)}
                  data-testid="button-adjust-stock"
                >
                  Adjust Stock
                </Button>
                <Button
                  onClick={() => setSelectedItem(null)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
