import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, Search, Filter, FileText, Check, AlertTriangle, X, Clock, FileUp, CheckCircle } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

export default function PoUpload() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [poNumber, setPoNumber] = useState("");
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
  
  const filteredQuotations = acceptedQuotations?.filter((quotation: any) =>
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
              console.log("View details:", quotation);
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
    pending: acceptedQuotations?.filter((q: any) => !q.customerPoDocument).length || 0,
    uploaded: acceptedQuotations?.filter((q: any) => q.customerPoDocument).length || 0,
    validated: acceptedQuotations?.filter((q: any) => q.customerPoDocument && q.customerPoNumber).length || 0,
  };

  return (
    <div>
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-6 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Order Upload</h2>
          <p className="text-gray-600 text-base mt-1">Step 4: Upload and validate customer PO documents against accepted quotations</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          onClick={() => {/* Open upload dialog for new PO, fallback to search/filter if not possible */}}
          data-testid="button-new-customer-po-upload"
        >
          <span className="text-xl font-bold">+</span> Upload PO
        </button>
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
            data={filteredQuotations || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No accepted quotations requiring PO upload."
            onRowClick={(quotation) => {
              if (!quotation.customerPoDocument) {
                setSelectedQuotation(quotation);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                  if (selectedQuotation && poNumber.trim() && uploadedFile) {
                    uploadPO.mutate({
                      quotationId: selectedQuotation.id,
                      poNumber: poNumber.trim(),
                      file: uploadedFile,
                    });
                  }
                }}
                disabled={!poNumber.trim() || !uploadedFile || uploadPO.isPending}
                data-testid="button-upload-po"
              >
                {uploadPO.isPending ? "Uploading..." : "Upload PO"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
