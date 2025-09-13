import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Menu, Bot } from "lucide-react";
import { 
  FaBell, 
  FaSearch, 
  FaBars, 
  FaRobot, 
  FaUser, 
  FaCog, 
  FaSignOutAlt,
  FaTag,
  FaChevronDown,
  FaHome,
  FaShoppingCart,
  FaFileInvoice,
  FaTruck,
  FaWarehouse,
  FaDollarSign,
  FaChartBar,
  FaCogs,
  FaUsers,
  FaHistory,
  FaDownload,
  FaSync,
  FaActivity,
  FaQuestionCircle,
  FaUpload,
  FaReceipt,
  FaBox,
  FaBuilding,
  FaBoxes,
  FaTruckLoading,
  FaTruckMoving,
  FaMoneyBillWave,
  FaBrain,
  FaTasks,
  FaFileAlt,
  FaShoppingBag,
  FaFileInvoiceDollar
} from "react-icons/fa";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAI } from "@/components/ai-assistant/ai-context";
import { useNotifications } from "@/components/notifications/notification-context";

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { openAssistant } = useAI();
  const { unreadCount } = useNotifications();
  const [, navigate] = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("-translate-x-full");
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-gray-100 rounded-lg"
              onClick={toggleSidebar}
              data-testid="button-sidebar-toggle"
            >
              <FaBars className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <FaTag className="text-white text-sm sm:text-lg" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tradix for Golden Tag</h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">GT ERP</h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Bar */}
            <div className="hidden md:flex relative">
              <Input
                type="text"
                placeholder="Search orders, customers, items..."
                className="w-[32rem] lg:w-[42rem] xl:w-[48rem] 2xl:w-[56rem] pl-10 input-focus rounded-lg border-gray-200"
                data-testid="input-search"
              />
              <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            
            {/* AI Assistant Quick Access */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-blue-50 rounded-lg transition-all duration-200" 
              onClick={openAssistant}
              data-testid="button-ai-assistant"
            >
              <FaRobot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <Badge 
                className="absolute -top-1 -right-1 bg-green-500 text-white text-xs min-w-4 h-4 flex items-center justify-center px-1 rounded-full shadow-sm"
              >
                AI
              </Badge>
            </Button>
            
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-gray-50 rounded-lg transition-all duration-200" 
              data-testid="button-notifications"
              onClick={() => navigate('/notifications')}
            >
              <FaBell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center px-1 rounded-full shadow-sm"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900" data-testid="text-user-name">
                  Ahmed Al-Rashid
                </p>
                <p className="text-xs text-gray-600 font-medium" data-testid="text-user-role">
                  Sales Manager
                </p>
              </div>
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                data-testid="img-user-avatar"
              >
                <span className="text-white text-xs sm:text-sm font-bold">AR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
