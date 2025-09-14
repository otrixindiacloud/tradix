import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatDate } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Send, 
  Check, 
  X, 
  Clock,
  AlertTriangle,
  DollarSign,
  Calculator,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Copy,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // retained for other uses
import StatusPill from "@/components/status/status-pill";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SYSTEM_USER_ID } from "@shared/utils/uuid";
import { useUserId } from "@/hooks/useUserId";
import { Link } from "wouter";
import QuotationItemsManager from "@/components/quotation/quotation-items-manager";

interface Quotation {
  id: string;
  quoteNumber: string;
  revision: number;
  enquiryId: string;
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

interface QuotationItem {
  id: string;
  quotationId: string;
  supplierCode: string;
  barcode: string;
  description: string;
  quantity: number;
  costPrice: string;
  markup: string;
  unitPrice: string;
  lineTotal: string;
  isAccepted: boolean;
  rejectionReason: string;
  notes: string;
}

import { useParams, useLocation } from "wouter";
// ...existing code...
export default function QuotationDetailPage() {
  const userId = useUserId();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
// ...existing code...
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["/api/quotations", id],
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${id}`);
      if (!response.ok) throw new Error("Failed to fetch quotation");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: quotationItems } = useQuery({
    queryKey: ["/api/quotations", id, "items"],
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${id}/items`);
      if (!response.ok) throw new Error("Failed to fetch quotation items");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: quotationRevisions } = useQuery({
    queryKey: ["/api/quotations", id, "revisions"],
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${id}/revisions`);
      if (!response.ok) throw new Error("Failed to fetch quotation revisions");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: quotationHistory } = useQuery({
    queryKey: ["/api/quotations", id, "history"],
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${id}/history`);
      if (!response.ok) throw new Error("Failed to fetch quotation history");
      return response.json();
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update quotation status");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation status",
        variant: "destructive",
      });
    },
  });

  const createRevisionMutation = useMutation({
    mutationFn: async (revisionData: { revisionReason: string }) => {
      const response = await fetch(`/api/quotations/${id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...revisionData, userId }),
      });
      if (!response.ok) throw new Error("Failed to create quotation revision");
      return response.json();
    },
    onSuccess: (newRevision) => {
      toast({
        title: "Success",
        description: `Revision ${newRevision.revision} created successfully`,
      });
      setShowRevisionDialog(false);
      setRevisionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      // Navigate to the new revision
      navigate(`/quotations/${newRevision.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation revision",
        variant: "destructive",
      });
    },
  });

  const handleCreateRevision = () => {
    if (!revisionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for creating this revision",
        variant: "destructive",
      });
      return;
    }
    createRevisionMutation.mutate({ revisionReason });
  };

  if (isLoading || !quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading quotation details...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft": return <Clock className="h-4 w-4" />;
      case "Sent": return <FileText className="h-4 w-4" />;
      case "Accepted": return <Check className="h-4 w-4" />;
      case "Rejected": return <X className="h-4 w-4" />;
      case "Expired": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "text-gray-700";
      case "Sent": return "text-blue-700";
      case "Accepted": return "text-green-700";
      case "Rejected": return "text-red-700";
      case "Expired": return "text-orange-700";
      default: return "text-gray-700";
    }
  };

  // Returns Tailwind classes for badge background and text color
  const getApprovalStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Pending": return "bg-white text-white border border-gray-300";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const canUpdateStatus = (newStatus: string) => {
    if (quotation.approvalStatus === "Pending" && newStatus === "Sent") {
      return false; // Cannot send quote pending approval
    }
    return true;
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/quotations/${id}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotation.quoteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Quotation PDF downloaded successfully",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotations">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="quotation-title">
              {quotation.quoteNumber}
              {quotation.revision > 1 && (
                <span className="text-lg text-gray-600 ml-2">
                  (Revision {quotation.revision})
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Created on {formatDate(new Date(quotation.createdAt), "MMMM dd, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusPill status={quotation.status.toLowerCase()} />
          {quotation.approvalStatus && (
            <StatusPill status={quotation.approvalStatus.toLowerCase()} />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          data-testid="button-edit"
          onClick={() => setShowEditDialog(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" data-testid="button-download" onClick={downloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline" data-testid="button-create-revision" onClick={() => setShowRevisionDialog(true)}>
          <Copy className="h-4 w-4 mr-2" />
          Create Revision
        </Button>
        {quotation.status === "Draft" && quotation.approvalStatus !== "Pending" && (
          <Button 
            onClick={() => updateStatusMutation.mutate("Sent")}
            disabled={updateStatusMutation.isPending}
            data-testid="button-send"
            className="bg-gray-700 text-white hover:bg-gray-800"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to Customer
          </Button>
        )}
        {quotation.status === "Sent" && (
          <div className="flex gap-2">
            <Link href={`/quotations/${id}/acceptance`}>
              <Button variant="default" data-testid="button-customer-acceptance">
                <FileText className="h-4 w-4 mr-2" />
                Customer Acceptance
              </Button>
            </Link>
            <Button 
              onClick={() => updateStatusMutation.mutate("Accepted")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-accept"
              className="bg-green-700 text-white hover:bg-green-800"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark Accepted
            </Button>
            <Button 
              variant="outline"
              onClick={() => updateStatusMutation.mutate("Rejected")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-reject"
              className="border-red-700 text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Mark Rejected
            </Button>
          </div>
        )}
      </div>

      {/* Warning for Pending Approval */}
      {quotation.approvalStatus === "Pending" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-medium">Approval Required</div>
                <div className="text-sm">
                  This quotation requires approval from: {quotation.requiredApprovalLevel}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({quotationItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="revisions">Revisions ({quotationRevisions?.length || 1})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer ID</label>
                      <div className="font-medium">{quotation.customerId}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Type</label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{quotation.customerType}</Badge>
                        <span className="text-sm text-gray-600">
                          ({quotation.customerType === "Retail" ? "70%" : "40%"} markup)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quote Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Quote Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quote Date</label>
                      <div className="font-medium">
                        {formatDate(new Date(quotation.quoteDate || quotation.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Valid Until</label>
                      <div className="font-medium">
                        {formatDate(new Date(quotation.validUntil), "MMM dd, yyyy")}
                        {new Date(quotation.validUntil) < new Date() && (
                          <span className="text-red-600 text-sm ml-2">(Expired)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {quotation.terms && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Terms & Conditions</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                        {quotation.terms}
                      </div>
                    </div>
                  )}
                  
                  {quotation.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                        {quotation.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pricing Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Pricing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{parseFloat(quotation.subtotal || "0").toFixed(2)}</span>
                    </div>
                    
                    {parseFloat(quotation.discountPercentage || "0") > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Discount ({quotation.discountPercentage}%):</span>
                        <span className="text-green-600">
                          -{parseFloat(quotation.discountAmount || "0").toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>{parseFloat(quotation.taxAmount || "0").toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        ${parseFloat(quotation.totalAmount || "0").toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto text-gray-600 mb-1" />
                      <div className="text-sm text-gray-800 font-medium">
                        {quotation.customerType} Pricing Applied
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <QuotationItemsManager 
            quotationId={id!}
            customerType={quotation.customerType}
            editable={quotation.status === "Draft"}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Current Status</div>
                    <div className="text-sm text-gray-600">
                      {quotation.requiredApprovalLevel ? 
                        `Requires approval from: ${quotation.requiredApprovalLevel}` :
                        "No approval required"
                      }
                    </div>
                  </div>
                  <Badge className={getApprovalStatusBadgeClass(quotation.approvalStatus)}>
                    {quotation.approvalStatus || "None"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotationRevisions?.map((revision: any) => (
                  <div
                    key={revision.id}
                    className={`p-4 border rounded-lg ${
                      revision.id === quotation.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          Revision {revision.revision}
                          {revision.id === quotation.id && (
                            <Badge variant="outline" className="ml-2">Current</Badge>
                          )}
                          {revision.isSuperseded && (
                            <Badge variant="secondary" className="ml-2">Superseded</Badge>
                          )}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(new Date(revision.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                    {revision.revisionReason && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {revision.revisionReason}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span>Status: <Badge variant="outline">{revision.status}</Badge></span>
                        <span>Total: <strong>{revision.totalAmount}</strong></span>
                      </div>
                      {revision.id !== quotation.id && (
                        <Link href={`/quotations/${revision.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotationHistory?.map((event: any, index: number) => {
                  const getEventColor = (action: string) => {
                    switch (action) {
                      case 'create': return 'border-green-500 bg-green-50';
                      case 'create_revision': return 'border-blue-500 bg-blue-50';
                      case 'update': return 'border-yellow-500 bg-yellow-50';
                      case 'supersede': return 'border-orange-500 bg-orange-50';
                      case 'approve': return 'border-green-500 bg-green-50';
                      case 'reject': return 'border-red-500 bg-red-50';
                      default: return 'border-gray-500 bg-gray-50';
                    }
                  };

                  const getEventTitle = (action: string) => {
                    switch (action) {
                      case 'create': return 'Quotation Created';
                      case 'create_revision': return 'Revision Created';
                      case 'update': return 'Quotation Updated';
                      case 'supersede': return 'Quotation Superseded';
                      case 'approve': return 'Quotation Approved';
                      case 'reject': return 'Quotation Rejected';
                      default: return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                  };

                  return (
                    <div key={`${event.id}-${index}`} className={`flex items-center gap-3 p-3 border-l-4 ${getEventColor(event.action).replace('bg-blue-50', 'bg-gray-50')}`}> 
                      <Calendar className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{getEventTitle(event.action)}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(new Date(event.timestamp), "MMM dd, yyyy 'at' h:mm a")}
                        </div>
                        {event.comments && (
                          <div className="text-sm text-gray-700 mt-1">
                            <strong>Comments:</strong> {event.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!quotationHistory || quotationHistory.length === 0) && (
                  <div className="flex items-center gap-3 p-3 border-l-4 border-gray-500 bg-gray-50">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="font-medium">Quotation Created</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(new Date(quotation.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Revision Dialog */}
      {showRevisionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Quotation Revision</h3>
            <p className="text-sm text-gray-600 mb-4">
              Creating a revision will supersede the current quotation and create a new version that can be modified.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Revision <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="Explain why this revision is needed..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRevisionDialog(false);
                  setRevisionReason("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRevision}
                disabled={createRevisionMutation.isPending || !revisionReason.trim()}
              >
                {createRevisionMutation.isPending ? "Creating..." : "Create Revision"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quotation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              For comprehensive quotation editing, you can:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Create a revision to modify terms, pricing, or items</li>
              <li>Update the quotation status using the action buttons</li>
              <li>Edit individual items in the Items tab</li>
              <li>Add notes or modify terms directly</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use "Create Revision" for major changes that need customer approval, 
                or directly modify items and terms for minor updates.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowEditDialog(false);
                  setShowRevisionDialog(true);
                }}
              >
                Create Revision
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}