import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AIProvider } from "@/components/ai-assistant/ai-context";
import { NotificationProvider } from "@/components/notifications/notification-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AIDemoPage from "@/pages/ai-demo";
import Enquiries from "@/pages/enquiries";
import EnquiryDetail from "@/pages/enquiry-detail";
import Quotations from "@/pages/quotations";
import QuotationDetailPage from "@/pages/quotation-detail";
import QuotationNewPage from "@/pages/quotation-new";
import CustomerAcceptance from "@/pages/customer-acceptance";
import CustomerPoUpload from "@/pages/customer-po-upload";
import SalesOrders from "@/pages/sales-orders";
import SupplierLpo from "@/pages/supplier-lpo";
import GoodsReceipt from "@/pages/goods-receipt";
import Inventory from "@/pages/inventory";
import InventoryManagement from "@/pages/inventory-management";
import DeliveryManagement from "@/pages/delivery-management";
import Delivery from "@/pages/delivery";
import Invoicing from "@/pages/invoicing";
import PricingManagement from "@/pages/pricing-management";
import MainLayout from "@/components/layout/main-layout";
import { AuthProvider, useAuth } from "@/components/auth/auth-context";
import LoginPage from "@/pages/login";
import Suppliers from "@/pages/suppliers";
import Notifications from "@/pages/notifications";
import RecentActivities from "@/pages/recent-activities";
import AuditLogs from "@/pages/audit-logs";
import UserManagement from "@/pages/user-management";
import SystemSettings from "@/pages/system-settings";
import Analytics from "@/pages/analytics";
import ExportData from "@/pages/export-data";
import TallyIntegration from "@/pages/tally-integration";
import CustomerManagement from "@/pages/customer-management";
import NotificationSettings from "@/pages/notification-settings";
import BlueThemeTest from "@/pages/blue-theme-test";
import ProcessFlowDetails from "@/pages/process-flow-details";

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!user) {
    return <LoginPage />;
  }
  return (
    <MainLayout>
      <ErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/login" component={LoginPage} />
          <Route path="/ai-demo" component={AIDemoPage} />
          <Route path="/enquiries" component={Enquiries} />
          <Route path="/enquiries/:id" component={EnquiryDetail} />
          <Route path="/quotations" component={Quotations} />
          <Route path="/quotations/new" component={QuotationNewPage} />
          <Route path="/quotations/:id" component={QuotationDetailPage} />
          <Route path="/quotations/:id/acceptance" component={CustomerAcceptance} />
          <Route path="/customer-po-upload" component={CustomerPoUpload} />
          <Route path="/sales-orders" component={SalesOrders} />
          <Route path="/supplier-lpo" component={SupplierLpo} />
          <Route path="/goods-receipt" component={GoodsReceipt} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/inventory-management" component={InventoryManagement} />
          <Route path="/delivery" component={Delivery} />
          <Route path="/delivery-management" component={DeliveryManagement} />
          <Route path="/invoicing" component={Invoicing} />
          <Route path="/pricing" component={PricingManagement} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/recent-activities" component={RecentActivities} />
          <Route path="/audit-logs" component={AuditLogs} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/system-settings" component={SystemSettings} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/export-data" component={ExportData} />
          <Route path="/tally-integration" component={TallyIntegration} />
          <Route path="/customer-management" component={CustomerManagement} />
          <Route path="/notification-settings" component={NotificationSettings} />
          <Route path="/blue-theme-test" component={BlueThemeTest} />
          <Route path="/process-flow-details" component={ProcessFlowDetails} />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <AIProvider>
            <Toaster />
            <AuthProvider>
              <ProtectedRoutes />
            </AuthProvider>
          </AIProvider>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
