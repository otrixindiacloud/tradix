import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Eye, Edit, Trash2, PlusCircle, Clock, FileText, CheckCircle, BarChart3 } from "lucide-react";
import DataTable, { Column } from "@/components/tables/data-table";
import EnquiryForm from "@/components/forms/enquiry-form";
import EnquiryFilters from "@/components/enquiry/enquiry-filters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDate, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Enquiries() {
  const [showNewEnquiry, setShowNewEnquiry] = useState(false);
  const [showEditEnquiry, setShowEditEnquiry] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<any>(null);
  const [deletingEnquiry, setDeletingEnquiry] = useState<any>(null);
  const [filters, setFilters] = useState({});
  const [selectedEnquiries, setSelectedEnquiries] = useState<string[]>([]);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [, setLocation] = useLocation();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load selected enquiries from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedEnquiries');
    if (saved) {
      try {
        setSelectedEnquiries(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing selected enquiries from localStorage:', error);
      }
    }
  }, []);

  const { data: enquiries = [], isLoading, error } = useQuery({
    queryKey: ["/api/enquiries", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value as string);
        }
      });
      
      const response = await fetch(`/api/enquiries?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch enquiries: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  const deleteEnquiry = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/enquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries"] });
      toast({
        title: "Success",
        description: "Enquiry deleted successfully",
      });
      setDeletingEnquiry(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete enquiry",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (enquiry: any) => {
    setEditingEnquiry(enquiry);
    setShowEditEnquiry(true);
  };

  const handleDelete = (enquiry: any) => {
    setDeletingEnquiry(enquiry);
  };

  const handleSelectEnquiry = (enquiryId: string, checked: boolean) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedEnquiries, enquiryId];
    } else {
      newSelection = selectedEnquiries.filter(id => id !== enquiryId);
    }
    setSelectedEnquiries(newSelection);
    localStorage.setItem('selectedEnquiries', JSON.stringify(newSelection));
  };

  const handleSelectAll = (checked: boolean) => {
    let newSelection;
    if (checked) {
      newSelection = enquiries.map((e: any) => e.id);
    } else {
      newSelection = [];
    }
    setSelectedEnquiries(newSelection);
    localStorage.setItem('selectedEnquiries', JSON.stringify(newSelection));
  };

  const handleViewProgress = () => {
    if (selectedEnquiries.length > 0) {
      setShowProgressDashboard(true);
    } else {
      toast({
        title: "No Enquiries Selected",
        description: "Please select at least one enquiry to view progress.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<any>[] = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={selectedEnquiries.length === enquiries.length && enquiries.length > 0}
          onCheckedChange={handleSelectAll}
          aria-label="Select all enquiries"
        />
      ),
      render: (value: any, enquiry: any) => (
        <Checkbox
          checked={selectedEnquiries.includes(enquiry.id)}
          onCheckedChange={(checked) => handleSelectEnquiry(enquiry.id, checked as boolean)}
          aria-label={`Select enquiry ${enquiry.enquiryNumber}`}
        />
      ),
    },
    {
      key: "enquiryNumber",
      header: "Enquiry ID",
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
      key: "source",
      header: "Source",
      render: (value: string) => (
        value === "Email"
          ? <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">{value}</Badge>
          : value === "Walk-in"
            ? <Badge variant="outline" className="bg-orange-500 text-white border-orange-500">{value}</Badge>
            : value === "Web Form"
              ? <Badge variant="outline" className="bg-purple-600 text-white border-purple-600">{value}</Badge>
              : value === "Phone"
                ? <Badge variant="outline" className="bg-green-600 text-white border-green-600">{value}</Badge>
                : <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        value === "Quoted"
          ? <Badge variant="outline" className="bg-green-600 text-white border-green-600">{value}</Badge>
          : value === "New"
            ? <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">{value}</Badge>
            : value === "In Progress"
              ? <Badge variant="outline" className="bg-yellow-400 text-white border-yellow-400">{value}</Badge>
              : value === "Closed"
                ? <Badge variant="outline" className="bg-gray-500 text-white border-gray-500">{value}</Badge>
                : <Badge variant="outline" className={getStatusColor(value)}>{value}</Badge>
      ),
    },
    {
      key: "targetDeliveryDate",
      header: "Target Delivery",
      render: (value: string) => value ? formatDate(value) : "-",
    },
    {
      key: "enquiryDate",
      header: "Created",
      className: "text-right",
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, enquiry: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/enquiries/${enquiry.id}`);
            }}
            data-testid={`button-view-${enquiry.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(enquiry);
            }}
            data-testid={`button-edit-${enquiry.id}`}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(enquiry);
            }}
            data-testid={`button-delete-${enquiry.id}`}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const statusCounts = {
    new: Array.isArray(enquiries) ? enquiries.filter((e: any) => e.status === "New").length : 0,
    inProgress: Array.isArray(enquiries) ? enquiries.filter((e: any) => e.status === "In Progress").length : 0,
    quoted: Array.isArray(enquiries) ? enquiries.filter((e: any) => e.status === "Quoted").length : 0,
    closed: Array.isArray(enquiries) ? enquiries.filter((e: any) => e.status === "Closed").length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
              Customer Enquiries
            </h2>
            <p className="text-gray-600 text-lg">
              Step 1: Manage customer enquiries from multiple channels
            </p>
          </div>
          <div className="flex gap-2">
            {selectedEnquiries.length > 0 && (
              <Button 
                variant="outline" 
                className="flex items-center space-x-2" 
                onClick={handleViewProgress}
                data-testid="button-view-progress"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Progress ({selectedEnquiries.length})</span>
              </Button>
            )}
            <Dialog open={showNewEnquiry} onOpenChange={setShowNewEnquiry}>
              <DialogTrigger asChild>
                <Button className="btn-primary flex items-center space-x-2" data-testid="button-new-enquiry">
                  <Plus className="h-4 w-4" />
                  <span>New Enquiry</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Enquiry</DialogTitle>
                </DialogHeader>
                <EnquiryForm onSuccess={() => setShowNewEnquiry(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-start gap-3">
              <div className="kpi-icon bg-blue-100">
                <PlusCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="kpi-label">New Enquiries</p>
                <p className="kpi-value text-blue-600" data-testid="stat-new-enquiries">
                  {statusCounts.new}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-start gap-3">
              <div className="kpi-icon bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="kpi-label">In Progress</p>
                <p className="kpi-value text-amber-600" data-testid="stat-in-progress-enquiries">
                  {statusCounts.inProgress}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-start gap-3">
              <div className="kpi-icon bg-green-100">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="kpi-label">Quoted</p>
                <p className="kpi-value text-green-600" data-testid="stat-quoted-enquiries">
                  {statusCounts.quoted}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-card card-elevated">
          <div className="kpi-card-content">
            <div className="flex items-start gap-3">
              <div className="kpi-icon bg-gray-100">
                <CheckCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="kpi-label">Closed</p>
                <p className="kpi-value text-gray-600" data-testid="stat-closed-enquiries">
                  {statusCounts.closed}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <EnquiryFilters 
          onFiltersChange={setFilters}
          customers={Array.isArray(customers) ? customers : []}
        />
      </div>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading enquiries: {error.message}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/enquiries"] })}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              data={enquiries || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No enquiries found. Create your first enquiry to get started."
              onRowClick={(enquiry) => {
                setLocation(`/enquiries/${enquiry.id}`);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Enquiry Dialog */}
      <Dialog open={showEditEnquiry} onOpenChange={setShowEditEnquiry}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Enquiry</DialogTitle>
          </DialogHeader>
          {editingEnquiry && (
            <EnquiryForm
              enquiryId={editingEnquiry.id}
              initialData={{
                customerId: editingEnquiry.customerId,
                source: editingEnquiry.source,
                targetDeliveryDate: editingEnquiry.targetDeliveryDate,
                notes: editingEnquiry.notes,
              }}
              onSuccess={() => {
                setShowEditEnquiry(false);
                setEditingEnquiry(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEnquiry} onOpenChange={() => setDeletingEnquiry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the enquiry
              "{deletingEnquiry?.enquiryNumber}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEnquiry && deleteEnquiry.mutate(deletingEnquiry.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Dashboard Dialog */}
      <Dialog open={showProgressDashboard} onOpenChange={setShowProgressDashboard}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enquiry Progress Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Selected Enquiries Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Selected Enquiries ({selectedEnquiries.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedEnquiries.map(enquiryId => {
                  const enquiry = enquiries.find((e: any) => e.id === enquiryId);
                  return enquiry ? (
                    <Badge key={enquiryId} variant="outline" className="bg-white">
                      {enquiry.enquiryNumber}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries.find((e: any) => e.id === id);
                          return enquiry?.status === "New";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">New Enquiries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries.find((e: any) => e.id === id);
                          return enquiry?.status === "Quoted";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">Quoted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {selectedEnquiries.filter(id => {
                          const enquiry = enquiries.find((e: any) => e.id === id);
                          return enquiry?.status === "Closed";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">Closed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Progress Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedEnquiries.map(enquiryId => {
                    const enquiry = enquiries.find((e: any) => e.id === enquiryId);
                    if (!enquiry) return null;
                    
                    return (
                      <div key={enquiryId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{enquiry.enquiryNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {enquiry.customer?.name || "Unknown Customer"}
                            </p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(enquiry.status)}>
                            {enquiry.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Source:</span>
                            <span className="ml-2">{enquiry.source}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-2">{formatDate(enquiry.enquiryDate)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Target Delivery:</span>
                            <span className="ml-2">
                              {enquiry.targetDeliveryDate ? formatDate(enquiry.targetDeliveryDate) : "Not set"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Progress:</span>
                            <span className="ml-2">
                              {enquiry.status === "New" ? "0%" : 
                               enquiry.status === "In Progress" ? "25%" :
                               enquiry.status === "Quoted" ? "50%" :
                               enquiry.status === "Closed" ? "100%" : "0%"}
                            </span>
                          </div>
                        </div>
                        
                        {enquiry.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <span className="text-gray-500 text-sm">Notes:</span>
                            <p className="text-sm text-gray-700 mt-1">{enquiry.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
