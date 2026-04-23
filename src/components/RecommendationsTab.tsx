import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, XCircle, Sparkles, Activity } from "lucide-react";

interface RecommendationsTabProps {
  recommendations: any[];
  onReclaim: (id: number) => Promise<void>;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ recommendations, onReclaim }) => {
  const [aiInsight, setAiInsight] = useState<string>("Analyzing enterprise environment...");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [aiStatus, setAiStatus] = useState<string>("live");

  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        setIsAiLoading(true);
        const res = await fetch('http://localhost:3000/api/ai/insights');
        if (res.ok) {
          const data = await res.json();
          setAiInsight(data.insight);
          setAiStatus(data.status); // Will tell us if it used an API key or simulation
        } else {
          setAiInsight("Failed to generate AI insights. Check API connection.");
        }
      } catch (err) {
        setAiInsight("Network error while connecting to AI engine.");
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAiInsights();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-metric-value">Executive Optimization</h2>
        <p className="text-sm text-metric-label">AI-driven analysis and actionable license reclamation.</p>
      </div>

      {/* 1. CIO AI Advisor Module */}
      <Card className="p-6 bg-gradient-to-br from-indigo-900 to-blue-900 border-none shadow-lg text-white relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/30 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg">CIO Advisor</h3>
              <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                {aiStatus === 'live' ? 'Live AI Analysis' : 'Simulated Intelligence'}
              </p>
            </div>
          </div>
          
          <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30">
            {isAiLoading ? (
              <div className="flex items-center space-x-3 text-indigo-200">
                <Activity className="h-4 w-4 animate-pulse" />
                <p className="text-sm leading-relaxed animate-pulse">Processing cross-departmental data vectors...</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-indigo-50 font-medium tracking-wide">
                "{aiInsight}"
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Tactical Action Items */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-metric-value text-lg">Actionable Reclamations</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {recommendations.length === 0 ? (
            <p className="text-sm text-metric-label italic py-8 border-2 border-dashed rounded-lg text-center bg-gray-50/50">
              Your environment is fully optimized. No current tactical recommendations.
            </p>
          ) : (
            recommendations.map((rec, i) => (
              <Card key={rec.id || i} className="p-5 bg-white border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-yellow-50 border border-yellow-100 rounded-lg shrink-0 mt-1">
                    <Activity className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-metric-value">{rec.title}</h4>
                    <p className="text-sm text-metric-label mt-0.5">{rec.description}</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0 font-medium"
                  onClick={() => {
                    if(rec.id) {
                      onReclaim(rec.id);
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
    </div>
  );
};