import { Button } from "@/components/ui/button";
import { 
  Download, RefreshCw, Monitor, ShieldAlert, Shield, 
  User, LogOut, Archive 
} from "lucide-react";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onExport?: () => void;
  role: string;
  onLogout: () => void;
  onEnterLiveMode: () => void;
  onOpenArchive?: () => void; // Added to support the new Archive feature
  savedReportsCount?: number;  // Added for the red notification badge
}

export const DashboardHeader = ({ 
  onRefresh, 
  onExport, 
  role, 
  onLogout, 
  onEnterLiveMode,
  onOpenArchive,
  savedReportsCount = 0
}: DashboardHeaderProps) => {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shadow-md">
          <Monitor className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SAM</h1>
          <p className="text-sm font-medium text-gray-500">Enterprise Asset & Capacity Analytics</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Role Badge */}
        <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm mr-2">
          {role === 'SuperAdmin' ? <ShieldAlert className="h-4 w-4 text-indigo-600" /> : 
           role === 'DepartmentHead' ? <Shield className="h-4 w-4 text-indigo-600" /> : 
           <User className="h-4 w-4 text-indigo-600" />}
          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{role}</span>
        </div>

        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1"></div>

        {/* Live Dashboard Button */}
        <Button 
          onClick={onEnterLiveMode} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-none h-9 px-4 transition-all duration-200 active:scale-95"
        >
          <Monitor className="h-4 w-4 mr-2" /> 
          <span className="font-bold text-xs uppercase tracking-wider">Live Presentation</span>
        </Button>

        {/* NEW: Archive Button with Badge */}
        <Button 
          onClick={onOpenArchive} 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-200 text-indigo-600 hover:bg-indigo-50 shadow-sm relative h-9 w-10 p-0"
        >
          <Archive className="h-4 w-4" />
          {savedReportsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
              {savedReportsCount}
            </span>
          )}
        </Button>

        <Button onClick={onExport} variant="outline" size="sm" className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm h-9">
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
        
        <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm h-9" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Sync
        </Button>

        <Button onClick={onLogout} variant="outline" size="sm" className="bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:border-red-200 shadow-sm h-9">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;