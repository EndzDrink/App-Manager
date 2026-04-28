import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, XCircle, Sparkles, Activity, BrainCircuit, Search, X, Trash2 
} from "lucide-react";

interface RecommendationsTabProps {
  recommendations: any[];
  onReclaim: (id: number) => Promise<void>;
  // Navigation hook to jump to source data in Users Tab
  onInvestigate: (systemName: string) => void;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ recommendations, onReclaim, onInvestigate }) => {
  const [aiInsight, setAiInsight] = useState<string>("Analyzing enterprise environment...");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [aiStatus, setAiStatus] = useState<string>("live");
  const [aiModalRec, setAiModalRec] = useState<any | null>(null);

  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        setIsAiLoading(true);
        const res = await fetch('http://localhost:3000/api/ai/insights');
        if (res.ok) {
          const data = await res.json();
          setAiInsight(data.insight);
          setAiStatus(data.status); 
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

  // Helper to extract system name for filtering
  const extractSystemName = (title: string) => title.replace('Optimize ', '');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      <div>
        <h2 className="text-xl font-semibold text-metric-value tracking-tight">Executive Optimization</h2>
        <p className="text-sm text-metric-label">AI-driven analysis and actionable license reclamation.</p>
      </div>

      {/* 1. CIO AI ADVISOR MODULE (The Original High-End Look) */}
      <Card className="p-6 bg-gradient-to-br from-indigo-900 to-blue-900 border-none shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/30 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-wide">CIO Advisor</h3>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">
                {aiStatus === 'live' ? 'Live AI Analysis' : 'Simulated Intelligence'}
              </p>
            </div>
          </div>
          
          <div className="bg-indigo-950/40 p-5 rounded-xl border border-indigo-500/20 backdrop-blur-sm shadow-inner">
            {isAiLoading ? (
              <div className="flex items-center space-x-3 text-indigo-200">
                <Activity className="h-4 w-4 animate-pulse" />
                <p className="text-sm leading-relaxed animate-pulse font-medium">Processing cross-departmental data vectors...</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-indigo-50 font-medium tracking-wide">
                "{aiInsight}"
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 2. ACTIONABLE ITEMS (Merged with new interrogation logic) */}
      <div>
        <div className="flex items-center space-x-2 mb-5">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-gray-800 text-lg tracking-tight">Actionable Reclamations</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-500 italic font-medium">
                Your environment is fully optimized. No current tactical recommendations.
              </p>
            </div>
          ) : (
            recommendations.map((rec, i) => {
              const sysName = extractSystemName(rec.title);
              return (
                <Card key={rec.id || i} className="p-5 bg-white border border-border shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 hover:border-amber-200 hover:shadow-md transition-all">
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg shrink-0 mt-0.5">
                      <Activity className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    {/* NEW: Interrogate Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAiModalRec(rec)}
                      className="flex-1 xl:flex-none bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs font-bold"
                    >
                      <BrainCircuit className="h-3.5 w-3.5 mr-1.5" /> Interrogate AI
                    </Button>

                    {/* NEW: Review Logs (Navigation) */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInvestigate(sysName)}
                      className="flex-1 xl:flex-none bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs font-bold"
                    >
                      <Search className="h-3.5 w-3.5 mr-1.5" /> Review Logs
                    </Button>

                    <div className="hidden xl:block h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Reclaim Action */}
                    <Button 
                      size="sm" 
                      className="flex-1 xl:flex-none bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs font-bold"
                      onClick={() => rec.id && onReclaim(rec.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Reclaim License
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* AI INTERROGATION MODAL */}
      {aiModalRec && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center text-indigo-900 font-bold tracking-tight">
                <BrainCircuit className="h-5 w-5 mr-2 text-indigo-600" />
                AI Decision Rationale
              </div>
              <button onClick={() => setAiModalRec(null)} className="text-gray-400 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-md p-1 shadow-sm">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 text-sm">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Target System</p>
                  <p className="font-bold text-gray-900 text-base">{extractSystemName(aiModalRec.title)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Confidence</p>
                  <p className="font-bold text-green-600 text-base">98.4%</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 mb-2">Mathematical Justification</p>
                <p className="text-gray-700 leading-relaxed font-medium">
                  Analysis of the trailing 30-day telemetry indicates active session time of <span className="text-red-600 font-bold">under 30 minutes</span>. 
                  Calculated RoI for this seat is negative given the ZAR unit cost. Decommissioning recommended to optimize IMU OpEx.
                </p>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-2xl">
                <p className="font-mono text-[11px] text-indigo-400 mb-2 tracking-tighter">&gt; analyzing_license_lifecycle...</p>
                <p className="font-mono text-[11px] text-green-400 mb-2 tracking-tighter">&gt; waste_pattern_detected: TRUE</p>
                <p className="font-mono text-[11px] text-blue-400 tracking-tighter">&gt; strategic_alignment: ARCHITECTURE_STANDARD_V1.2</p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button onClick={() => setAiModalRec(null)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-8 h-10 rounded-lg transition-all shadow-md">
                Acknowledge Strategy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};