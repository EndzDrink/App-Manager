import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Monitor, ShieldAlert, Shield, User, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onExport?: () => void;
  role: string;
  onLogout: () => void;
  onEnterLiveMode: () => void; 
}

export const DashboardHeader = ({ onRefresh, onExport, role, onLogout, onEnterLiveMode }: DashboardHeaderProps) => {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm">
          <Monitor className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AppManager</h1>
          <p className="text-sm text-gray-500">Smart App & Subscription Analytics</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Verified User Badge */}
        <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 shadow-sm">
          {role === 'SuperAdmin' ? <ShieldAlert className="h-4 w-4 text-green-600" /> : 
           role === 'DepartmentHead' ? <Shield className="h-4 w-4 text-green-600" /> : 
           <User className="h-4 w-4 text-green-600" />}
          <span className="text-sm font-bold text-green-700 uppercase tracking-wider text-[10px]">{role}</span>
        </div>

        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1"></div>

        {/* UPDATED: Live Dashboard Button with Monitor Icon and Success Styling */}
        <Button 
          onClick={onEnterLiveMode} 
          variant="outline" 
          size="sm" 
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors duration-200 border-none"
        >
          <Monitor className="h-4 w-4 mr-2" /> Live Dashboard
        </Button>

        <Button onClick={onExport} variant="outline" size="sm" className="bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm transition-colors duration-200">
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
        
        <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm transition-colors duration-200" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>

        <Button onClick={onLogout} variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 shadow-sm transition-colors duration-200">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;