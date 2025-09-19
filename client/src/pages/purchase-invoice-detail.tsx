import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { formatDate } from "date-fns";
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  CreditCard,
  FileText,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Receipt,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusPill from "@/components/status/status-pill";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  goodsReceiptId?: string;
  goodsReceiptNumber?: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Paid" | "Partially Paid" | "Overdue" | "Disputed" | "Cancelled";
  paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Overdue";
  invoiceDate: string;
  dueDate: string;
  receivedDate?: string;
  paymentDate?: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  currency: "BHD" | "AED" | "EUR" | "GBP";
  paymentTerms: string;
  paymentMethod?: "Bank Transfer" | "Cheque" | "Cash" | "Credit Card" | "Letter of Credit";
  bankReference?: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  attachments: Array<string | { url: string; name?: string }>;
  itemCount: number;
  isRecurring: boolean;
  nextInvoiceDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseInvoiceItem {
  id: string;
  invoiceId: string;
  itemDescription: string;
  supplierCode: string;
  barcode?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  unitOfMeasure: string;
  taxRate: string;
  discountRate: string;
  discountAmount: string;
  taxAmount: string;
  goodsReceiptItemId?: string;
  notes?: string;
}

type PaymentEntry = {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: string;
  paymentMethod: "Bank Transfer" | "Cheque" | "Cash" | "Credit Card" | "Letter of Credit";
  reference: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

export default function PurchaseInvoiceDetailPage() {
  // Handles viewing an attachment (opens in new tab or downloads)
  const handleViewAttachment = (attachment: { url: string; name?: string }) => {
    if (attachment?.url) {
      window.open(attachment.url, '_blank');
    }
  };
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

  // Ensure editingInvoice is always initialized with latest invoice data when opening edit dialog
  const handleOpenEditDialog = () => {
    if (invoice) {
      setEditingInvoice({ ...invoice });
      setShowEditDialog(true);
    }
  };
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Bank Transfer" | "Cheque" | "Cash" | "Credit Card" | "Letter of Credit">("Bank Transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  
  const { toast } = useToast();

  // Download PDF handler (mock implementation)
  // Print Invoice handler (mock implementation)
  const handlePrint = () => {
    // For now, just trigger browser print dialog
    window.print();
    toast({
      title: "Print Started",
      description: "Invoice print dialog opened.",
    });
  };
  const handleDownloadPDF = () => {
    if (!invoice || !invoice.attachments || invoice.attachments.length === 0) {
      toast({
        title: "No PDF Available",
        description: "No invoice PDF found for download.",
        variant: "destructive",
      });
      return;
    }
    // Find the first PDF attachment
    const pdfAttachment = invoice.attachments.find(att => {
      if (typeof att === 'string') return att.endsWith('.pdf');
      if (att && typeof att === 'object' && att.url) return att.url.endsWith('.pdf');
      return false;
    });
    if (!pdfAttachment) {
      toast({
        title: "No PDF Available",
        description: "No invoice PDF found for download.",
        variant: "destructive",
      });
      return;
    }
    let url = '';
    let filename = '';
    if (typeof pdfAttachment === 'string') {
      url = `/files/${pdfAttachment}`;
      filename = pdfAttachment;
    } else if (pdfAttachment && typeof pdfAttachment === 'object') {
      url = pdfAttachment.url;
      filename = pdfAttachment.name || pdfAttachment.url.split('/').pop() || 'invoice.pdf';
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: "Download Started",
      description: `Invoice PDF (${filename}) download started.`,
    });
  };
  const queryClient = useQueryClient();

  // Mock data for the selected invoice - replace with actual API call
  const mockInvoice: PurchaseInvoice = {
    id: id || "pi-001",
    invoiceNumber: "PI-2024-001",
    supplierInvoiceNumber: "SUP-INV-001",
    supplierId: "sup-001",
    supplierName: "Tech Solutions LLC",
    supplierEmail: "billing@techsolutions.com",
    supplierPhone: "+973 1234 5678",
    purchaseOrderId: "po-001",
    purchaseOrderNumber: "PO-2024-001",
    goodsReceiptId: "gr-001",
    goodsReceiptNumber: "GR-2024-001",
    status: "Approved",
    paymentStatus: "Partially Paid",
    invoiceDate: "2024-01-15",
    dueDate: "2024-02-14",
    receivedDate: "2024-01-17",
    paymentDate: "2024-01-20",
    subtotal: "5000.00",
    taxAmount: "250.00",
    discountAmount: "100.00",
    totalAmount: "5150.00",
    paidAmount: "2000.00",
    remainingAmount: "3150.00",
    currency: "BHD",
    paymentTerms: "Net 30",
    paymentMethod: "Bank Transfer",
    bankReference: "TXN-789456123",
    approvedBy: "John Smith",
    approvalDate: "2024-01-18",
    notes: "Hardware procurement invoice for Q1 2024",
    attachments: ["invoice.pdf", "delivery_note.pdf", "purchase_order.pdf"],
    itemCount: 3,
    isRecurring: false,
    createdAt: "2024-01-17T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z"
  };

  const mockInvoiceItems: PurchaseInvoiceItem[] = [
    {
      id: "item-001",
      invoiceId: id || "pi-001",
      itemDescription: "Dell Laptop OptiPlex 3090",
      supplierCode: "DELL-OPT-3090",
      barcode: "123456789012",
      quantity: 10,
      unitPrice: "450.00",
      totalPrice: "4500.00",
      unitOfMeasure: "PCS",
      taxRate: "5.00",
      discountRate: "2.00",
      discountAmount: "90.00",
      taxAmount: "225.00",
      goodsReceiptItemId: "gr-item-001",
      notes: "Latest model with SSD"
    },
    {
      id: "item-002",
      invoiceId: id || "pi-001",
      itemDescription: "Wireless Mouse Logitech MX",
      supplierCode: "LOGI-MX-001",
      barcode: "234567890123",
      quantity: 15,
      unitPrice: "25.00",
      totalPrice: "375.00",
      unitOfMeasure: "PCS",
      taxRate: "5.00",
      discountRate: "1.00",
      discountAmount: "3.75",
      taxAmount: "18.75",
      goodsReceiptItemId: "gr-item-002"
    },
    {
      id: "item-003",
      invoiceId: id || "pi-001",
      itemDescription: "Keyboard Mechanical RGB",
      supplierCode: "MECH-KB-RGB",
      barcode: "345678901234",
      quantity: 5,
      unitPrice: "85.00",
      totalPrice: "425.00",
      unitOfMeasure: "PCS",
      taxRate: "5.00",
      discountRate: "1.50",
      discountAmount: "6.38",
      taxAmount: "21.25",
      goodsReceiptItemId: "gr-item-003",
      notes: "Cherry MX switches"
    }
  ];

  const mockPaymentHistory: PaymentEntry[] = [
    {
      id: "pay-001",
      invoiceId: id || "pi-001",
      paymentDate: "2024-01-20",
      amount: "2000.00",
      paymentMethod: "Bank Transfer",
      reference: "TXN-789456123",
      notes: "Partial payment received",
      createdBy: "John Smith",
      createdAt: "2024-01-20T14:30:00Z"
    }
  ];

  const { data: invoice, isLoading } = useQuery<PurchaseInvoice>({
    queryKey: ["/api/purchase-invoices", id],
    queryFn: async () => {
      // Mock implementation - replace with actual API call
      return mockInvoice;
    },
  });

  const { data: invoiceItems = [] } = useQuery<PurchaseInvoiceItem[]>({
    queryKey: ["/api/purchase-invoices", id, "items"],
    queryFn: async () => {
      // Mock implementation - replace with actual API call
      return mockInvoiceItems;
    },
  });

  const { data: paymentHistory = [] } = useQuery<PaymentEntry[]>({
    queryKey: ["/api/purchase-invoices", id, "payments"],
    queryFn: async () => {
      // Mock implementation - replace with actual API call
      return mockPaymentHistory;
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async (data: Partial<PurchaseInvoice>) => {
      // Mock implementation - replace with actual API call
      const resp = await fetch(`/api/purchase-invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error('Failed to update invoice');
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices", id] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      setShowEditDialog(false);
      setEditingInvoice(null);
    },
  });

  const addPayment = useMutation({
    mutationFn: async (paymentData: { amount: string; method: string; reference: string; notes: string }) => {
      // Mock implementation - replace with actual API call
      const resp = await fetch(`/api/purchase-invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!resp.ok) throw new Error('Failed to add payment');
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices", id, "payments"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async () => {
      // Mock implementation - replace with actual API call
      const resp = await fetch(`/api/purchase-invoices/${id}`, {
        method: 'DELETE',
      });
      if (!resp.ok) throw new Error('Failed to delete invoice');
      return resp.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      navigate('/purchase-invoices');
    },
  });

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case "Draft": 
        return {
          variant: "outline" as const,
          className: "border-gray-500 text-gray-600 hover:bg-gray-50"
        };
      case "Pending Approval": 
        return {
          variant: "outline" as const,
          className: "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
        };
      case "Approved": 
        return {
          variant: "outline" as const,
          className: "border-green-500 text-green-600 hover:bg-green-50"
        };
      case "Paid": 
        return {
          variant: "outline" as const,
          className: "border-blue-500 text-blue-600 hover:bg-blue-50"
        };
      case "Partially Paid": 
        return {
          variant: "outline" as const,
          className: "border-orange-500 text-orange-600 hover:bg-orange-50"
        };
      case "Overdue": 
        return {
          variant: "outline" as const,
          className: "border-red-500 text-red-600 hover:bg-red-50"
        };
      case "Disputed": 
        return {
          variant: "outline" as const,
          className: "border-purple-500 text-purple-600 hover:bg-purple-50"
        };
      case "Cancelled": 
        return {
          variant: "outline" as const,
          className: "border-gray-500 text-gray-600 hover:bg-gray-50"
        };
      default: 
        return {
          variant: "outline" as const,
          className: "border-gray-500 text-gray-600 hover:bg-gray-50"
        };
    }
  };

  const getPaymentStatusBadgeProps = (status: string) => {
    switch (status) {
      case "Paid": 
        return {
          variant: "outline" as const,
          className: "border-green-500 text-green-600 hover:bg-green-50"
        };
      case "Partially Paid": 
        return {
          variant: "outline" as const,
          className: "border-blue-500 text-blue-600 hover:bg-blue-50"
        };
      case "Unpaid": 
        return {
          variant: "outline" as const,
          className: "border-orange-500 text-orange-600 hover:bg-orange-50"
        };
      case "Overdue": 
        return {
          variant: "outline" as const,
          className: "border-red-500 text-red-600 hover:bg-red-50"
        };
      default: 
        return {
          variant: "outline" as const,
          className: "border-gray-500 text-gray-600 hover:bg-gray-50"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600 mb-4">The requested purchase invoice could not be found.</p>
          <Link href="/purchase-invoices">
            <Button>Back to Purchase Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-invoices">
            <Button variant="outline" size="sm" onClick={() => navigate('/purchase-invoices')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Purchase Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600">{invoice.supplierName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenEditDialog}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {parseFloat(invoice.remainingAmount) > 0 && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Status and Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div>
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Status</p>
                <Badge 
                  variant={getStatusBadgeProps(invoice.status).variant}
                  className={getStatusBadgeProps(invoice.status).className}
                >
                  <span className="font-medium">{invoice.status}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

  <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Total Amount</p>
                <p className="text-xl font-bold">{invoice.currency} {parseFloat(invoice.totalAmount).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

  <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div>
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Payment Status</p>
                <Badge 
                  variant={getPaymentStatusBadgeProps(invoice.paymentStatus).variant}
                  className={getPaymentStatusBadgeProps(invoice.paymentStatus).className}
                >
                  <span className="font-medium">{invoice.paymentStatus}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

  <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div>
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Due Date</p>
                <p className="text-lg font-semibold">{formatDate(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Invoice Number</Label>
                  <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Supplier Invoice Number</Label>
                  <p className="text-lg">{invoice.supplierInvoiceNumber || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Invoice Date</Label>
                  <p className="text-lg">{formatDate(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                  <p className="text-lg">{formatDate(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                </div>
                {invoice.receivedDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Received Date</Label>
                    <p className="text-lg">{formatDate(new Date(invoice.receivedDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Terms</Label>
                  <p className="text-lg">{invoice.paymentTerms}</p>
                </div>
                {invoice.purchaseOrderNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Purchase Order</Label>
                    <p className="text-lg">{invoice.purchaseOrderNumber}</p>
                  </div>
                )}
                {invoice.goodsReceiptNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Goods Receipt</Label>
                    <p className="text-lg">{invoice.goodsReceiptNumber}</p>
                  </div>
                )}
              </div>
              {invoice.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-gray-800">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Invoice Items ({invoiceItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Item</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">Qty</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Unit Price</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Discount</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Tax</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{item.itemDescription}</p>
                            <p className="text-sm text-gray-600">{item.supplierCode}</p>
                            {item.barcode && (
                              <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-500 italic">{item.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">
                          {item.quantity} {item.unitOfMeasure}
                        </td>
                        <td className="text-right py-3 px-2">
                          {invoice.currency} {parseFloat(item.unitPrice).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-2">
                          {parseFloat(item.discountAmount) > 0 ? (
                            <span className="text-green-600">
                              -{invoice.currency} {parseFloat(item.discountAmount).toLocaleString()}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="text-right py-3 px-2">
                          {invoice.currency} {parseFloat(item.taxAmount).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-2 font-medium">
                          {invoice.currency} {parseFloat(item.totalPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Invoice Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{invoice.currency} {parseFloat(invoice.subtotal).toLocaleString()}</span>
                </div>
                {parseFloat(invoice.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-green-600">-{invoice.currency} {parseFloat(invoice.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{invoice.currency} {parseFloat(invoice.taxAmount).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{invoice.currency} {parseFloat(invoice.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid:</span>
                  <span>{invoice.currency} {parseFloat(invoice.paidAmount).toLocaleString()}</span>
                </div>
                {parseFloat(invoice.remainingAmount) > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Remaining:</span>
                    <span>{invoice.currency} {parseFloat(invoice.remainingAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Name</Label>
                <p className="font-medium">{invoice.supplierName}</p>
              </div>
              {invoice.supplierEmail && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-blue-600">{invoice.supplierEmail}</p>
                </div>
              )}
              {invoice.supplierPhone && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p>{invoice.supplierPhone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
                  <CardContent>
                    {paymentHistory.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No payments recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                          <div key={payment.id} className="rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{invoice.currency} {parseFloat(payment.amount).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(new Date(payment.paymentDate), 'MMM dd, yyyy')}</p>
                      </div>
                      {payment.reference && (
                        <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                <FileText className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
              {parseFloat(invoice.remainingAmount) > 0 && (
                <Button className="w-full justify-start" onClick={() => setShowPaymentDialog(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
              <Button variant="destructive" className="w-full justify-start" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierInvoiceNumber">Supplier Invoice Number</Label>
                  <Input
                    id="supplierInvoiceNumber"
                    value={editingInvoice.supplierInvoiceNumber || ""}
                    onChange={e => setEditingInvoice({ ...editingInvoice, supplierInvoiceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={editingInvoice.dueDate}
                    onChange={e => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={editingInvoice.paymentTerms}
                    onChange={e => setEditingInvoice({ ...editingInvoice, paymentTerms: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={editingInvoice.currency}
                    onValueChange={value => setEditingInvoice({ ...editingInvoice, currency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BHD">BHD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editingInvoice.notes || ""}
                    onChange={e => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => updateInvoice.mutate(editingInvoice)} disabled={updateInvoice.isPending}>
                  {updateInvoice.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                max={invoice?.remainingAmount}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-600 mt-1">
                Remaining: {invoice?.currency} {parseFloat(invoice?.remainingAmount || "0").toLocaleString()}
              </p>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Letter of Credit">Letter of Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentReference">Reference</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Transaction reference"
              />
            </div>
            <div>
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                placeholder="Payment notes (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => addPayment.mutate({ 
                  amount: paymentAmount, 
                  method: paymentMethod, 
                  reference: paymentReference,
                  notes: paymentNotes
                })}
                disabled={addPayment.isPending || !paymentAmount}
              >
                {addPayment.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteInvoice.mutate()}
              disabled={deleteInvoice.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteInvoice.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}