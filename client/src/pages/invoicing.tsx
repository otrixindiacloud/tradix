import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, FileText, Send, DollarSign, Clock, CheckCircle, Download, Edit, Plane, AlertTriangle, FileDown, ChevronDown } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Invoicing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading, error: invoicesError } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: deliveries, error: deliveriesError } = useQuery({
    queryKey: ["/api/deliveries"],
    queryFn: async () => {
      const response = await fetch("/api/deliveries");
      if (!response.ok) {
        throw new Error(`Failed to fetch deliveries: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Dialog state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [invoiceType, setInvoiceType] = useState("Standard");

  const createInvoice = useMutation({
    mutationFn: async ({ deliveryId, invoiceType }: { deliveryId: string; invoiceType: string }) => {
      // Use dedicated generation endpoint for consistency with backend route
      const response = await apiRequest("POST", "/api/invoices/generate-from-delivery", { deliveryId, invoiceType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });
      setSelectedDelivery(null);
      setShowGenerateDialog(false);
    },
    onError: (err: any) => {
      console.error("Generate invoice error", err);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });

  const generateProformaInvoice = useMutation({
    mutationFn: async (salesOrderId: string) => {
      const response = await apiRequest("POST", "/api/invoices/proforma", { salesOrderId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Proforma invoice generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate proforma invoice",
        variant: "destructive",
      });
    },
  });
  // Additional mutation for the dedicated proforma route in modular route file
  const generateProformaInvoiceAlt = useMutation({
    mutationFn: async ({ salesOrderId }: { salesOrderId: string }) => {
      const response = await apiRequest("POST", "/api/invoices/generate-proforma", { salesOrderId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Proforma invoice generated successfully",
      });
    },
    onError: (err: any) => {
      console.error("Proforma generation error", err);
      toast({
        title: "Error",
        description: "Failed to generate proforma invoice",
        variant: "destructive",
      });
    },
  });

  const downloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const exportInvoices = (format: 'csv' | 'excel') => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast({
        title: "No Data",
        description: "No invoices to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = filteredInvoices.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber || '',
        'Customer Name': invoice.customer?.name || '',
        'Customer Type': invoice.customer?.customerType || '',
        'Sales Order': invoice.salesOrder?.orderNumber || '',
        'Status': invoice.status || '',
        'Invoice Amount': invoice.totalAmount || 0,
        'Paid Amount': invoice.paidAmount || 0,
        'Due Date': invoice.dueDate ? formatDate(invoice.dueDate) : '',
        'Invoice Date': invoice.invoiceDate ? formatDate(invoice.invoiceDate) : '',
        'Subtotal': invoice.subtotal || 0,
        'Tax Amount': invoice.taxAmount || 0,
        'Notes': invoice.notes || ''
      }));

      if (format === 'csv') {
        // Convert to CSV
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => {
              const value = row[header as keyof typeof row];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === 'excel') {
        // For Excel, we'll create a simple CSV that Excel can open
        // In a real application, you might want to use a library like xlsx
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join('\t'),
          ...exportData.map(row => 
            headers.map(header => {
              const value = row[header as keyof typeof row];
              return value;
            }).join('\t')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Success",
        description: `Invoices exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      console.error("Error exporting invoices:", error);
      toast({
        title: "Error",
        description: "Failed to export invoices",
        variant: "destructive",
      });
    }
  };

  // Filter for completed deliveries ready for invoicing
  const completedDeliveries = deliveries?.filter((delivery: any) => 
    delivery.status === "Complete" && !invoices?.some((inv: any) => inv.salesOrderId === delivery.salesOrderId)
  );

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice ID",
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
      key: "salesOrderNumber",
      header: "Sales Order",
      render: (_, invoice: any) => (
        <span className="font-mono text-sm text-gray-600">
          {invoice.salesOrder?.orderNumber || "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Invoice Amount",
      render: (value: number) => value ? formatCurrency(value) : "-",
      className: "text-right",
    },
    {
      key: "paidAmount",
      header: "Paid Amount",
      render: (value: number) => value ? formatCurrency(value) : formatCurrency(0),
      className: "text-right",
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (value: string) => {
        if (!value) return "-";
        const isOverdue = new Date(value) < new Date();
        return (
          <div className={isOverdue ? "text-red-600 font-medium" : ""}>
            {formatDate(value)}
            {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
          </div>
        );
      },
    },
    {
      key: "invoiceDate",
      header: "Invoice Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, invoice: any) => (
        <div className="flex items-center space-x-2">
          {invoice.status === "Draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                updateInvoiceStatus.mutate({ id: invoice.id, status: "Sent" });
              }}
              data-testid={`button-send-${invoice.id}`}
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          )}
          {invoice.status === "Sent" && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                updateInvoiceStatus.mutate({ id: invoice.id, status: "Paid" });
              }}
              data-testid={`button-mark-paid-${invoice.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Paid
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              downloadInvoicePDF(invoice.id, invoice.invoiceNumber);
            }}
            data-testid={`button-download-${invoice.id}`}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvoice(invoice);
            }}
            data-testid={`button-view-${invoice.id}`}
            title="View Details"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const invoiceStats = {
    draft: invoices?.filter((inv: any) => inv.status === "Draft").length || 0,
    sent: invoices?.filter((inv: any) => inv.status === "Sent").length || 0,
    paid: invoices?.filter((inv: any) => inv.status === "Paid").length || 0,
    overdue: invoices?.filter((inv: any) => {
      return inv.status === "Sent" && inv.dueDate && new Date(inv.dueDate) < new Date();
    }).length || 0,
    totalRevenue: invoices?.filter((inv: any) => inv.status === "Paid")
      .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0) || 0,
  };

  // Ref for scrolling to deliveries section
  const deliveriesSectionRef = useState<any>(null);

  const handleReadyForInvoiceClick = () => {
    if (deliveriesSectionRef[0] && deliveriesSectionRef[0].scrollIntoView) {
      deliveriesSectionRef[0].scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div>
      {/* Page Header - Card Style */}
      <div className="mb-6">
        <Card className="rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Invoicing
              </h2>
              <p className="text-gray-600">
                Step 10: Generate and manage customer invoices with multi-currency support
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowGenerateDialog(true)}
                data-testid="button-open-generate-invoice"
              >
                <Plus className="h-4 w-4 mr-2" /> Generate Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // For quick proforma generation user would need to select a draft invoice or use a prompt
                  const draftWithSO = invoices?.find((inv: any) => inv.status === "Draft" && inv.salesOrderId);
                  if (draftWithSO) {
                    generateProformaInvoiceAlt.mutate({ salesOrderId: draftWithSO.salesOrderId });
                  } else {
                    toast({
                      title: "No Draft Found",
                      description: "No draft invoice with Sales Order available for proforma generation.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={generateProformaInvoiceAlt.isPending}
                data-testid="button-generate-proforma-quick"
              >
                {generateProformaInvoiceAlt.isPending ? "Generating..." : "Quick Proforma"}
              </Button>
              <Button
                className="flex items-center px-4 py-1 bg-green-500 text-white rounded-md font-medium text-base shadow-sm border border-green-600 hover:bg-green-600 focus:ring-2 focus:ring-green-300"
                data-testid="badge-ready-for-invoice"
                onClick={handleReadyForInvoiceClick}
                style={{ cursor: "pointer" }}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                {completedDeliveries?.length || 0} Ready for Invoice
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions for Completed Deliveries */}
      {completedDeliveries && completedDeliveries.length > 0 && (
        <Card className="mb-6" ref={el => deliveriesSectionRef[1](el)}>
          <CardHeader>
            <CardTitle>Deliveries Ready for Invoicing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedDeliveries.slice(0, 3).map((delivery: any) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {delivery.salesOrder?.orderNumber} - {delivery.salesOrder?.customer?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Delivery: {delivery.deliveryNumber} | Value: {formatCurrency(delivery.salesOrder?.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createInvoice.mutate({ deliveryId: delivery.id, invoiceType })}
                    disabled={createInvoice.isPending}
                    data-testid={`button-create-invoice-${delivery.id}`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {createInvoice.isPending ? "Generating..." : "Create Invoice"}
                  </Button>
                </div>
              ))}
              {completedDeliveries.length > 3 && (
                <p className="text-sm text-gray-600 text-center">
                  +{completedDeliveries.length - 3} more deliveries ready for invoicing
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                <Edit className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-bold">Draft Invoices</p>
                <p className="text-2xl font-bold text-gray-600" data-testid="stat-draft-invoices">
                  {invoiceStats.draft}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-bold">Sent Invoices</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-sent-invoices">
                  {invoiceStats.sent}
                </p>
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
                <p className="text-sm text-gray-600 font-bold">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-paid-invoices">
                  {invoiceStats.paid}
                </p>
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
                <p className="text-sm text-gray-600 font-bold">Overdue</p>
                <p className="text-2xl font-bold text-red-600" data-testid="stat-overdue-invoices">
                  {invoiceStats.overdue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-bold">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-total-revenue">
                  {formatCurrency(invoiceStats.totalRevenue)}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  From paid invoices
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
                  data-testid="input-search-invoices"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-export">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportInvoices('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportInvoices('excel')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredInvoices || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No invoices found. Invoices are created from completed deliveries."
            onRowClick={(invoice) => {
              setSelectedInvoice(invoice);
            }}
          />
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Invoice Information</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Invoice Number:</span> {selectedInvoice.invoiceNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span> {selectedInvoice.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Invoice Date:</span> {formatDate(selectedInvoice.invoiceDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Due Date:</span> {selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {selectedInvoice.customer?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {selectedInvoice.customer?.customerType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {selectedInvoice.customer?.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {selectedInvoice.customer?.phone || "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Financial Summary</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Subtotal</p>
                    <p className="text-sm font-medium">{formatCurrency(selectedInvoice.subtotal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Tax Amount</p>
                    <p className="text-sm font-medium">{formatCurrency(selectedInvoice.taxAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedInvoice.totalAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Paid Amount</p>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(selectedInvoice.paidAmount || 0)}</p>
                  </div>
                </div>
                {selectedInvoice.totalAmount > selectedInvoice.paidAmount && (
                  <div className="mt-2 p-2 bg-orange-100 rounded">
                    <p className="text-sm text-orange-800">
                      <span className="font-medium">Outstanding Balance:</span> {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                    </p>
                  </div>
                )}
              </div>

              {selectedInvoice.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => downloadInvoicePDF(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                  data-testid="button-download-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => setSelectedInvoice(null)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
                {selectedInvoice?.salesOrderId && (
                  <Button
                    variant="outline"
                    onClick={() => generateProformaInvoiceAlt.mutate({ salesOrderId: selectedInvoice.salesOrderId })}
                    disabled={generateProformaInvoiceAlt.isPending}
                    data-testid="button-generate-proforma-from-invoice"
                  >
                    {generateProformaInvoiceAlt.isPending ? "Generating..." : "Generate Proforma"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Invoice from Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search deliveries..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
                data-testid="input-search-deliveries"
              />
              <Select value={invoiceType} onValueChange={setInvoiceType}>
                <SelectTrigger className="w-48" data-testid="select-invoice-type">
                  <SelectValue placeholder="Invoice Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Proforma">Proforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-md divide-y" data-testid="list-deliveries-for-invoice">
              {completedDeliveries && completedDeliveries
                .filter((d: any) => {
                  if (!deliverySearch) return true;
                  const term = deliverySearch.toLowerCase();
                  return (
                    d.deliveryNumber?.toLowerCase().includes(term) ||
                    d.salesOrder?.orderNumber?.toLowerCase().includes(term) ||
                    d.salesOrder?.customer?.name?.toLowerCase().includes(term)
                  );
                })
                .map((delivery: any) => (
                  <div key={delivery.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {delivery.deliveryNumber} / {delivery.salesOrder?.orderNumber}
                      </p>
                      <p className="text-xs text-gray-600">
                        {delivery.salesOrder?.customer?.name} · Value {formatCurrency(delivery.salesOrder?.totalAmount)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createInvoice.mutate({ deliveryId: delivery.id, invoiceType })}
                      disabled={createInvoice.isPending}
                      data-testid={`button-generate-invoice-${delivery.id}`}
                    >
                      {createInvoice.isPending ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                ))}
              {(!completedDeliveries || completedDeliveries.length === 0) && (
                <div className="p-4 text-sm text-gray-500" data-testid="empty-no-deliveries">No deliveries available for invoicing.</div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)} data-testid="button-close-generate-dialog">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
