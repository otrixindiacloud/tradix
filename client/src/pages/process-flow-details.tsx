import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDate } from "date-fns";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Truck,
  ShoppingCart,
  Upload,
  CheckCircle2,
  Eye,
  Download,
  Edit,
  Send,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { WORKFLOW_STEPS } from "@/lib/constants";

interface ProcessFlowDetails {
  currentStep: number;
  completedSteps: number[];
  quotationId: string;
  quotationNumber: string;
  enquiryId: string;
  enquiryNumber: string;
  customerId: string;
  customerName: string;
  customerType: string;
  status: string;
  totalValue: number;
  createdAt: string;
  lastUpdated: string;
  estimatedCompletion: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignedTo: string;
  notes: string;
}

interface StepDetails {
  id: number;
  name: string;
  status: "completed" | "current" | "pending" | "blocked";
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  estimatedDuration: string;
  actualDuration?: string;
  documents?: string[];
}

export default function ProcessFlowDetailsPage() {
  const [, navigate] = useLocation();

  // Mock data - in real implementation, this would come from API
  const { data: processFlow, isLoading } = useQuery({
    queryKey: ["/api/process-flow/details"],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        currentStep: 3,
        completedSteps: [1, 2],
        quotationId: "QT-2024-001",
        quotationNumber: "QT-2024-001",
        enquiryId: "ENQ-2024-001",
        enquiryNumber: "ENQ-2024-001",
        customerId: "CUST-001",
        customerName: "Al Rawi Trading",
        customerType: "Wholesale",
        status: "In Progress",
        totalValue: 15750.00,
        createdAt: "2024-01-15T10:30:00Z",
        lastUpdated: "2024-01-16T14:20:00Z",
        estimatedCompletion: "2024-01-25T17:00:00Z",
        priority: "High",
        assignedTo: "Sales Team",
        notes: "Customer requested expedited processing for urgent project requirements."
      } as ProcessFlowDetails;
    },
  });

  const { data: stepDetails } = useQuery({
    queryKey: ["/api/process-flow/steps"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: 1,
          name: "Enquiry",
          status: "completed",
          completedAt: "2024-01-15T10:30:00Z",
          assignedTo: "Sales Team",
          notes: "Initial enquiry received and processed",
          estimatedDuration: "2 hours",
          actualDuration: "1.5 hours",
          documents: ["enquiry-form.pdf", "customer-requirements.pdf"]
        },
        {
          id: 2,
          name: "Quotation",
          status: "completed",
          completedAt: "2024-01-15T16:45:00Z",
          assignedTo: "Pricing Team",
          notes: "Quote prepared with 40% wholesale markup",
          estimatedDuration: "4 hours",
          actualDuration: "3.2 hours",
          documents: ["quotation-QT-2024-001.pdf", "pricing-breakdown.xlsx"]
        },
        {
          id: 3,
          name: "Acceptance",
          status: "current",
          assignedTo: "Customer",
          notes: "Waiting for customer response",
          estimatedDuration: "2 days",
          documents: []
        },
        {
          id: 4,
          name: "PO Upload",
          status: "pending",
          assignedTo: "Customer Service",
          notes: "Pending customer acceptance",
          estimatedDuration: "1 day",
          documents: []
        },
        {
          id: 5,
          name: "Sales Order",
          status: "pending",
          assignedTo: "Order Processing",
          notes: "Will be created after PO upload",
          estimatedDuration: "2 hours",
          documents: []
        },
        {
          id: 6,
          name: "Supplier LPO",
          status: "pending",
          assignedTo: "Procurement",
          notes: "Will be created after sales order",
          estimatedDuration: "4 hours",
          documents: []
        },
        {
          id: 7,
          name: "Goods Receipt",
          status: "pending",
          assignedTo: "Warehouse",
          notes: "Pending supplier delivery",
          estimatedDuration: "1 day",
          documents: []
        },
        {
          id: 8,
          name: "Inventory",
          status: "pending",
          assignedTo: "Inventory Team",
          notes: "Will be updated after goods receipt",
          estimatedDuration: "1 hour",
          documents: []
        },
        {
          id: 9,
          name: "Delivery & Picking",
          status: "pending",
          assignedTo: "Logistics",
          notes: "Will be scheduled after inventory update",
          estimatedDuration: "2 days",
          documents: []
        },
        {
          id: 10,
          name: "Invoice",
          status: "pending",
          assignedTo: "Accounting",
          notes: "Will be generated after delivery",
          estimatedDuration: "1 hour",
          documents: []
        }
      ] as StepDetails[];
    },
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["/api/process-flow/activities"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: 1,
          action: "Quotation Sent",
          description: "Quote QT-2024-001 sent to customer",
          timestamp: "2024-01-15T16:45:00Z",
          user: "John Smith",
          icon: Send
        },
        {
          id: 2,
          action: "Quotation Created",
          description: "Quote QT-2024-001 created with 15 items",
          timestamp: "2024-01-15T14:20:00Z",
          user: "Sarah Johnson",
          icon: FileText
        },
        {
          id: 3,
          action: "Enquiry Processed",
          description: "Enquiry ENQ-2024-001 processed and assigned",
          timestamp: "2024-01-15T10:30:00Z",
          user: "Mike Wilson",
          icon: CheckCircle2
        }
      ];
    },
  });

  if (isLoading || !processFlow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading process flow details...</p>
        </div>
      </div>
    );
  }

  const progress = ((processFlow.completedSteps.length + (processFlow.currentStep > 0 ? 1 : 0)) / WORKFLOW_STEPS.length) * 100;
  const currentStepData = stepDetails?.find(step => step.id === processFlow.currentStep);
  const completedStepsData = stepDetails?.filter(step => processFlow.completedSteps.includes(step.id));
  const pendingStepsData = stepDetails?.filter(step => step.id > processFlow.currentStep);

  const getStepIcon = (stepId: number) => {
    switch (stepId) {
      case 1: return User;
      case 2: return FileText;
      case 3: return CheckCircle;
      case 4: return Upload;
      case 5: return ShoppingCart;
      case 6: return Truck;
      case 7: return Package;
      case 8: return Package;
      case 9: return Truck;
      case 10: return DollarSign;
      default: return Clock;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-white bg-green-600";
      case "current": return "text-white bg-gray-600";
      case "pending": return "text-white bg-gray-400";
      case "blocked": return "text-white bg-red-600";
      default: return "text-white bg-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "text-white bg-red-600";
      case "High": return "text-white bg-orange-600";
      case "Medium": return "text-white bg-yellow-600";
      case "Low": return "text-white bg-green-600";
      default: return "text-white bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Process Flow Details
            </h1>
            <p className="text-gray-600 text-lg">
              {processFlow.quotationNumber} - {processFlow.customerName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Badge className={`${getPriorityColor(processFlow.priority)} flex items-center gap-1`}>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold mr-2">High</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {processFlow.status}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress: {processFlow.completedSteps.length + 1} of {WORKFLOW_STEPS.length} steps</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{processFlow.completedSteps.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">1</div>
                <div className="text-sm text-gray-600">Current</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{WORKFLOW_STEPS.length - processFlow.completedSteps.length - 1}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/quotations/${processFlow.quotationId}`)}
          data-testid="button-view-quotation"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Quotation
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/enquiries/${processFlow.enquiryId}`)}
          data-testid="button-view-enquiry"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Enquiry
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.print()}
          data-testid="button-export"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Step Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer & Project Info */}
            <div className="lg:col-span-2 space-y-6">
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
                      <label className="text-sm font-medium text-gray-500">Customer Name</label>
                      <div className="font-medium">{processFlow.customerName}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Type</label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{processFlow.customerType}</Badge>
                        <span className="text-sm text-gray-600">
                          ({processFlow.customerType === "Retail" ? "70%" : "40%"} markup)
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer ID</label>
                      <div className="font-mono text-sm">{processFlow.customerId}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      <div className="font-medium">{processFlow.assignedTo}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quotation Number</label>
                      <div className="font-mono text-sm text-blue-600">{processFlow.quotationNumber}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Enquiry Number</label>
                      <div className="font-mono text-sm text-blue-600">{processFlow.enquiryNumber}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Value</label>
                      <div className="font-bold text-lg text-green-600">
                        {formatCurrency(processFlow.totalValue)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      <Badge className={getPriorityColor(processFlow.priority)}>
                        {processFlow.priority}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <div className="text-sm">
                        {formatDate(new Date(processFlow.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <div className="text-sm">
                        {formatDate(new Date(processFlow.lastUpdated), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Completion</label>
                      <div className="text-sm">
                        {formatDate(new Date(processFlow.estimatedCompletion), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  
                  {processFlow.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                        {processFlow.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Step Status */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Step
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getStepStatusColor(currentStepData?.status || "current")}`}>
                      {React.createElement(getStepIcon(processFlow.currentStep), { className: "h-8 w-8" })}
                    </div>
                    <h3 className="font-semibold text-lg">{WORKFLOW_STEPS[processFlow.currentStep - 1]?.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{currentStepData?.notes}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Assigned To:</span>
                      <span className="font-medium">{currentStepData?.assignedTo || "TBD"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated Duration:</span>
                      <span className="font-medium">{currentStepData?.estimatedDuration || "TBD"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge className={getStepStatusColor(currentStepData?.status || "current")}>
                        {currentStepData?.status || "Current"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <div className="space-y-4">
            {stepDetails?.map((step) => {
              const IconComponent = getStepIcon(step.id);
              return (
                <Card key={step.id} className={`${step.status === "current" ? "border-gray-500 bg-gray-50" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStepStatusColor(step.status)}`}>
                          {step.status === "completed" ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <IconComponent className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{step.name}</h3>
                          <p className="text-sm text-gray-600">{step.notes}</p>
                          {step.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed: {formatDate(new Date(step.completedAt), "MMM dd, yyyy 'at' h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStepStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          {step.assignedTo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.actualDuration || step.estimatedDuration}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities?.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border-l-4 border-gray-500 bg-gray-50">
                      <IconComponent className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(new Date(activity.timestamp), "MMM dd, yyyy 'at' h:mm a")} • {activity.user}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stepDetails?.map((step) => {
                  if (!step.documents || step.documents.length === 0) return null;
                  
                  return (
                    <div key={step.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{step.name} Documents</h4>
                      <div className="space-y-2">
                        {step.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-sm">{doc}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
