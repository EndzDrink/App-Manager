import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, RefreshCw, Settings } from "lucide-react";

export const AdminTab = () => {
  return (
    <div className="space-y-8">
      {/* Data Management Section */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-5 w-5 text-metric-label" />
          <h2 className="text-xl font-semibold text-metric-value">Data Management</h2>
        </div>
        <p className="text-sm text-metric-label mb-6">Import, export, and manage your app and subscription data</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-metric-card border border-border shadow-sm text-center">
            <Download className="h-8 w-8 text-metric-label mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-metric-value mb-2">Export Data</h3>
            <p className="text-sm text-metric-label mb-4">Download JSON backup</p>
            <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
              Export
            </Button>
          </Card>
          
          <Card className="p-6 bg-metric-card border border-border shadow-sm text-center">
            <RotateCcw className="h-8 w-8 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-metric-value mb-2">Reset Data</h3>
            <p className="text-sm text-metric-label mb-4">Restore sample data</p>
            <Button variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-50">
              Reset
            </Button>
          </Card>
          
          <Card className="p-6 bg-metric-card border border-border shadow-sm text-center">
            <RefreshCw className="h-8 w-8 text-metric-label mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-metric-value mb-2">Refresh All</h3>
            <p className="text-sm text-metric-label mb-4">Reload from database</p>
            <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
              Refresh
            </Button>
          </Card>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div>
        <h2 className="text-xl font-semibold text-metric-value mb-2">Quick Stats</h2>
        <p className="text-sm text-metric-label mb-6">Current database statistics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-blue-50 border border-blue-200 shadow-sm text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">5</div>
            <div className="text-sm font-medium text-blue-800">Total Apps</div>
          </Card>
          
          <Card className="p-6 bg-green-50 border border-green-200 shadow-sm text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">4</div>
            <div className="text-sm font-medium text-green-800">Active Subscriptions</div>
          </Card>
          
          <Card className="p-6 bg-purple-50 border border-purple-200 shadow-sm text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">2</div>
            <div className="text-sm font-medium text-purple-800">Recommendations</div>
          </Card>
          
          <Card className="p-6 bg-orange-50 border border-orange-200 shadow-sm text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">$109</div>
            <div className="text-sm font-medium text-orange-800">Monthly Cost</div>
          </Card>
        </div>
      </div>
    </div>
  );
};