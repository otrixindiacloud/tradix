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
  ChevronDown,
  DollarSign,
  Building2,
  TrendingUp,
  Star,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusPill from "@/components/status/status-pill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import DataTable from "@/components/tables/data-table";
import { useToast } from "@/hooks/use-toast";

interface SupplierQuote {
  id: string;
  quoteNumber: string;
  supplierId: string;
  supplierName: string;
  requisitionId?: string;
  requisitionNumber?: string;
  rfqNumber?: string;
  status: "Pending" | "Received" | "Under Review" | "Approved" | "Rejected" | "Accepted" | "Expired";
  priority: "Low" | "Medium" | "High" | "Urgent";
  requestDate: string;
  responseDate?: string;
  validUntil: string;
  totalAmount: string;
  currency: "BHD" | "AED" | "EUR" | "GBP";
  paymentTerms: string;
  deliveryTerms: string;
  deliveryDate?: string;
  notes?: string;
  itemCount: number;
  competitiveRank?: number;
  isPreferredSupplier: boolean;
  evaluationScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierQuoteItem {
  id: string;
  quoteId: string;
  itemDescription: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  unitOfMeasure: string;
  specification?: string;
  brand?: string;
  model?: string;
  warranty?: string;
  leadTime?: string;
}

export default function SupplierQuotesPage() {
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    supplier: "",
    currency: "",
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
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState<SupplierQuote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<SupplierQuote | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [newQuote, setNewQuote] = useState({
    supplierId: "",
    rfqNumber: "",
    priority: "Medium" as "Low" | "Medium" | "High" | "Urgent",
    validUntil: "",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
  });
  const [editQuote, setEditQuote] = useState({
    supplierId: "",
    rfqNumber: "",
    priority: "Medium" as "Low" | "Medium" | "High" | "Urgent",
    validUntil: "",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    status: "Pending" as "Pending" | "Received" | "Under Review" | "Approved" | "Rejected" | "Accepted" | "Expired",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development - replace with actual API call
  const mockSupplierQuotes: SupplierQuote[] = [
    {
      id: "sq-001",
      quoteNumber: "SQ-2024-001",
      supplierId: "sup-001",
      supplierName: "Tech Solutions LLC",
      requisitionId: "req-001",
      requisitionNumber: "REQ-2024-001",
      rfqNumber: "RFQ-2024-001",
      status: "Received",
      priority: "High",
      requestDate: "2024-01-15",
      responseDate: "2024-01-17",
      validUntil: "2024-02-15",
      totalAmount: "5200.00",
  currency: "BHD",
      paymentTerms: "Net 30",
      deliveryTerms: "FOB Destination",
      deliveryDate: "2024-01-25",
      itemCount: 3,
      competitiveRank: 2,
      isPreferredSupplier: true,
      evaluationScore: 8.5,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-17T14:30:00Z"
    },
    {
      id: "sq-002",
      quoteNumber: "SQ-2024-002",
      supplierId: "sup-002",
      supplierName: "Office Supplies Co",
      requisitionId: "req-002",
      requisitionNumber: "REQ-2024-002",
      rfqNumber: "RFQ-2024-002",
      status: "Under Review",
      priority: "Medium",
      requestDate: "2024-01-14",
      responseDate: "2024-01-16",
      validUntil: "2024-02-14",
      totalAmount: "2100.00",
  currency: "BHD",
      paymentTerms: "Net 15",
      deliveryTerms: "CIF",
      deliveryDate: "2024-01-22",
      itemCount: 5,
      competitiveRank: 1,
      isPreferredSupplier: false,
      evaluationScore: 9.2,
      createdAt: "2024-01-14T09:30:00Z",
      updatedAt: "2024-01-16T11:45:00Z"
    },
    {
      id: "sq-003",
      quoteNumber: "SQ-2024-003",
      supplierId: "sup-003",
      supplierName: "Industrial Equipment Ltd",
      status: "Pending",
      priority: "Urgent",
      requestDate: "2024-01-18",
      validUntil: "2024-02-18",
      totalAmount: "0.00",
  currency: "BHD",
      paymentTerms: "Net 45",
      deliveryTerms: "FOB Origin",
      itemCount: 0,
      isPreferredSupplier: true,
      createdAt: "2024-01-18T08:15:00Z",
      updatedAt: "2024-01-18T08:15:00Z"
    }
  ];

  const { data: supplierQuotes = mockSupplierQuotes, isLoading, error } = useQuery({
    queryKey: ["/api/supplier-quotes", filters],
    queryFn: async () => {
      // For now, return mock data. Replace with actual API call
      return mockSupplierQuotes.filter(quote => {
        if (filters.status && quote.status !== filters.status) return false;
        if (filters.priority && quote.priority !== filters.priority) return false;
        if (filters.supplier && quote.supplierName.toLowerCase().indexOf(filters.supplier.toLowerCase()) === -1) return false;
        if (filters.currency && quote.currency !== filters.currency) return false;
        if (filters.search && !quote.quoteNumber.toLowerCase().includes(filters.search.toLowerCase()) 
            && !quote.supplierName.toLowerCase().includes(filters.search.toLowerCase())
            && !quote.rfqNumber?.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
    },
  });

  // Mock suppliers data
  const mockSuppliers = [
    { id: "sup-001", name: "Tech Solutions LLC" },
    { id: "sup-002", name: "Office Supplies Co" },
    { id: "sup-003", name: "Industrial Equipment Ltd" },
  ];

  // Create supplier quote mutation
  const createSupplierQuote = useMutation({
    mutationFn: async (data: typeof newQuote) => {
      // Mock implementation - replace with actual API call
      const supplier = mockSuppliers.find(s => s.id === data.supplierId);
      const newQuoteData: SupplierQuote = {
        id: `sq-${Date.now()}`,
        quoteNumber: `SQ-2024-${String(mockSupplierQuotes.length + 1).padStart(3, '0')}`,
        supplierName: supplier?.name || "Unknown Supplier",
        ...data,
        status: "Pending",
        requestDate: new Date().toISOString().split('T')[0],
        totalAmount: "0.00",
  currency: "BHD",
        itemCount: 0,
        isPreferredSupplier: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockSupplierQuotes.push(newQuoteData);
      return newQuoteData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-quotes"] });
      toast({
        title: "Success",
        description: "Supplier quote request created successfully",
      });
      setShowNewDialog(false);
      setNewQuote({
        supplierId: "",
        rfqNumber: "",
        priority: "Medium",
        validUntil: "",
        paymentTerms: "",
        deliveryTerms: "",
        notes: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create supplier quote request",
        variant: "destructive",
      });
    },
  });

  // Update supplier quote mutation
  const updateSupplierQuote = useMutation({
    mutationFn: async (data: { id: string; updates: typeof editQuote }) => {
      // Mock implementation - replace with actual API call
      const quoteIndex = mockSupplierQuotes.findIndex(q => q.id === data.id);
      if (quoteIndex === -1) {
        throw new Error("Quote not found");
      }
      
      const supplier = mockSuppliers.find(s => s.id === data.updates.supplierId);
      const updatedQuote = {
        ...mockSupplierQuotes[quoteIndex],
        ...data.updates,
        supplierName: supplier?.name || mockSupplierQuotes[quoteIndex].supplierName,
        updatedAt: new Date().toISOString()
      };
      
      mockSupplierQuotes[quoteIndex] = updatedQuote;
      return updatedQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-quotes"] });
      toast({
        title: "Success",
        description: "Supplier quote updated successfully",
      });
      setShowEditDialog(false);
      setEditingQuote(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update supplier quote",
        variant: "destructive",
      });
    },
  });

  // Delete supplier quote mutation
  const deleteSupplierQuote = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation - replace with actual API call
      const index = mockSupplierQuotes.findIndex(q => q.id === id);
      if (index > -1) {
        mockSupplierQuotes.splice(index, 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-quotes"] });
      toast({
        title: "Success",
        description: "Supplier quote deleted successfully",
      });
      setDeletingQuote(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete supplier quote",
        variant: "destructive",
      });
    },
  });

  // Handle edit quote
  const handleEdit = (quote: SupplierQuote) => {
    setEditingQuote(quote);
    setEditQuote({
      supplierId: quote.supplierId,
      rfqNumber: quote.rfqNumber || "",
      priority: quote.priority,
      validUntil: quote.validUntil,
      paymentTerms: quote.paymentTerms,
      deliveryTerms: quote.deliveryTerms,
      notes: quote.notes || "",
      status: quote.status,
    });
    setShowEditDialog(true);
  };

  // Handle delete quote
  const handleDelete = (quote: SupplierQuote) => {
    setDeletingQuote(quote);
  };

  // Handle compare quotes
  const handleCompare = () => {
    if (selectedQuotes.length < 2) {
      toast({
        title: "Selection Required",
        description: "Please select at least 2 quotes to compare",
        variant: "destructive",
      });
      return;
    }
    setShowCompareDialog(true);
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

  // Export supplier quotes function
  const exportSupplierQuotes = (format: 'csv' | 'excel') => {
    if (!supplierQuotes || supplierQuotes.length === 0) {
      toast({
        title: "No Data",
        description: "No supplier quotes to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const exportData = supplierQuotes.map((quote: SupplierQuote) => ({
        'Quote Number': quote.quoteNumber,
        'Supplier Name': quote.supplierName,
        'RFQ Number': quote.rfqNumber || '',
        'Requisition Number': quote.requisitionNumber || '',
        'Status': quote.status,
        'Priority': quote.priority,
        'Request Date': quote.requestDate ? formatDate(new Date(quote.requestDate), "yyyy-MM-dd") : '',
        'Response Date': quote.responseDate ? formatDate(new Date(quote.responseDate), "yyyy-MM-dd") : '',
        'Valid Until': quote.validUntil ? formatDate(new Date(quote.validUntil), "yyyy-MM-dd") : '',
        'Total Amount': parseFloat(quote.totalAmount || '0'),
        'Currency': quote.currency,
        'Payment Terms': quote.paymentTerms,
        'Delivery Terms': quote.deliveryTerms,
        'Delivery Date': quote.deliveryDate ? formatDate(new Date(quote.deliveryDate), "yyyy-MM-dd") : '',
        'Item Count': quote.itemCount,
        'Competitive Rank': quote.competitiveRank || '',
        'Preferred Supplier': quote.isPreferredSupplier ? 'Yes' : 'No',
        'Evaluation Score': quote.evaluationScore || '',
        'Notes': quote.notes || '',
        'Created At': quote.createdAt ? formatDate(new Date(quote.createdAt), "yyyy-MM-dd") : ''
      }));

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(format === 'csv' ? ',' : '\t'),
        ...exportData.map((row: any) => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            if (format === 'csv' && typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(format === 'csv' ? ',' : '\t')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { 
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier-quotes-export-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Supplier quotes exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      console.error("Error exporting supplier quotes:", error);
      toast({
        title: "Error",
        description: "Failed to export supplier quotes",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending": return <Clock className="h-4 w-4" />;
      case "Received": return <FileText className="h-4 w-4" />;
      case "Under Review": return <Eye className="h-4 w-4" />;
      case "Approved": return <CheckCircle className="h-4 w-4" />;
      case "Rejected": return <XCircle className="h-4 w-4" />;
      case "Accepted": return <CheckCircle className="h-4 w-4" />;
      case "Expired": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low": return "text-green-700 bg-green-100 border border-green-300";
      case "Medium": return "text-yellow-700 bg-yellow-100 border border-yellow-300";
      case "High": return "text-orange-700 bg-orange-100 border border-orange-300";
      case "Urgent": return "text-red-700 bg-red-100 border border-red-300";
      default: return "text-gray-700 bg-gray-100 border border-gray-300";
    }
  };

  const columns = [
    {
      key: "select",
      header: "",
      render: (_: any, quote: SupplierQuote) => (
        <input
          type="checkbox"
          checked={selectedQuotes.includes(quote.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedQuotes([...selectedQuotes, quote.id]);
            } else {
              setSelectedQuotes(selectedQuotes.filter(id => id !== quote.id));
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: "quoteNumber",
      header: "Quote Number",
      render: (value: string, quote: SupplierQuote) => (
        <div className="flex items-center gap-2">
          <Link href={`/supplier-quotes/${quote.id}`} className="font-medium text-gray-600 hover:text-gray-800">
            {value}
          </Link>
          {quote.isPreferredSupplier && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      ),
    },
    {
      key: "supplierName",
      header: "Supplier",
      render: (value: string, quote: SupplierQuote) => (
        <div>
          <div className="font-medium">{value}</div>
          {quote.rfqNumber && (
            <div className="text-sm text-gray-500">RFQ: {quote.rfqNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value: string) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <StatusPill status={value.toLowerCase().replace(' ', '-')} />
      ),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      className: "text-right",
      render: (value: string, quote: SupplierQuote) => (
        <div className="text-right">
          <div className="font-medium">
            {parseFloat(value) > 0 ? `${quote.currency} ${parseFloat(value).toLocaleString()}` : "Pending"}
          </div>
          {quote.competitiveRank && (
            <div className="text-xs text-blue-600">
              Rank #{quote.competitiveRank}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "evaluationScore",
      header: "Score",
      className: "text-center",
      render: (value: number | undefined) => (
        <div className="text-center">
          {value ? (
            <Badge className={value >= 8 ? "bg-green-500 text-white" : value >= 6 ? "bg-yellow-500 text-white" : "bg-red-500 text-white"}>
              {value}/10
            </Badge>
          ) : (
            <span className="text-gray-400">-</span>
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
      key: "actions",
      header: "Actions",
      render: (_: any, quote: SupplierQuote) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/supplier-quotes/${quote.id}`);
            }}
            data-testid={`button-view-${quote.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(quote);
            }}
            data-testid={`button-edit-${quote.id}`}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(quote);
            }}
            data-testid={`button-delete-${quote.id}`}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  // Pagination logic
  const totalPages = Math.ceil(supplierQuotes.length / pageSize);
  const paginatedQuotes = supplierQuotes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Supplier Quotes
                </h2>
              </div>
              <p className="text-muted-foreground text-lg">
                Manage supplier quotations and procurement comparisons
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-indigo-600">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span className="font-medium">Supplier Management</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Quotes: {supplierQuotes.length}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedQuotes.length > 0 && (
              <Button 
                variant="outline"
                onClick={handleCompare}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Compare ({selectedQuotes.length})
              </Button>
            )}
            <Button 
              variant="outline"
              className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition flex items-center gap-2" 
              onClick={() => setShowNewDialog(true)}
              data-testid="button-new-supplier-quote"
            >
              <Plus className="h-4 w-4" />
              Request Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="rounded-full p-2 mt-1">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Pending</div>
            <div className="text-2xl font-bold text-gray-900">
              {supplierQuotes?.filter((q: SupplierQuote) => q.status === "Pending").length || 0}
            </div>
          </div>
        </Card>
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="rounded-full p-2 mt-1">
            <FileText className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Received</div>
            <div className="text-2xl font-bold text-gray-900">
              {supplierQuotes?.filter((q: SupplierQuote) => q.status === "Received").length || 0}
            </div>
          </div>
        </Card>
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="rounded-full p-2 mt-1">
            <Eye className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Under Review</div>
            <div className="text-2xl font-bold text-gray-900">
              {supplierQuotes?.filter((q: SupplierQuote) => q.status === "Under Review").length || 0}
            </div>
          </div>
        </Card>
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="rounded-full p-2 mt-1">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Approved</div>
            <div className="text-2xl font-bold text-gray-900">
              {supplierQuotes?.filter((q: SupplierQuote) => q.status === "Approved").length || 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-2 mb-4">      
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search quotes..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value })}
            >
              <SelectTrigger data-testid="select-priority">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.currency}
              onValueChange={(value) => setFilters({ ...filters, currency: value })}
            >
              <SelectTrigger data-testid="select-currency">
                <SelectValue placeholder="All Currencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="BHD">BHD</SelectItem>
                <SelectItem value="AED">AED</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Filter by supplier..."
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              className="border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-none"
            />
          </div>
          <div>
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
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
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
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Supplier Quotes Table - moved inside Card for consistent UI */}
      <Card className="border border-gray-200 shadow-sm bg-white mt-6">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">Supplier Quotes</h3>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-export-table">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportSupplierQuotes('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSupplierQuotes('excel')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading supplier quotes</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/supplier-quotes"] })}>
                Retry
              </Button>
            </div>
          ) : (
            <div>
              <DataTable
                data={paginatedQuotes || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No supplier quotes found. Create your first quote request to get started."
                onRowClick={(quote: any) => {
                  navigate(`/supplier-quotes/${quote.id}`);
                }}
              />
              {/* Pagination Controls */}
              {supplierQuotes.length > pageSize && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="mx-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Supplier Quote Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Supplier Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierId">Supplier</Label>
                <Select
                  value={newQuote.supplierId}
                  onValueChange={(value) => setNewQuote({ ...newQuote, supplierId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rfqNumber">RFQ Number (Optional)</Label>
                <Input
                  id="rfqNumber"
                  value={newQuote.rfqNumber}
                  onChange={(e) => setNewQuote({ ...newQuote, rfqNumber: e.target.value })}
                  placeholder="RFQ-2024-XXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newQuote.priority}
                  onValueChange={(value: "Low" | "Medium" | "High" | "Urgent") => 
                    setNewQuote({ ...newQuote, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={newQuote.validUntil}
                  onChange={(e) => setNewQuote({ ...newQuote, validUntil: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={newQuote.paymentTerms}
                  onChange={(e) => setNewQuote({ ...newQuote, paymentTerms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              </div>
              <div>
                <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                <Input
                  id="deliveryTerms"
                  value={newQuote.deliveryTerms}
                  onChange={(e) => setNewQuote({ ...newQuote, deliveryTerms: e.target.value })}
                  placeholder="e.g., FOB Destination"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newQuote.notes}
                onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                placeholder="Additional requirements or specifications"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createSupplierQuote.mutate(newQuote)}
                disabled={createSupplierQuote.isPending || !newQuote.supplierId || !newQuote.validUntil}
              >
                {createSupplierQuote.isPending ? "Sending..." : "Send Quote Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Quote Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier Quote</DialogTitle>
            {editingQuote && (
              <p className="text-sm text-muted-foreground">
                Quote Number: {editingQuote.quoteNumber}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-supplierId">Supplier</Label>
                <Select
                  value={editQuote.supplierId}
                  onValueChange={(value) => setEditQuote({ ...editQuote, supplierId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-rfqNumber">RFQ Number</Label>
                <Input
                  id="edit-rfqNumber"
                  value={editQuote.rfqNumber}
                  onChange={(e) => setEditQuote({ ...editQuote, rfqNumber: e.target.value })}
                  placeholder="RFQ-2024-XXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editQuote.priority}
                  onValueChange={(value: "Low" | "Medium" | "High" | "Urgent") => 
                    setEditQuote({ ...editQuote, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editQuote.status}
                  onValueChange={(value: "Pending" | "Received" | "Under Review" | "Approved" | "Rejected" | "Accepted" | "Expired") => 
                    setEditQuote({ ...editQuote, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-validUntil">Valid Until</Label>
              <Input
                id="edit-validUntil"
                type="date"
                value={editQuote.validUntil}
                onChange={(e) => setEditQuote({ ...editQuote, validUntil: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-paymentTerms">Payment Terms</Label>
                <Input
                  id="edit-paymentTerms"
                  value={editQuote.paymentTerms}
                  onChange={(e) => setEditQuote({ ...editQuote, paymentTerms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              </div>
              <div>
                <Label htmlFor="edit-deliveryTerms">Delivery Terms</Label>
                <Input
                  id="edit-deliveryTerms"
                  value={editQuote.deliveryTerms}
                  onChange={(e) => setEditQuote({ ...editQuote, deliveryTerms: e.target.value })}
                  placeholder="e.g., FOB Destination"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editQuote.notes}
                onChange={(e) => setEditQuote({ ...editQuote, notes: e.target.value })}
                placeholder="Additional requirements or specifications"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingQuote(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingQuote) {
                    updateSupplierQuote.mutate({
                      id: editingQuote.id,
                      updates: editQuote
                    });
                  }
                }}
                disabled={updateSupplierQuote.isPending || !editQuote.supplierId || !editQuote.validUntil}
              >
                {updateSupplierQuote.isPending ? "Updating..." : "Update Quote"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Quotes Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Supplier Quotes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Comparison feature will be implemented to analyze multiple quotes side by side.
              Selected quotes: {selectedQuotes.join(', ')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuote} onOpenChange={() => setDeletingQuote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier quote
              "{deletingQuote?.quoteNumber}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuote && deleteSupplierQuote.mutate(deletingQuote.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSupplierQuote.isPending}
            >
              {deleteSupplierQuote.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}