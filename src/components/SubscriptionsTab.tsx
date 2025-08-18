import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, X } from "lucide-react";
import AddSubscriptionCard from './AddSubscriptionCard'; // Import the new card component

// Props interface for SubscriptionsTab
interface SubscriptionsTabProps {
  subscriptions: any[]; // The list of subscriptions
  onAddSubscription: () => void; // Function to add a new subscription
}

// The SubscriptionsTab component displays a list of subscriptions.
export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ subscriptions, onAddSubscription }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Active Subscriptions</h2>
          <p className="text-sm text-metric-label">Track your recurring subscriptions and costs</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {subscriptions.map((sub) => (
          <Card key={sub.id} className="p-4 bg-metric-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${sub.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {sub.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{sub.name}</h3>
                  <p className="text-sm text-metric-label">{sub.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <div className="font-bold text-metric-value">{sub.price}</div>
                  <div className="text-sm text-metric-label">/month</div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-metric-value">{sub.billing}</div>
                  <div className="text-sm text-metric-label">next billing</div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={`${sub.usageColor} text-white`}>
                    {sub.usage}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {sub.usage === "Never Usage" && (
                      <Button variant="outline" size="sm" className="border-red-300 text-red-500 hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {/* Render the AddSubscriptionCard component here */}
        <AddSubscriptionCard onClick={onAddSubscription} />
      </div>
    </div>
  );
};

export default SubscriptionsTab;
