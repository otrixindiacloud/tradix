import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, FileText, Package, Paperclip, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EnquiryItemsManager from "@/components/enquiry/enquiry-items-manager";
import AttachmentManager from "@/components/enquiry/attachment-manager";
import { formatDate, getStatusColor } from "@/lib/utils";
import { SYSTEM_USER_ID } from "@shared/utils/uuid";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EnquiryDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ["/api/enquiries", id],
    queryFn: async () => {
      const response = await fetch(`/api/enquiries/${id}`);
      if (!response.ok) throw new Error("Enquiry not found");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: customer } = useQuery({
    queryKey: ["/api/customers", enquiry?.customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${enquiry.customerId}`);
      return response.json();
    },
    enabled: !!enquiry?.customerId,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PUT", `/api/enquiries/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries"] });
      toast({
        title: "Success",
        description: "Enquiry status updated successfully",
      });
      setShowStatusDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update enquiry status",
        variant: "destructive",
      });
    },
  });

  const deleteEnquiry = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/enquiries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Enquiry deleted successfully",
      });
      navigate("/enquiries");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete enquiry",
        variant: "destructive",
      });
    },
  });

  const updateAttachments = useMutation({
    mutationFn: async (attachments: any[]) => {
      const response = await apiRequest("PUT", `/api/enquiries/${id}`, { attachments });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries", id] });
      toast({
        title: "Success",
        description: "Attachments updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attachments",
        variant: "destructive",
      });
    },
  });

  const convertToQuotation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quotations/generate/${id}`, { userId: SYSTEM_USER_ID });
      return response.json();
    },
    onSuccess: (quotation) => {
      toast({
        title: "Success", 
        description: "Quotation created successfully from enquiry",
      });
      setShowConvertDialog(false);
      navigate(`/quotations/${quotation.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert enquiry to quotation",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = () => {
    if (newStatus) {
      updateStatus.mutate(newStatus);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "New":
        return <AlertCircle className="h-4 w-4" />;
      case "In Progress":
        return <Clock className="h-4 w-4" />;
      case "Quoted":
        return <FileText className="h-4 w-4" />;
      case "Closed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading enquiry details...</p>
        </div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Enquiry not found</h2>
        <p className="text-muted-foreground mb-4">The enquiry you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/enquiries")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Enquiries
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/enquiries")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-enquiry-number">
              {enquiry.enquiryNumber}
            </h1>
            <p className="text-muted-foreground">
              Created on {formatDate(enquiry.enquiryDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-change-status">
                Change Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Enquiry Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatus.isPending}
                    data-testid="button-update-status"
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="default"
            onClick={() => setShowConvertDialog(true)}
            disabled={enquiry.status === "Quoted" || enquiry.status === "Closed"}
            data-testid="button-convert-to-quotation"
          >
            <FileText className="h-4 w-4 mr-2" />
            Convert to Quotation
          </Button>

          <Button variant="outline" data-testid="button-edit">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="destructive"
            onClick={() => deleteEnquiry.mutate()}
            disabled={deleteEnquiry.isPending}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(enquiry.status)}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className={getStatusColor(enquiry.status)} data-testid="badge-status">
                  {enquiry.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="font-medium" data-testid="text-source">{enquiry.source}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium" data-testid="text-customer-name">
                {customer?.name || "Loading..."}
              </p>
              {customer && (
                <p className="text-sm text-muted-foreground">
                  {customer.customerType}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Target Delivery</p>
              <p className="font-medium" data-testid="text-target-delivery">
                {enquiry.targetDeliveryDate ? formatDate(enquiry.targetDeliveryDate) : "Not specified"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enquiry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Enquiry Number:</span>
                      <p className="font-mono">{enquiry.enquiryNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Date Created:</span>
                      <p>{formatDate(enquiry.enquiryDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Source:</span>
                      <p>{enquiry.source}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <p>{customer?.name || "Loading..."}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <p>{customer?.customerType || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <p>{customer?.email || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <p>{customer?.phone || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {enquiry.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded-md" data-testid="text-notes">
                      {enquiry.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <EnquiryItemsManager enquiryId={enquiry.id} />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentManager
            attachments={enquiry.attachments || []}
            onAttachmentsChange={(attachments) => {
              updateAttachments.mutate(attachments);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Convert to Quotation Confirmation Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Enquiry to Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new quotation based on this enquiry. Pricing will be calculated automatically based on the customer type and markup rules. The enquiry status will be updated to "Quoted".
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => convertToQuotation.mutate()}
              disabled={convertToQuotation.isPending}
            >
              {convertToQuotation.isPending ? "Converting..." : "Convert to Quotation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}