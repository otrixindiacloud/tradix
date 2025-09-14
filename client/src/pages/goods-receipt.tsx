import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Package, Scan, AlertTriangle, Check, Clock, CheckCircle } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GoodsReceipt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLpo, setSelectedLpo] = useState<any>(null);
  const [receiptData, setReceiptData] = useState({
    storageLocation: "",
    notes: "",
    items: [] as any[],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: supplierLpos, isLoading } = useQuery({
    queryKey: ["/api/supplier-lpos"],
  });

  const { data: goodsReceipts } = useQuery({
    queryKey: ["/api/goods-receipts"],
  });

  const createGoodsReceipt = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/goods-receipts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-lpos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Goods receipt created successfully",
      });
      setSelectedLpo(null);
      setReceiptData({ storageLocation: "", notes: "", items: [] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goods receipt",
        variant: "destructive",
      });
    },
  });

  // Filter for confirmed supplier LPOs ready for goods receipt
  const confirmedLpos = supplierLpos?.filter((lpo: any) => lpo.status === "Confirmed");
  
  const filteredLpos = confirmedLpos?.filter((lpo: any) =>
    lpo.lpoNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lpo.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      key: "lpoNumber",
      header: "LPO Number",
      render: (value: string) => (
        <span className="font-mono text-sm text-blue-600 font-medium">{value}</span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (supplier: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {supplier?.name || "Unknown Supplier"}
          </p>
          <p className="text-xs text-gray-600">
            {supplier?.contactPerson || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "LPO Value",
      render: (value: number) => value ? formatCurrency(value) : "-",
      className: "text-right",
    },
    {
      key: "expectedDeliveryDate",
      header: "Expected Delivery",
      render: (value: string) => {
        const isOverdue = value && new Date(value) < new Date();
        return (
          <div className={isOverdue ? "text-red-600" : ""}>
            {value ? formatDate(value) : "-"}
            {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
          </div>
        );
      },
    },
    {
      key: "receiptStatus",
      header: "Receipt Status",
      render: (_, lpo: any) => {
        const receipt = goodsReceipts?.find((gr: any) => gr.supplierLpoId === lpo.id);
        if (!receipt) {
          return (
            <Badge variant="outline" className="text-orange-600">
              <Package className="h-3 w-3 mr-1" />
              Pending Receipt
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className={getStatusColor(receipt.status)}>
            {receipt.status}
          </Badge>
        );
      },
    },
    {
      key: "lpoDate",
      header: "LPO Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, lpo: any) => {
        const receipt = goodsReceipts?.find((gr: any) => gr.supplierLpoId === lpo.id);
        return (
          <div className="flex items-center space-x-2">
            {!receipt && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLpo(lpo);
                  // Initialize receipt data with LPO items
                  setReceiptData({
                    storageLocation: "",
                    notes: "",
                    items: lpo.items?.map((item: any) => ({
                      ...item,
                      receivedQuantity: item.quantity,
                      damagedQuantity: 0,
                    })) || [],
                  });
                }}
                data-testid={`button-receive-${lpo.id}`}
              >
                <Package className="h-4 w-4 mr-1" />
                Receive Goods
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                console.log("View LPO details:", lpo);
              }}
              data-testid={`button-view-${lpo.id}`}
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const receiptStats = {
    pending: confirmedLpos?.filter((lpo: any) => 
      !goodsReceipts?.some((gr: any) => gr.supplierLpoId === lpo.id)
    ).length || 0,
    partial: goodsReceipts?.filter((gr: any) => gr.status === "Partial").length || 0,
    complete: goodsReceipts?.filter((gr: any) => gr.status === "Complete").length || 0,
    discrepancy: goodsReceipts?.filter((gr: any) => gr.status === "Discrepancy").length || 0,
  };

  const handleItemQuantityChange = (index: number, field: string, value: number) => {
    const updatedItems = [...receiptData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReceiptData({ ...receiptData, items: updatedItems });
  };

  const processGoodsReceipt = () => {
    if (!selectedLpo || !receiptData.storageLocation.trim()) {
      toast({
        title: "Error",
        description: "Please provide storage location",
        variant: "destructive",
      });
      return;
    }

    const hasDiscrepancy = receiptData.items.some(item => 
      item.receivedQuantity !== item.quantity || item.damagedQuantity > 0
    );

    const status = hasDiscrepancy ? "Discrepancy" : "Complete";

    createGoodsReceipt.mutate({
      supplierLpoId: selectedLpo.id,
      storageLocation: receiptData.storageLocation,
      notes: receiptData.notes,
      status,
      items: receiptData.items,
    });
  };

  return (
    <div>
      {/* Page Header - Card Style */}
      <div className="mb-6">
        <Card className="rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Goods Receipt
              </h2>
              <p className="text-gray-600">
                Step 7: Receive and validate goods against supplier LPOs with barcode scanning
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-orange-600">
                <Package className="h-4 w-4 mr-1" />
                {receiptStats.pending} Pending Receipt
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mt-1">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Pending Receipt</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending-receipt">
                  {receiptStats.pending}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Confirmed LPOs awaiting receipt
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Partial Receipt</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-partial-receipt">
                  {receiptStats.partial}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Partially received shipments
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
                <p className="text-sm font-bold text-gray-900">Complete Receipt</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-complete-receipt">
                  {receiptStats.complete}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Fully received shipments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mt-1">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Discrepancies</p>
                <p className="text-2xl font-bold text-red-600" data-testid="stat-discrepancy-receipt">
                  {receiptStats.discrepancy}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  Receipts with issues
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goods Receipt Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supplier LPOs - Goods Receipt</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search LPOs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
                  data-testid="input-search-lpos"
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
            data={filteredLpos || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No confirmed LPOs ready for goods receipt."
            onRowClick={(lpo) => {
              const receipt = goodsReceipts?.find((gr: any) => gr.supplierLpoId === lpo.id);
              if (!receipt) {
                setSelectedLpo(lpo);
                setReceiptData({
                  storageLocation: "",
                  notes: "",
                  items: lpo.items?.map((item: any) => ({
                    ...item,
                    receivedQuantity: item.quantity,
                    damagedQuantity: 0,
                  })) || [],
                });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Goods Receipt Dialog */}
      <Dialog open={!!selectedLpo} onOpenChange={() => setSelectedLpo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Goods Receipt</DialogTitle>
          </DialogHeader>
          {selectedLpo && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">LPO Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">LPO Number:</span> {selectedLpo.lpoNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Supplier:</span> {selectedLpo.supplier?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Expected Delivery:</span> {selectedLpo.expectedDeliveryDate ? formatDate(selectedLpo.expectedDeliveryDate) : "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">LPO Value:</span> {formatCurrency(selectedLpo.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Storage Location <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter storage location..."
                    value={receiptData.storageLocation}
                    onChange={(e) => setReceiptData({ ...receiptData, storageLocation: e.target.value })}
                    data-testid="input-storage-location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Receipt Notes
                  </label>
                  <Input
                    type="text"
                    placeholder="Additional notes..."
                    value={receiptData.notes}
                    onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
                    data-testid="input-receipt-notes"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Items Receipt Verification</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
                    <div>Item</div>
                    <div>Barcode</div>
                    <div>Ordered Qty</div>
                    <div>Received Qty</div>
                    <div>Damaged Qty</div>
                    <div>Status</div>
                  </div>
                  {receiptData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 p-3 border-b items-center">
                      <div className="text-sm">{item.description || item.itemId}</div>
                      <div className="text-xs font-mono">{item.barcode || "N/A"}</div>
                      <div className="text-sm font-medium">{item.quantity}</div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemQuantityChange(index, "receivedQuantity", parseInt(e.target.value) || 0)}
                          className="w-20"
                          data-testid={`input-received-qty-${index}`}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          max={item.receivedQuantity}
                          value={item.damagedQuantity}
                          onChange={(e) => handleItemQuantityChange(index, "damagedQuantity", parseInt(e.target.value) || 0)}
                          className="w-20"
                          data-testid={`input-damaged-qty-${index}`}
                        />
                      </div>
                      <div>
                        {item.receivedQuantity === item.quantity && item.damagedQuantity === 0 ? (
                          <Badge className="underline decoration-green-500 text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge className="underline decoration-orange-500 text-orange-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Discrepancy
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLpo(null)}
                  data-testid="button-cancel-receipt"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processGoodsReceipt}
                  disabled={!receiptData.storageLocation.trim() || createGoodsReceipt.isPending}
                  data-testid="button-process-receipt"
                >
                  {createGoodsReceipt.isPending ? "Processing..." : "Process Receipt"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
