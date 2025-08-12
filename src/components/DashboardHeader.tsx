import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Monitor } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Monitor className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-metric-value">AppManager</h1>
          <p className="text-sm text-metric-label">Smart App & Subscription Analytics</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="default" size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
          <Monitor className="h-4 w-4 mr-2" />
          Live Dashboard
        </Button>
      </div>
    </header>
  );
};