import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { formatDate, format } from "date-fns";
import { 
  Plus, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CalendarIcon,
  FileDown,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import DataTable from "@/components/tables/data-table";
import { useToast } from "@/hooks/use-toast";

interface Quotation {
  id: string;
  quoteNumber: string;
  revision: number;
  customerId: string;
  customerType: "Retail" | "Wholesale";
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
  quoteDate: string;
  validUntil: string;
  subtotal: string;
  discountPercentage: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  terms: string;
  notes: string;
  approvalStatus: string;
  requiredApprovalLevel: string;
  createdAt: string;
}

export default function QuotationsPage() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    status: "",
    customerType: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: ["/api/quotations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`/api/quotations?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch quotations: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Delete quotation mutation
  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quotation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      });
      setDeletingQuotation(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quotation",
        variant: "destructive",
      });
    },
  });

  // Handle edit quotation
  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setShowEditDialog(true);
  };

  // Handle delete quotation
  const handleDelete = (quotation: Quotation) => {
    setDeletingQuotation(quotation);
  };

  // Handle download PDF
  const handleDownload = (quotation: Quotation) => {
    // Navigate to quotation detail which has PDF download functionality
    navigate(`/quotations/${quotation.id}`);
    // The PDF download will be triggered from the detail page
  };

  // Handle date range change
  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    setDateRange({ from, to });
    setFilters(prev => ({
      ...prev,
      dateFrom: from ? format(from, "yyyy-MM-dd") : "",
      dateTo: to ? format(to, "yyyy-MM-dd") : ""
    }));
  };

  // Export quotations function
  const exportQuotations = (format: 'csv' | 'excel') => {
    if (!quotations || quotations.length === 0) {
      toast({
        title: "No Data",
        description: "No quotations to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = quotations.map((quotation: Quotation) => ({
        'Quote Number': quotation.quoteNumber || '',
        'Revision': quotation.revision || 1,
        'Customer ID': quotation.customerId || '',
        'Customer Type': quotation.customerType || '',
        'Status': quotation.status || '',
        'Approval Status': quotation.approvalStatus || '',
        'Required Approval Level': quotation.requiredApprovalLevel || '',
        'Quote Date': quotation.quoteDate ? formatDate(new Date(quotation.quoteDate), "yyyy-MM-dd") : '',
        'Valid Until': quotation.validUntil ? formatDate(new Date(quotation.validUntil), "yyyy-MM-dd") : '',
        'Subtotal': parseFloat(quotation.subtotal || '0'),
        'Discount Percentage': parseFloat(quotation.discountPercentage || '0'),
        'Discount Amount': parseFloat(quotation.discountAmount || '0'),
        'Tax Amount': parseFloat(quotation.taxAmount || '0'),
        'Total Amount': parseFloat(quotation.totalAmount || '0'),
        'Terms': quotation.terms || '',
        'Notes': quotation.notes || '',
        'Created At': quotation.createdAt ? formatDate(new Date(quotation.createdAt), "yyyy-MM-dd") : ''
      }));

      if (format === 'csv') {
        // Convert to CSV
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(','),
          ...exportData.map((row: any) => 
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
        a.download = `quotations-export-${new Date().toISOString().split('T')[0]}.csv`;
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
          ...exportData.map((row: any) => 
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
        a.download = `quotations-export-${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Success",
        description: `Quotations exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      console.error("Error exporting quotations:", error);
      toast({
        title: "Error",
        description: "Failed to export quotations",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft": return <Clock className="h-4 w-4" />;
      case "Sent": return <FileText className="h-4 w-4" />;
      case "Accepted": return <CheckCircle className="h-4 w-4" />;
      case "Rejected": return <XCircle className="h-4 w-4" />;
      case "Expired": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "text-gray-700";
      case "Sent": return "text-gray-700";
      case "Accepted": return "text-green-700";
      case "Rejected": return "text-red-700";
      case "Expired": return "text-orange-700";
      default: return "text-gray-700";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "text-green-700";
      case "Pending": return "text-yellow-700";
      case "Rejected": return "text-red-700";
      default: return "text-gray-700";
    }
  };

  const columns = [
    {
      key: "quoteNumber",
      header: "Quote Number",
      render: (value: string, quotation: Quotation) => (
        <div className="flex items-center gap-2">
          <Link href={`/quotations/${quotation.id}`} className="font-medium text-gray-600 hover:text-gray-800">
            {value}
          </Link>
          {quotation.revision > 1 && (
            <Badge variant="outline" className="text-xs">
              Rev {quotation.revision}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "customerId",
      header: "Customer",
      render: (value: string, quotation: Quotation) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{quotation.customerType}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge variant="outline" className={`${getStatusColor(value)} flex items-center gap-1`}>
          {getStatusIcon(value)}
          {value}
        </Badge>
      ),
    },
    {
      key: "approvalStatus",
      header: "Approval",
      render: (value: string, quotation: Quotation) => (
        <div>
          <Badge className={`${getApprovalStatusColor(value)} mb-1`}>
            {value}
          </Badge>
          {quotation.requiredApprovalLevel && (
            <div className="text-xs text-gray-500">
              Requires: {quotation.requiredApprovalLevel}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      className: "text-right",
      render: (value: string, quotation: Quotation) => (
        <div className="text-right">
          <div className="font-medium">${parseFloat(value).toLocaleString()}</div>
          {parseFloat(quotation.discountPercentage) > 0 && (
            <div className="text-xs text-green-600">
              -{quotation.discountPercentage}% discount
            </div>
          )}
        </div>
      ),
    },
    {
      key: "validUntil",
      header: "Valid Until",
      className: "text-right",
      render: (value: string) => {
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <div className={`text-right ${isExpired ? 'text-red-600' : ''}`}>
            {formatDate(date, "MMM dd, yyyy")}
            {isExpired && (
              <div className="text-xs text-red-500">Expired</div>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created",
      className: "text-right",
      render: (value: string) => formatDate(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, quotation: Quotation) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/quotations/${quotation.id}`;
            }}
            data-testid={`button-view-${quotation.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(quotation);
            }}
            data-testid={`button-edit-${quotation.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(quotation);
            }}
            data-testid={`button-download-${quotation.id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(quotation);
            }}
            data-testid={`button-delete-${quotation.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            Quotations
          </h1>
          <p className="text-gray-600">
            Manage quotations with automated pricing and approval workflows
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export">
                <FileDown className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportQuotations('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportQuotations('excel')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/quotations/new">
            <Button data-testid="button-create-quotation">
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <div>
            <div className="text-2xl font-bold">
              {quotations?.filter((q: Quotation) => q.status === "Draft").length || 0}
            </div>
            <div className="text-sm text-gray-600">Draft Quotes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <div>
            <div className="text-2xl font-bold">
              {quotations?.filter((q: Quotation) => q.status === "Sent").length || 0}
            </div>
            <div className="text-sm text-gray-600">Sent Quotes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <div className="text-2xl font-bold">
              {quotations?.filter((q: Quotation) => q.approvalStatus === "Pending").length || 0}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <div className="text-2xl font-bold">
              {quotations?.filter((q: Quotation) => q.status === "Accepted").length || 0}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search quotes..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.customerType}
              onValueChange={(value) => setFilters({ ...filters, customerType: value })}
            >
              <SelectTrigger data-testid="select-customer-type">
                <SelectValue placeholder="All Customer Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer Types</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground",
                      dateRange.from && "border-blue-300 bg-blue-50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {dateRange.from && format(dateRange.from, "LLL dd, y")} -{" "}
                          {dateRange.to && format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        dateRange.from && format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={8}>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => handleDateRangeChange(range?.from, range?.to)}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                    modifiers={{
                      today: new Date(),
                    }}
                    modifiersClassNames={{
                      today: "bg-blue-100 text-blue-900 font-semibold",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        
        {/* Quick Date Filters */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!dateRange.from ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const today = new Date();
                handleDateRangeChange(today, today);
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 7);
                handleDateRangeChange(weekAgo, today);
              }}
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date();
                monthAgo.setMonth(today.getMonth() - 1);
                handleDateRangeChange(monthAgo, today);
              }}
            >
              Last 30 days
            </Button>
            {dateRange.from && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleDateRangeChange(undefined, undefined);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Quotations</h3>
            {dateRange.from && dateRange.to && (
              <p className="text-sm text-blue-600 mt-1">
                Filtered by date range: {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/quotations/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Quotation
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-export-table">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportQuotations('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportQuotations('excel')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div>

          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading quotations: {error?.message || 'Unknown error'}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/quotations"] })}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              data={quotations || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No quotations found. Create your first quotation to get started."
              onRowClick={(quotation: any) => {
                window.location.href = `/quotations/${quotation.id}`;
              }}
            />
          )}
        </div>
      </div>

      {/* Edit Quotation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Currently, quotation editing is done through the detail page. 
              You will be redirected to the quotation detail page where you can make changes.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowEditDialog(false);
                  if (editingQuotation) {
                    navigate(`/quotations/${editingQuotation.id}`);
                  }
                }}
              >
                Go to Detail Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuotation} onOpenChange={() => setDeletingQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quotation
              "{deletingQuotation?.quoteNumber}" and all associated data including items and history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuotation && deleteQuotation.mutate(deletingQuotation.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteQuotation.isPending}
            >
              {deleteQuotation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}