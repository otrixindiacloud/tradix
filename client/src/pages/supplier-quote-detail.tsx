import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Star,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusPill from "@/components/status/status-pill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface SupplierQuote {
  id: string;
  quoteNumber: string;
  supplierId: string;
  supplierName: string;
  requisitionId?: string;
  requisitionNumber?: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Pending" | "Draft" | "Sent" | "Received" | "Under Review" | "Approved" | "Rejected" | "Accepted" | "Expired";
  requestDate: string;
  responseDate?: string;
  validUntil: string;
  totalAmount: string;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes?: string;
  attachments?: string[];
  score?: number;
  rank?: number;
  itemCount: number;
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
  specifications?: string;
  leadTime?: string;
  warranty?: string;
}

export default function SupplierQuoteDetailPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<SupplierQuote | null>(null);
  // Handle edit button click
  const handleEditClick = () => {
    setEditForm(quote ? { ...quote } : null);
    setShowEditDialog(true);
  };

  // Handle form field change
  const handleEditChange = (field: keyof SupplierQuote, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  // Handle save
  const handleEditSave = () => {
    // Here you would call API to save changes
    toast({
      title: "Success",
      description: "Supplier quote updated (mock)",
    });
    setShowEditDialog(false);
  };

  const quoteId = params.id;

  // Mock data for development - matching IDs from supplier-quotes.tsx
  const mockQuotes: { [key: string]: SupplierQuote } = {
    "sq-001": {
      id: "sq-001",
      quoteNumber: "SQ-2024-001",
      supplierId: "sup-001",
      supplierName: "Tech Solutions LLC",
      requisitionId: "req-001",
      requisitionNumber: "REQ-2024-001",
      priority: "High",
      status: "Received",
      requestDate: "2024-01-15",
      responseDate: "2024-01-17",
      validUntil: "2024-02-15",
      totalAmount: "5200.00",
      currency: "BHD",
      paymentTerms: "Net 30",
      deliveryTerms: "FOB Destination",
      notes: "Special discount for bulk order. Installation service included.",
      score: 8.5,
      rank: 2,
      itemCount: 3,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-17T14:30:00Z"
    },
    "sq-002": {
      id: "sq-002",
      quoteNumber: "SQ-2024-002",
      supplierId: "sup-002",
      supplierName: "Office Supplies Co",
      requisitionId: "req-002",
      requisitionNumber: "REQ-2024-002",
      priority: "Medium",
      status: "Under Review",
      requestDate: "2024-01-14",
      responseDate: "2024-01-16",
      validUntil: "2024-02-14",
      totalAmount: "2100.00",
      currency: "BHD",
      paymentTerms: "Net 15",
      deliveryTerms: "CIF",
      score: 9.2,
      rank: 1,
      itemCount: 5,
      createdAt: "2024-01-14T09:30:00Z",
      updatedAt: "2024-01-16T11:20:00Z"
    },
    "sq-003": {
      id: "sq-003",
      quoteNumber: "SQ-2024-003",
      supplierId: "sup-003",
      supplierName: "Industrial Equipment Ltd",
      requisitionId: "req-003",
      requisitionNumber: "REQ-2024-003",
      priority: "Urgent",
      status: "Pending",
      requestDate: "2024-01-18",
      responseDate: undefined,
      validUntil: "2024-02-18",
      totalAmount: "0.00",
      currency: "BHD",
      paymentTerms: "Net 45",
      deliveryTerms: "EXW",
      score: undefined,
      rank: undefined,
      itemCount: 0,
      createdAt: "2024-01-18T08:00:00Z",
      updatedAt: "2024-01-18T08:00:00Z"
    }
  };

  const mockItems: { [key: string]: SupplierQuoteItem[] } = {
    "sq-001": [
      {
        id: "item-001",
        quoteId: "sq-001",
        itemDescription: "Dell PowerEdge R750 Server",
        quantity: 2,
        unitPrice: "2400.00",
        totalPrice: "4800.00",
        unitOfMeasure: "Units",
        specifications: "32GB RAM, 2TB SSD, Dual processors",
        leadTime: "10-12 working days",
        warranty: "3 years on-site"
      },
      {
        id: "item-002",
        quoteId: "sq-001",
        itemDescription: "Network Switch 48-port",
        quantity: 1,
        unitPrice: "400.00",
        totalPrice: "400.00",
        unitOfMeasure: "Unit",
        specifications: "Gigabit Ethernet, managed switch",
        leadTime: "5-7 working days",
        warranty: "2 years"
      }
    ],
    "sq-002": [
      {
        id: "item-003",
        quoteId: "sq-002",
        itemDescription: "Office Desk - Executive",
        quantity: 3,
        unitPrice: "280.00",
        totalPrice: "840.00",
        unitOfMeasure: "Units",
        specifications: "L-shaped, oak finish, 160cm",
        leadTime: "3-5 working days",
        warranty: "1 year"
      },
      {
        id: "item-004",
        quoteId: "sq-002",
        itemDescription: "Ergonomic Office Chair",
        quantity: 3,
        unitPrice: "220.00",
        totalPrice: "660.00",
        unitOfMeasure: "Units",
        specifications: "Mesh back, adjustable height",
        leadTime: "2-3 working days",
        warranty: "2 years"
      },
      {
        id: "item-005",
        quoteId: "sq-002",
        itemDescription: "Monitor Stand - Adjustable",
        quantity: 3,
        unitPrice: "85.00",
        totalPrice: "255.00",
        unitOfMeasure: "Units",
        specifications: "Height adjustable, 13-27 inch monitors",
        leadTime: "2-3 working days",
        warranty: "1 year"
      },
      {
        id: "item-006",
        quoteId: "sq-002",
        itemDescription: "Desk Lamp - LED",
        quantity: 3,
        unitPrice: "45.00",
        totalPrice: "135.00",
        unitOfMeasure: "Units",
        specifications: "USB charging port, adjustable brightness",
        leadTime: "1-2 working days",
        warranty: "2 years"
      },
      {
        id: "item-007",
        quoteId: "sq-002",
        itemDescription: "Cable Management Tray",
        quantity: 3,
        unitPrice: "25.00",
        totalPrice: "75.00",
        unitOfMeasure: "Units",
        specifications: "Under-desk mounting, mesh design",
        leadTime: "1-2 working days",
        warranty: "1 year"
      }
    ],
    "sq-003": []
  };

  // Use mock data instead of API calls
  const quote = mockQuotes[quoteId || ""] || null;
  const items = mockItems[quoteId || ""] || [];

  // Debug logging for development
  console.log("Debug - Quote ID from URL:", quoteId);
  console.log("Debug - Available quote IDs:", Object.keys(mockQuotes));
  console.log("Debug - Found quote:", quote ? "Yes" : "No");
  if (quote) {
    console.log("Debug - Quote details:", quote.quoteNumber, quote.supplierName);
  }

  const handleDelete = () => {
    toast({
      title: "Success",
      description: "Supplier quote deleted successfully (mock)",
    });
    navigate("/supplier-quotes");
    setShowDeleteDialog(false);
  };

  const handleApprove = () => {
    toast({
      title: "Success",
      description: "Supplier quote approved (mock)",
    });
  };

  const handleReject = () => {
    toast({
      title: "Success",
      description: "Supplier quote rejected (mock)",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "bg-red-500 text-white border-red-600";
      case "High": return "bg-orange-500 text-white border-orange-600";
      case "Medium": return "bg-yellow-500 text-white border-yellow-600";
      case "Low": return "bg-green-500 text-white border-green-600";
      default: return "bg-gray-500 text-white border-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-yellow-600";
    return "text-red-600";
  };

  if (!quote) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Supplier Quote Not Found</h2>
          <p className="text-gray-600 mt-2">The supplier quote you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate("/supplier-quotes")}
            className="group flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 border border-gray-200 mt-4"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-sm font-bold">Back to Supplier Quotes</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate("/supplier-quotes")}
            className="group flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-sm font-bold">Back to Supplier Quotes</div>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {quote.quoteNumber}
            </h1>
            <p className="text-gray-600">
              From {quote.supplierName}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {quote.status === "Under Review" && (
            <>
              <Button 
                variant="outline"
                onClick={handleApprove}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="outline"
                onClick={handleReject}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          <Button 
            variant="outline"
            onClick={handleEditClick}
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Status</p>
                <StatusPill status={quote.status} />
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
                <p className="text-sm font-bold text-black">Priority</p>
                <Badge className={getPriorityColor(quote.priority)}>
                  {quote.priority}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Total Amount</p>
                <p className="font-semibold">{quote.currency} {quote.totalAmount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Score</p>
                <p className={`font-semibold ${getScoreColor(quote.score || 0)}`}>
                  {quote.score}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Rank</p>
                <p className="font-semibold">#{quote.rank}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Information */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier</label>
                <p className="mt-1">{quote.supplierName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Requisition</label>
                <p className="mt-1">{quote.requisitionNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Request Date</label>
                <p className="mt-1">{formatDate(new Date(quote.requestDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Response Date</label>
                <p className="mt-1">
                  {quote.responseDate ? formatDate(new Date(quote.responseDate), 'MMM dd, yyyy') : 'Pending'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valid Until</label>
                <p className="mt-1">{formatDate(new Date(quote.validUntil), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Currency</label>
                <p className="mt-1">{quote.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Terms</label>
              <p className="mt-1 text-gray-900">{quote.paymentTerms}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Terms</label>
              <p className="mt-1 text-gray-900">{quote.deliveryTerms}</p>
            </div>
            {quote.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="mt-1 text-gray-900">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Unit Price</th>
                  <th className="text-left p-2">Total Price</th>
                  <th className="text-left p-2">Lead Time</th>
                  <th className="text-left p-2">Warranty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{item.itemDescription}</p>
                        {item.specifications && (
                          <p className="text-sm text-gray-500">{item.specifications}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{item.quantity} {item.unitOfMeasure}</td>
                    <td className="p-2">{quote.currency} {item.unitPrice}</td>
                    <td className="p-2 font-medium">{quote.currency} {item.totalPrice}</td>
                    <td className="p-2">{item.leadTime || '-'}</td>
                    <td className="p-2">{item.warranty || '-'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td colSpan={3} className="p-2 text-right">Total Amount:</td>
                  <td className="p-2">{quote.currency} {quote.totalAmount}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {/* Edit Supplier Quote Modal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Supplier Quote</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                <Input
                  value={editForm.supplierName}
                  onChange={e => handleEditChange("supplierName", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="w-full border rounded p-2"
                    value={editForm.priority}
                    onChange={e => handleEditChange("priority", e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="w-full border rounded p-2"
                    value={editForm.status}
                    onChange={e => handleEditChange("status", e.target.value)}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Received">Received</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <Input
                    type="number"
                    value={editForm.totalAmount}
                    onChange={e => handleEditChange("totalAmount", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <Input
                    value={editForm.currency}
                    onChange={e => handleEditChange("currency", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                <Input
                  value={editForm.paymentTerms}
                  onChange={e => handleEditChange("paymentTerms", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Terms</label>
                <Input
                  value={editForm.deliveryTerms}
                  onChange={e => handleEditChange("deliveryTerms", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <Textarea
                  value={editForm.notes || ""}
                  onChange={e => handleEditChange("notes", e.target.value)}
                />
              </div>
            </form>
          )}
          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="border-red-500 text-red-600 hover:bg-red-50 bg-transparent"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}