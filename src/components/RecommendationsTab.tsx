import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

const recommendations = [
  {
    id: 1,
    type: "remove",
    title: "Remove App: Unused Calculator Pro",
    description: "Not used for 49 days. Free up 12.3 MB of storage.",
    confidence: "90% confidence",
    action: "Remove",
    actionColor: "bg-red-500 hover:bg-red-600 text-white"
  },
  {
    id: 2,
    type: "cancel",
    title: "Cancel Subscription: Gym Membership App",
    description: "No usage detected. Save $29.99/month. Potential yearly savings: $359.88",
    confidence: "95% confidence",
    action: "Cancel",
    actionColor: "bg-red-500 hover:bg-red-600 text-white"
  }
];

export const RecommendationsTab = () => {
  return (
    <div className="space-y-6">
      {recommendations.map((rec) => (
        <Card key={rec.id} className="p-6 bg-metric-card border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                rec.type === 'remove' ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                {rec.type === 'remove' ? (
                  <Trash2 className={`h-4 w-4 ${rec.type === 'remove' ? 'text-orange-500' : 'text-red-500'}`} />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-metric-value mb-2">{rec.title}</h3>
                <p className="text-sm text-metric-label mb-3">{rec.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-metric-value">{rec.confidence}</span>
              <Button className={rec.actionColor}>
                {rec.action}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};