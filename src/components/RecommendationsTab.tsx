import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, XCircle } from "lucide-react";

interface RecommendationsTabProps {
  recommendations: any[];
  onReclaim: (id: number) => Promise<void>;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ recommendations, onReclaim }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-metric-value">Cost Recommendations</h2>
        <p className="text-sm text-metric-label">Automated insights to identify underutilized licenses and optimize your SaaS spend.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recommendations.length === 0 ? (
          <p className="text-sm text-metric-label italic py-8 border-2 border-dashed rounded-lg text-center">
            Your environment is fully optimized. No current recommendations.
          </p>
        ) : (
          recommendations.map((rec, i) => (
            <Card key={rec.id || i} className="p-5 bg-white border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg shrink-0 mt-1">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{rec.title}</h3>
                  <p className="text-sm text-metric-label mt-1">{rec.description}</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
                onClick={() => {
                  if(rec.id) {
                    onReclaim(rec.id);
                  } else {
                    console.error("No subscription ID attached to this recommendation.");
                  }
                }}
              >
                <XCircle className="h-4 w-4 mr-2" /> Reclaim License
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};