import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Search, Filter, FileText, Check, AlertTriangle, X, Clock, FileUp, CheckCircle, ShoppingBag } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

export default function PoUpload() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [viewingQuotation, setViewingQuotation] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const [rowsToShow, setRowsToShow] = useState(15);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["/api/quotations"],
  });

  // Fetch current user for proper uploadedBy attribution
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: 'include' });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  // Fetch customers data to get customer names
  const { data: customersData = { customers: [] } } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const customers = customersData.customers || [];

  const uploadPO = useMutation({
    mutationFn: async ({ quotationId, poNumber, file }: { quotationId: string; poNumber: string; file: File }) => {
      // For now, simulate file upload and create PO record with document info
      const documentName = file.name;
      const documentType = file.type.includes('pdf') ? 'PDF' : 'IMAGE';
      const documentPath = `/uploads/po/${Date.now()}-${file.name}`; // Simulated path
      
      const payload: any = {
        quotationId,
        poNumber,
        documentPath,
        documentName,
        documentType,
      };
      if (currentUser?.user?.id) {
        payload.uploadedBy = currentUser.user.id;
      }

      const response = await apiRequest("POST", "/api/customer-po-upload", payload);
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Success",
        description: "PO document uploaded successfully",
      });
      setSelectedQuotation(null);
      setUploadedFile(null);
      setPoNumber("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload PO document",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  // Filter for accepted quotations that need PO upload
  const acceptedQuotations = (quotations as any[] | undefined)?.filter((q: any) => q.status === "Accepted");
  
  // Enrich quotations with customer names from customers API
  const enrichedQuotations = acceptedQuotations?.map((quotation: any) => {
    const customer = customers.find((c: any) => c.id === quotation.customerId);
    return {
      ...quotation,
      customer: customer ? {
        ...customer,
        name: customer.name || 'Unknown Customer'
      } : quotation.customer || { name: 'Unknown Customer', customerType: '-' }
    };
  });
  
  const filteredQuotations = enrichedQuotations?.filter((quotation: any) =>
    quotation.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      key: "quoteNumber",
      header: "Quote ID",
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
            {customer?.customerType || "-"}
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
      key: "customerPoNumber",
      header: "PO Number",
      render: (value: string) => value || (
            <Badge
              variant="outline"
              className="bg-blue-600 text-white border-blue-600 flex items-center justify-center gap-2"
              style={{ borderColor: '#2563eb' }}
            >
              <AlertTriangle className="h-3 w-3 text-white" />
              <span className="font-medium">Pending</span>
            </Badge>
      ),
    },
    {
      key: "customerPoDocument",
      header: "PO Document",
      render: (value: string) => value ? (
          <Badge variant="outline" className="text-green-600">
            <Check className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
      ) : (
            <Badge
              variant="outline"
              className="bg-red-600 text-white border-red-600 flex items-center justify-center gap-2"
              style={{ borderColor: '#dc2626' }}
            >
              <X className="h-3 w-3 text-white" />
              <span className="font-medium">Missing</span>
            </Badge>
      ),
    },
    {
      key: "approvalDate",
      header: "Accepted Date",
      render: (_, quotation: any) => formatDate(quotation.updatedAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, quotation: any) => (
        <div className="flex items-center space-x-2">
            {!quotation.customerPoDocument && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-gray-400 text-white hover:bg-gray-500 border-gray-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuotation(quotation);
                }}
                data-testid={`button-upload-${quotation.id}`}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload PO
              </Button>
            )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setViewingQuotation(quotation);
            }}
            data-testid={`button-view-${quotation.id}`}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const uploadStats = {
    pending: enrichedQuotations?.filter((q: any) => !q.customerPoDocument).length || 0,
    uploaded: enrichedQuotations?.filter((q: any) => q.customerPoDocument).length || 0,
    validated: enrichedQuotations?.filter((q: any) => q.customerPoDocument && q.customerPoNumber).length || 0,
  };

  return (
    <div>
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Purchase Order Upload
                </h2>
              </div>
              <p className="text-muted-foreground text-lg">
                Step 4: Upload and validate customer PO documents against accepted quotations
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span className="font-medium">Document Validation</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending: {uploadStats.pending} | Uploaded: {uploadStats.uploaded}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-200 transition flex items-center gap-2"
              onClick={() => setSelectedQuotation({})}
              data-testid="button-new-customer-po-upload"
            >
              <Upload className="h-4 w-4" />
              Upload PO
            </Button>
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600">Pending Upload</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending-upload">
                  {uploadStats.pending}
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Accepted quotes awaiting PO upload
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600">Uploaded</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-uploaded">
                  {uploadStats.uploaded}
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              PO documents uploaded
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600">Validated</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-validated">
                  {uploadStats.validated}
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              PO documents validated and ready
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PO Upload Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Purchase Order Management</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
                  data-testid="input-search-quotations"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="default" size="icon" data-testid="button-filter" className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(filteredQuotations || []).slice(0, rowsToShow)}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No accepted quotations requiring PO upload."
            onRowClick={(quotation) => {
              if (!quotation.customerPoDocument) {
                setSelectedQuotation(quotation);
              }
            }}
          />
          {(filteredQuotations?.length || 0) > rowsToShow && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => setRowsToShow(rowsToShow + 15)} variant="outline">
                See More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quotation Selection - show when opened from header button */}
            {!selectedQuotation?.id && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Quotation <span className="text-red-500">*</span>
                </label>
                <Select onValueChange={(quotationId) => {
                  const quotation = enrichedQuotations?.find(q => q.id === quotationId);
                  if (quotation) {
                    setSelectedQuotation(quotation);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quotation to upload PO..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enrichedQuotations?.filter(q => !q.customerPoDocument).map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{quotation.quoteNumber}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {quotation.customer?.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quotation Details - show when quotation is selected */}
            {selectedQuotation?.id && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Quotation Details
                </h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Quote ID:</span> {selectedQuotation?.quoteNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Customer:</span> {selectedQuotation?.customer?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Value:</span> {selectedQuotation?.totalAmount ? formatCurrency(selectedQuotation.totalAmount) : "-"}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                PO Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter PO number..."
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                data-testid="input-po-number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                PO Document <span className="text-red-500">*</span>
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                data-testid="dropzone-po-document"
              >
                <input {...getInputProps()} />
                {uploadedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {uploadedFile.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {isDragActive
                        ? "Drop the PO document here..."
                        : "Drag & drop PO document here, or click to select"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports PDF, PNG, JPG files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedQuotation(null);
                  setUploadedFile(null);
                  setPoNumber("");
                }}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedQuotation?.id && poNumber.trim() && uploadedFile) {
                    uploadPO.mutate({
                      quotationId: selectedQuotation.id,
                      poNumber: poNumber.trim(),
                      file: uploadedFile,
                    });
                  }
                }}
                disabled={!selectedQuotation?.id || !poNumber.trim() || !uploadedFile || uploadPO.isPending}
                data-testid="button-upload-po"
              >
                {uploadPO.isPending ? "Uploading..." : "Upload PO"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingQuotation} onOpenChange={() => setViewingQuotation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
          </DialogHeader>
          {viewingQuotation && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quote Number</label>
                    <p className="font-mono text-sm text-blue-600 font-medium">
                      {viewingQuotation.quoteNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p className="font-medium">{viewingQuotation.customer?.name || "Unknown Customer"}</p>
                    <p className="text-xs text-gray-600">{viewingQuotation.customer?.customerType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-green-600 text-white border-green-600">
                        {viewingQuotation.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quote Date</label>
                    <p className="font-medium">
                      {viewingQuotation.quoteDate ? formatDate(viewingQuotation.quoteDate) : formatDate(viewingQuotation.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valid Until</label>
                    <p className="font-medium">
                      {viewingQuotation.validUntil ? formatDate(viewingQuotation.validUntil) : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="font-medium text-lg">
                      {viewingQuotation.totalAmount ? formatCurrency(viewingQuotation.totalAmount) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PO Information */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Purchase Order Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">PO Number</label>
                    <p className="font-medium">
                      {viewingQuotation.customerPoNumber || (
                        <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PO Document</label>
                    <p className="font-medium">
                      {viewingQuotation.customerPoDocument ? (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-600 text-white border-red-600">
                          <X className="h-3 w-3 mr-1" />
                          Missing
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              {(viewingQuotation.subtotal || viewingQuotation.discountAmount || viewingQuotation.taxAmount) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h4>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {viewingQuotation.subtotal && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(viewingQuotation.subtotal))}</span>
                      </div>
                    )}
                    {viewingQuotation.discountAmount && parseFloat(viewingQuotation.discountAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Discount:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(parseFloat(viewingQuotation.discountAmount))}</span>
                      </div>
                    )}
                    {viewingQuotation.taxAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tax:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(viewingQuotation.taxAmount))}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total:</span>
                      <span>{viewingQuotation.totalAmount ? formatCurrency(viewingQuotation.totalAmount) : "-"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingQuotation.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {viewingQuotation.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewingQuotation(null)}
                >
                  Close
                </Button>
                {!viewingQuotation.customerPoDocument && (
                  <Button
                    onClick={() => {
                      setViewingQuotation(null);
                      setSelectedQuotation(viewingQuotation);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PO
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
