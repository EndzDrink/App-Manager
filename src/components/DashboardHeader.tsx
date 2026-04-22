import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Monitor } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onExport?: () => void; // Add this line
}

export const DashboardHeader = ({ onRefresh, onExport }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
          <Monitor className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AppManager</h1>
          <p className="text-sm text-gray-500">Smart App & Subscription Analytics</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Wire up the Export button */}
        <Button 
          onClick={onExport} 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm transition-colors duration-200"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors duration-200">
          <Monitor className="h-4 w-4 mr-2" />
          Live Dashboard
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;