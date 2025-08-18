import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import AddAppCard from './AddAppCard';

// Props interface for AppsTab
interface AppsTabProps {
  apps: any[]; // The list of applications
  onAddApp: () => void; // Function to add a new app
}

// The AppsTab component displays a list of applications.
export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Your Apps</h2>
          <p className="text-sm text-metric-label">Manage and track your installed applications</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {apps.map((app) => (
          <Card key={app.id} className="p-4 bg-metric-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${app.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {app.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{app.name}</h3>
                  <p className="text-sm text-metric-label">{app.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <div className="font-medium text-metric-value">{app.dailyUsage}</div>
                  <div className="text-sm text-metric-label">daily</div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-metric-value">{app.size}</div>
                  <div className="text-sm text-metric-label">size</div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-metric-value">{app.lastUsed}</div>
                  <div className="text-sm text-metric-label">last used</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {app.name.includes("Unused") && (
                    <Button variant="outline" size="sm" className="border-red-300 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {/* Render the AddAppCard component here */}
        <AddAppCard onClick={onAddApp} />
      </div>
    </div>
  );
};

export default AppsTab;
