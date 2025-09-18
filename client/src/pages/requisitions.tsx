import { useState, useEffect } from "react";
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
  ClipboardList,
  Package,
  User
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

interface Requisition {
  id: string;
  requisitionNumber: string;
  requestedBy: string;
  department: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Processing" | "Completed" | "Cancelled";
  requestDate: string;
  requiredDate: string;
  approvedBy?: string;
  approvedDate?: string;
  totalEstimatedCost: string;
  justification: string;
  notes?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RequisitionItem {
  id: string;
  requisitionId: string;
  itemDescription: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedCost: string;
  specification?: string;
  preferredSupplier?: string;
  urgency: "Standard" | "Urgent";
}

export default function RequisitionsPage() {
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: "",
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
  const [editingRequisition, setEditingRequisition] = useState<Requisition | null>(null);
  const [deletingRequisition, setDeletingRequisition] = useState<Requisition | null>(null);
  const [newRequisition, setNewRequisition] = useState({
    requestedBy: "",
    department: "",
    priority: "Medium" as const,
    requiredDate: "",
    justification: "",
    notes: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development - replace with actual API call
  const mockRequisitions: Requisition[] = [
    {
      id: "req-001",
      requisitionNumber: "REQ-2024-001",
      requestedBy: "John Smith",
      department: "IT",
      priority: "High",
      status: "Pending Approval",
      requestDate: "2024-01-15",
      requiredDate: "2024-01-25",
      totalEstimatedCost: "5500.00",
      justification: "Replacement for outdated servers",
      itemCount: 3,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "req-002",
      requisitionNumber: "REQ-2024-002",
      requestedBy: "Sarah Johnson",
      department: "HR",
      priority: "Medium",
      status: "Approved",
      requestDate: "2024-01-14",
      requiredDate: "2024-01-20",
      approvedBy: "Mike Wilson",
      approvedDate: "2024-01-15",
      totalEstimatedCost: "2200.00",
      justification: "Office furniture for new employees",
      itemCount: 5,
      createdAt: "2024-01-14T09:30:00Z",
      updatedAt: "2024-01-15T14:20:00Z"
    },
    {
      id: "req-003",
      requisitionNumber: "REQ-2024-003",
      requestedBy: "David Brown",
      department: "Finance",
      priority: "Low",
      status: "Draft",
      requestDate: "2024-01-16",
      requiredDate: "2024-02-01",
      totalEstimatedCost: "850.00",
      justification: "Accounting software licenses",
      itemCount: 2,
      createdAt: "2024-01-16T11:15:00Z",
      updatedAt: "2024-01-16T11:15:00Z"
    },
    {
      id: "req-004",
      requisitionNumber: "REQ-2024-004",
      requestedBy: "Emily Davis",
      department: "Marketing",
      priority: "Urgent",
      status: "Processing",
      requestDate: "2024-01-13",
      requiredDate: "2024-01-18",
      approvedBy: "Tom Anderson",
      approvedDate: "2024-01-14",
      totalEstimatedCost: "3200.00",
      justification: "Campaign materials and promotional items",
      itemCount: 8,
      createdAt: "2024-01-13T08:45:00Z",
      updatedAt: "2024-01-16T16:30:00Z"
    }
  ];

  // Check for edit parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      // Find the requisition to edit
      const requisitionToEdit = mockRequisitions.find(req => req.id === editId);
      if (requisitionToEdit) {
        setEditingRequisition(requisitionToEdit);
        setShowEditDialog(true);
        // Remove the edit parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const { data: requisitions = mockRequisitions, isLoading = false, error } = useQuery({
    queryKey: ["/api/requisitions", filters],
    queryFn: async () => {
      // Using mock data for development - backend to be implemented
      return mockRequisitions.filter(req => {
        if (filters.status && req.status !== filters.status) return false;
        if (filters.priority && req.priority !== filters.priority) return false;
        if (filters.department && req.department !== filters.department) return false;
        if (filters.search && !req.requisitionNumber.toLowerCase().includes(filters.search.toLowerCase()) 
            && !req.requestedBy.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
    },
  });

  // Create requisition mutation
  const createRequisition = useMutation({
    mutationFn: async (data: typeof newRequisition) => {
      // Mock implementation - replace with actual API call
      const newReq: Requisition = {
        id: `req-${Date.now()}`,
        requisitionNumber: `REQ-2024-${String(mockRequisitions.length + 1).padStart(3, '0')}`,
        ...data,
        status: "Draft",
        requestDate: new Date().toISOString().split('T')[0],
        totalEstimatedCost: "0.00",
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockRequisitions.push(newReq);
      return newReq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions"] });
      toast({
        title: "Success",
        description: "Requisition created successfully",
      });
      setShowNewDialog(false);
      setNewRequisition({
        requestedBy: "",
        department: "",
        priority: "Medium",
        requiredDate: "",
        justification: "",
        notes: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create requisition",
        variant: "destructive",
      });
    },
  });

  // Update requisition mutation
  const updateRequisition = useMutation({
    mutationFn: async (data: Partial<Requisition> & { id: string }) => {
      // Mock implementation - replace with actual API call
      const index = mockRequisitions.findIndex(r => r.id === data.id);
      if (index > -1) {
        mockRequisitions[index] = {
          ...mockRequisitions[index],
          ...data,
          updatedAt: new Date().toISOString()
        };
        return mockRequisitions[index];
      }
      throw new Error("Requisition not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions"] });
      toast({
        title: "Success",
        description: "Requisition updated successfully",
      });
      setShowEditDialog(false);
      setEditingRequisition(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update requisition",
        variant: "destructive",
      });
    },
  });

  // Delete requisition mutation
  const deleteRequisition = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation - replace with actual API call
      const index = mockRequisitions.findIndex(r => r.id === id);
      if (index > -1) {
        mockRequisitions.splice(index, 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions"] });
      toast({
        title: "Success",
        description: "Requisition deleted successfully",
      });
      setDeletingRequisition(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete requisition",
        variant: "destructive",
      });
    },
  });

  // Handle edit requisition
  const handleEdit = (requisition: Requisition) => {
    setEditingRequisition(requisition);
    setShowEditDialog(true);
  };

  // Handle delete requisition
  const handleDelete = (requisition: Requisition) => {
    setDeletingRequisition(requisition);
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

  // Export requisitions function
  const exportRequisitions = (format: 'csv' | 'excel') => {
    if (!requisitions || requisitions.length === 0) {
      toast({
        title: "No Data",
        description: "No requisitions to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const exportData = requisitions.map((req: Requisition) => ({
        'Requisition Number': req.requisitionNumber,
        'Requested By': req.requestedBy,
        'Department': req.department,
        'Priority': req.priority,
        'Status': req.status,
        'Request Date': req.requestDate ? formatDate(new Date(req.requestDate), "yyyy-MM-dd") : '',
        'Required Date': req.requiredDate ? formatDate(new Date(req.requiredDate), "yyyy-MM-dd") : '',
        'Approved By': req.approvedBy || '',
        'Approved Date': req.approvedDate ? formatDate(new Date(req.approvedDate), "yyyy-MM-dd") : '',
        'Total Estimated Cost': parseFloat(req.totalEstimatedCost || '0'),
        'Item Count': req.itemCount,
        'Justification': req.justification,
        'Notes': req.notes || '',
        'Created At': req.createdAt ? formatDate(new Date(req.createdAt), "yyyy-MM-dd") : ''
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
      a.download = `requisitions-export-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Requisitions exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      console.error("Error exporting requisitions:", error);
      toast({
        title: "Error",
        description: "Failed to export requisitions",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft": return <Clock className="h-4 w-4" />;
      case "Pending Approval": return <AlertTriangle className="h-4 w-4" />;
      case "Approved": return <CheckCircle className="h-4 w-4" />;
      case "Rejected": return <XCircle className="h-4 w-4" />;
      case "Processing": return <Package className="h-4 w-4" />;
      case "Completed": return <CheckCircle className="h-4 w-4" />;
      case "Cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low": return "text-white bg-green-100";
      case "Medium": return "text-white bg-yellow-100";
      case "High": return "text-white bg-orange-100";
      case "Urgent": return "text-white bg-red-100";
      default: return "text-white bg-gray-100";
    }
  };

  const columns = [
    {
      key: "requisitionNumber",
      header: "Requisition Number",
      render: (value: string, requisition: Requisition) => (
        <div className="flex items-center gap-2">
          <Link href={`/requisitions/${requisition.id}`} className="font-medium text-gray-600 hover:text-gray-800">
            {value}
          </Link>
        </div>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested By",
      render: (value: string, requisition: Requisition) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{requisition.department}</div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value: string) => (
        <Badge className={getPriorityColor(value)}>
          {value}
        </Badge>
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
      key: "itemCount",
      header: "Items",
      className: "text-center",
      render: (value: number) => (
        <div className="text-center">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "totalEstimatedCost",
      header: "Estimated Cost",
      className: "text-right",
      render: (value: string) => (
        <div className="text-right font-medium">
          ${parseFloat(value).toLocaleString()}
        </div>
      ),
    },
    {
      key: "requiredDate",
      header: "Required Date",
      className: "text-right",
      render: (value: string) => {
        const date = new Date(value);
        const isOverdue = date < new Date() && date.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0];
        return (
          <div className={`text-right ${isOverdue ? 'text-red-600' : ''}`}>
            {formatDate(date, "MMM dd, yyyy")}
            {isOverdue && (
              <div className="text-xs text-red-500">Overdue</div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, requisition: Requisition) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/requisitions/${requisition.id}`);
            }}
            data-testid={`button-view-${requisition.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(requisition);
            }}
            data-testid={`button-edit-${requisition.id}`}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(requisition);
            }}
            data-testid={`button-delete-${requisition.id}`}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  // Pagination logic
  const totalPages = Math.ceil(requisitions.length / pageSize);
  const paginatedRequisitions = requisitions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Card-style header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ClipboardList className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Requisitions
                </h2>
              </div>
              <p className="text-muted-foreground text-lg">
                Internal procurement requests and approvals
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="font-medium">Procurement Management</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Requisitions: {requisitions.length}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold px-6 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition flex items-center gap-2" 
              onClick={() => setShowNewDialog(true)}
              data-testid="button-new-requisition"
            >
              <Plus className="h-4 w-4" />
              New Requisition
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="p-2 mt-1">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Pending Approval</div>
            <div className="text-2xl font-bold text-gray-900">
              {requisitions?.filter((r: Requisition) => r.status === "Pending Approval").length || 0}
            </div>
          </div>
        </Card>
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="p-2 mt-1">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Approved</div>
            <div className="text-2xl font-bold text-gray-900">
              {requisitions?.filter((r: Requisition) => r.status === "Approved").length || 0}
            </div>
          </div>
        </Card>
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="p-2 mt-1">
            <Package className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Processing</div>
            <div className="text-2xl font-bold text-gray-900">
              {requisitions?.filter((r: Requisition) => r.status === "Processing").length || 0}
            </div>
          </div>
        </Card>
        <Card className="flex flex-row items-start gap-4 p-4 shadow-sm border border-gray-200 bg-white">
          <div className="p-2 mt-1">
            <Clock className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-700">Urgent</div>
            <div className="text-2xl font-bold text-gray-900">
              {requisitions?.filter((r: Requisition) => r.priority === "Urgent").length || 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requisitions..."
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
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                value={filters.department}
                onValueChange={(value) => setFilters({ ...filters, department: value })}
              >
                <SelectTrigger data-testid="select-department">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
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
        </CardContent>
      </Card>

      {/* Requisitions Table */}
        {/* Requisitions Table - moved inside Card for consistent UI */}
        <Card className="border border-gray-200 shadow-sm bg-white mt-6">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Requisitions</h3>
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
                    <DropdownMenuItem onClick={() => exportRequisitions('csv')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRequisitions('excel')}>
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
                <p className="text-red-600 mb-4">Error loading requisitions</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/requisitions"] })}>
                  Retry
                </Button>
              </div>
            ) : (
              <div>
                <DataTable
                  data={paginatedRequisitions || []}
                  columns={columns}
                  isLoading={isLoading}
                  emptyMessage="No requisitions found. Create your first requisition to get started."
                  onRowClick={(requisition: any) => {
                    navigate(`/requisitions/${requisition.id}`);
                  }}
                />
                {/* Pagination Controls */}
                {requisitions.length > pageSize && (
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

      {/* New Requisition Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Requisition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestedBy">Requested By</Label>
                <Input
                  id="requestedBy"
                  value={newRequisition.requestedBy}
                  onChange={(e) => setNewRequisition({ ...newRequisition, requestedBy: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newRequisition.department}
                  onValueChange={(value) => setNewRequisition({ ...newRequisition, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newRequisition.priority}
                  onValueChange={(value: "Low" | "Medium" | "High" | "Urgent") => 
                    setNewRequisition({ ...newRequisition, priority: value })}
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
                <Label htmlFor="requiredDate">Required Date</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  value={newRequisition.requiredDate}
                  onChange={(e) => setNewRequisition({ ...newRequisition, requiredDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="justification">Justification</Label>
              <Textarea
                id="justification"
                value={newRequisition.justification}
                onChange={(e) => setNewRequisition({ ...newRequisition, justification: e.target.value })}
                placeholder="Explain why this requisition is needed"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newRequisition.notes}
                onChange={(e) => setNewRequisition({ ...newRequisition, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createRequisition.mutate(newRequisition)}
                disabled={createRequisition.isPending || !newRequisition.requestedBy || !newRequisition.department || !newRequisition.justification}
              >
                {createRequisition.isPending ? "Creating..." : "Create Requisition"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Requisition Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Requisition</DialogTitle>
          </DialogHeader>
          {editingRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-requestedBy">Requested By</Label>
                  <Input
                    id="edit-requestedBy"
                    value={editingRequisition.requestedBy}
                    onChange={(e) => setEditingRequisition({ 
                      ...editingRequisition, 
                      requestedBy: e.target.value 
                    })}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={editingRequisition.department}
                    onValueChange={(value) => setEditingRequisition({ 
                      ...editingRequisition, 
                      department: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingRequisition.priority}
                    onValueChange={(value: "Low" | "Medium" | "High" | "Urgent") => 
                      setEditingRequisition({ ...editingRequisition, priority: value })}
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
                  <Label htmlFor="edit-requiredDate">Required Date</Label>
                  <Input
                    id="edit-requiredDate"
                    type="date"
                    value={editingRequisition.requiredDate}
                    onChange={(e) => setEditingRequisition({ 
                      ...editingRequisition, 
                      requiredDate: e.target.value 
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingRequisition.status}
                    onValueChange={(value: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Processing" | "Completed" | "Cancelled") => 
                      setEditingRequisition({ ...editingRequisition, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-totalEstimatedCost">Total Estimated Cost</Label>
                  <Input
                    id="edit-totalEstimatedCost"
                    type="number"
                    step="0.01"
                    value={editingRequisition.totalEstimatedCost}
                    onChange={(e) => setEditingRequisition({ 
                      ...editingRequisition, 
                      totalEstimatedCost: e.target.value 
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-justification">Justification</Label>
                <Textarea
                  id="edit-justification"
                  value={editingRequisition.justification}
                  onChange={(e) => setEditingRequisition({ 
                    ...editingRequisition, 
                    justification: e.target.value 
                  })}
                  placeholder="Explain why this requisition is needed"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={editingRequisition.notes || ""}
                  onChange={(e) => setEditingRequisition({ 
                    ...editingRequisition, 
                    notes: e.target.value 
                  })}
                  placeholder="Additional notes or comments"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateRequisition.mutate(editingRequisition)}
                  disabled={updateRequisition.isPending || !editingRequisition.requestedBy || !editingRequisition.department || !editingRequisition.justification}
                >
                  {updateRequisition.isPending ? "Updating..." : "Update Requisition"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRequisition} onOpenChange={() => setDeletingRequisition(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the requisition
              "{deletingRequisition?.requisitionNumber}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRequisition && deleteRequisition.mutate(deletingRequisition.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRequisition.isPending}
            >
              {deleteRequisition.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}