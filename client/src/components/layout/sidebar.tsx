import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { WORKFLOW_STEPS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  HelpCircle, 
  FileText, 
  Upload, 
  ShoppingCart, 
  Receipt, 
  Truck, 
  Package, 
  Building2, 
  Warehouse, 
  TruckIcon, 
  Boxes, 
  DollarSign, 
  Bot, 
  BarChart, 
  FileDown, 
  RefreshCw,
  Activity
} from "lucide-react";
import { 
  FaHome, 
  FaQuestionCircle, 
  FaFileInvoice, 
  FaUpload, 
  FaShoppingCart, 
  FaReceipt, 
  FaTruck, 
  FaBox, 
  FaBuilding, 
  FaWarehouse, 
  FaBoxes, 
  FaDollarSign, 
  FaRobot, 
  FaChartBar, 
  FaDownload, 
  FaSync, 
  FaChartLine,
  FaCog,
  FaUsers,
  FaBell,
  FaHistory,
  FaFileExport,
  FaCogs,
  FaUserCog,
  FaDatabase,
  FaClipboardList,
  FaTruckLoading,
  FaBoxOpen,
  FaMoneyBillWave,
  FaBrain,
  FaTasks,
  FaFileAlt,
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaTruckMoving,
  FaBoxes as FaBoxesAlt,
  FaWarehouse as FaWarehouseAlt,
  FaDollarSign as FaDollarSignAlt,
  FaRobot as FaRobotAlt,
  FaChartBar as FaChartBarAlt,
  FaDownload as FaDownloadAlt,
  FaSync as FaSyncAlt,
  FaChartLine as FaActivityAlt
} from "react-icons/fa";

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <aside 
      id="sidebar" 
      className="w-64 bg-white/95 backdrop-blur-sm shadow-lg border-r border-gray-200 fixed h-full z-40 transition-transform duration-300 lg:translate-x-0 -translate-x-full flex flex-col"
    >
      <nav className="p-6 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
        {/* Dashboard */}
        <Link href="/">
          <a
            className={cn(
              "sidebar-item",
              isActive("/") 
                ? "sidebar-item-active" 
                : "text-gray-700"
            )}
            data-testid="link-dashboard"
          >
            <FaHome className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Dashboard</span>
          </a>
        </Link>
        
        {/* Order Management Section */}
        <div className="pt-6">
          <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Order Management
          </h3>
          <div className="space-y-1">
            <Link href="/enquiries">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/enquiries")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-enquiry"
              >
                <FaQuestionCircle className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Enquiry</span>
                <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">14</Badge>
              </a>
            </Link>
            <Link href="/quotations">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/quotations")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-quotation"
              >
                <FaFileInvoice className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Quotation</span>
                <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">8</Badge>
              </a>
            </Link>
            <Link href="/po-upload">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/po-upload")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-po-upload"
              >
                <FaUpload className="h-5 w-5 text-purple-500" />
                <span className="font-medium">PO Upload</span>
              </a>
            </Link>
            <Link href="/sales-orders">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/sales-orders")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-sales-order"
              >
                <FaShoppingCart className="h-5 w-5 text-green-600" />
                <span className="font-medium">Sales Order</span>
                <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">15</Badge>
              </a>
            </Link>
            <Link href="/invoicing">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/invoicing")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-invoice"
              >
                <FaReceipt className="h-5 w-5 text-green-600" />
                <span className="font-medium">Invoice</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Procurement Section */}
        <div className="pt-6">
          <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Procurement
          </h3>
          <div className="space-y-1">
            <Link href="/supplier-lpo">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/supplier-lpo")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-supplier-lpo"
              >
                <FaTruck className="h-5 w-5 text-indigo-500" />
                <span className="font-medium">Supplier LPO</span>
              </a>
            </Link>
            <Link href="/goods-receipt">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/goods-receipt")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-goods-receipt"
              >
                <FaBox className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Goods Receipt</span>
              </a>
            </Link>
            <Link href="/suppliers">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/suppliers")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-suppliers"
              >
                <FaBuilding className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Suppliers</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Inventory Management Section */}
        <div className="pt-6">
          <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Inventory Management
          </h3>
          <div className="space-y-1">
            <Link href="/inventory">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/inventory")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-inventory"
              >
                <FaWarehouse className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Inventory</span>
              </a>
            </Link>
            <Link href="/delivery">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/delivery")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-delivery-&-picking"
              >
                <FaTruckLoading className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Delivery & Picking</span>
              </a>
            </Link>
            <Link href="/delivery-management">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/delivery-management")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-delivery-management"
              >
                <FaTruckMoving className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Delivery Management</span>
              </a>
            </Link>
            <Link href="/inventory-management">
              <a 
                className={cn(
                  "sidebar-item",
                  isActive("/inventory-management")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-inventory-management"
              >
                <FaBoxes className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Inventory Management</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Administration Section */}
        <div className="pt-6">
          <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Administration
          </h3>
          <div className="space-y-1">
            <Link href="/pricing">
              <a 
                className={cn(
                  "sidebar-item",
                  isActive("/pricing")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-pricing-costing"
              >
                <FaDollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">Pricing & Costing</span>
              </a>
            </Link>
            <Link href="/ai-demo">
              <a 
                className={cn(
                  "sidebar-item",
                  isActive("/ai-demo")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-ai-demo"
                onClick={() => console.log('Sidebar AI Assistant button clicked!')}
              >
                <FaBrain className="h-5 w-5 text-purple-600" />
                <span className="font-medium">AI Assistant</span>
                <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">NEW</Badge>
              </a>
            </Link>
            <Link href="/recent-activities">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/recent-activities")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-recent-activities"
              >
                <FaActivityAlt className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Recent Activities</span>
              </a>
            </Link>
            <Link href="/analytics">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/analytics")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-analytics"
              >
                <FaChartBar className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">Analytics</span>
              </a>
            </Link>
            <Link href="/export-data">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/export-data")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-export-data"
              >
                <FaDownload className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Export Data</span>
              </a>
            </Link>
            <Link href="/tally-integration">
              <a
                className={cn(
                  "sidebar-item",
                  isActive("/tally-integration")
                    ? "sidebar-item-active"
                    : "text-gray-700"
                )}
                data-testid="link-tally-integration"
              >
                <FaSync className="h-5 w-5 text-green-600" />
                <span className="font-medium">Tally Integration</span>
              </a>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}
