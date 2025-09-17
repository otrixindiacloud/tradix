import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { formatDate } from "date-fns";
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Package,
  FileText,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusPill from "@/components/status/status-pill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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

export default function RequisitionDetailPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const requisitionId = params.id;

  // Mock data for development
  const mockRequisitions: { [key: string]: Requisition } = {
    "req-001": {
      id: "req-001",
      requisitionNumber: "REQ-2024-001",
      requestedBy: "John Smith",
      department: "IT",
      priority: "High",
      status: "Pending Approval",
      requestDate: "2024-01-15",
      requiredDate: "2024-01-25",
      totalEstimatedCost: "5500.00",
      justification: "Replacement for outdated servers to improve system performance and reliability",
      notes: "Please prioritize this request as current servers are experiencing frequent downtime",
      itemCount: 3,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    "req-002": {
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
      justification: "Office furniture for new employees joining next month",
      notes: "Coordinate delivery with facilities team",
      itemCount: 5,
      createdAt: "2024-01-14T09:30:00Z",
      updatedAt: "2024-01-15T14:20:00Z"
    },
    "req-003": {
      id: "req-003",
      requisitionNumber: "REQ-2024-003",
      requestedBy: "David Brown",
      department: "Finance",
      priority: "Low",
      status: "Draft",
      requestDate: "2024-01-16",
      requiredDate: "2024-02-01",
      totalEstimatedCost: "850.00",
      justification: "Accounting software licenses for annual renewal",
      itemCount: 2,
      createdAt: "2024-01-16T11:15:00Z",
      updatedAt: "2024-01-16T11:15:00Z"
    }
  };

  const mockItems: { [key: string]: RequisitionItem[] } = {
    "req-001": [
      {
        id: "item-001",
        requisitionId: "req-001",
        itemDescription: "Dell PowerEdge R750 Server",
        quantity: 2,
        unitOfMeasure: "Units",
        estimatedCost: "2500.00",
        specification: "32GB RAM, 2TB SSD, Dual processors",
        preferredSupplier: "Dell Technologies",
        urgency: "Urgent"
      },
      {
        id: "item-002",
        requisitionId: "req-001",
        itemDescription: "Network Switch 48-port",
        quantity: 1,
        unitOfMeasure: "Unit",
        estimatedCost: "500.00",
        specification: "Gigabit Ethernet, managed switch",
        preferredSupplier: "Cisco",
        urgency: "Standard"
      }
    ],
    "req-002": [
      {
        id: "item-003",
        requisitionId: "req-002",
        itemDescription: "Office Desk - Executive",
        quantity: 3,
        unitOfMeasure: "Units",
        estimatedCost: "300.00",
        specification: "L-shaped, oak finish, 160cm",
        preferredSupplier: "Office Depot",
        urgency: "Standard"
      },
      {
        id: "item-004",
        requisitionId: "req-002",
        itemDescription: "Ergonomic Office Chair",
        quantity: 3,
        unitOfMeasure: "Units",
        estimatedCost: "250.00",
        specification: "Mesh back, adjustable height",
        preferredSupplier: "Herman Miller",
        urgency: "Standard"
      }
    ]
  };

  // Use mock data instead of API calls
  const requisition = mockRequisitions[requisitionId || ""] || null;
  const items = mockItems[requisitionId || ""] || [];
  const isLoading = false;

  // Mock delete mutation
  const deleteMutation = {
    mutate: () => {
      toast({
        title: "Success",
        description: "Requisition deleted successfully (mock)",
      });
      navigate("/requisitions");
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "bg-red-100 text-red-700 border-red-200";
      case "High": return "bg-orange-100 text-white border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Requisition Not Found</h2>
          <p className="text-gray-600 mt-2">The requisition you're looking for doesn't exist.</p>
          <Button 
            onClick={() => navigate("/requisitions")} 
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requisitions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/requisitions")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requisitions
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {requisition.requisitionNumber}
            </h1>
            <p className="text-gray-600">
              Requested by {requisition.requestedBy}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/requisitions?edit=${requisitionId}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-base text-gray-600 font-bold">Status</p>
                <StatusPill status={requisition.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-base text-gray-600 font-bold">Priority</p>
                <Badge className={getPriorityColor(requisition.priority)}>
                  {requisition.priority}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-base text-gray-600 font-bold">Items</p>
                <p className="font-semibold">{requisition.itemCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-base text-gray-600 font-bold">Estimated Cost</p>
                <p className="font-semibold">{requisition.totalEstimatedCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Requested By</label>
                <p className="mt-1">{requisition.requestedBy}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="mt-1">{requisition.department}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Request Date</label>
                <p className="mt-1">{formatDate(new Date(requisition.requestDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Required Date</label>
                <p className="mt-1">{formatDate(new Date(requisition.requiredDate), 'MMM dd, yyyy')}</p>
              </div>
              {requisition.approvedBy && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved By</label>
                    <p className="mt-1">{requisition.approvedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved Date</label>
                    <p className="mt-1">
                      {requisition.approvedDate ? formatDate(new Date(requisition.approvedDate), 'MMM dd, yyyy') : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Justification & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Justification & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Justification</label>
              <p className="mt-1 text-gray-900">{requisition.justification}</p>
            </div>
            {requisition.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                <p className="mt-1 text-gray-900">{requisition.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Requisition Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Unit</th>
                  <th className="text-left p-2">Estimated Cost</th>
                  <th className="text-left p-2">Urgency</th>
                  <th className="text-left p-2">Preferred Supplier</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{item.itemDescription}</p>
                        {item.specification && (
                          <p className="text-sm text-gray-500">{item.specification}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{item.unitOfMeasure}</td>
                    <td className="p-2">{item.estimatedCost}</td>
                    <td className="p-2">
                      <Badge variant={item.urgency === "Urgent" ? "destructive" : "secondary"}>
                        {item.urgency}
                      </Badge>
                    </td>
                    <td className="p-2">{item.preferredSupplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this requisition? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}