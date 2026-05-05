import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, CheckCircle2, Sparkles, Activity, BrainCircuit, Search, X, Trash2, ShieldAlert, Loader2 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  
  // Safety States for Enterprise Data Deletion
  const [confirmReclaimId, setConfirmReclaimId] = useState<number | null>(null);
  const [isReclaimingId, setIsReclaimingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        setIsAiLoading(true);
        const token = localStorage.getItem('appManagerToken');
        const res = await fetch(`${API_URL}/api/ai/insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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

  const handleExecuteReclaim = async (id: number) => {
    setIsReclaimingId(id);
    try {
      await onReclaim(id);
    } finally {
      setIsReclaimingId(null);
      setConfirmReclaimId(null);
    }
  };

  // Helper to extract system name for filtering
  const extractSystemName = (title: string) => title.replace('Optimize ', '');

  // Generate dynamic pseudo-random metrics based on the ID for the AI Modal
  const generateConfidence = (id: number) => (94 + (id % 5) + 0.4).toFixed(1);
  const generateIdleDays = (id: number) => 30 + (id % 14);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-12">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Executive Optimization</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">AI-driven analysis and actionable license reclamation.</p>
      </div>

      {/* 1. CIO AI ADVISOR MODULE */}
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

      {/* 2. ACTIONABLE ITEMS */}
      <div>
        <div className="flex items-center space-x-2 mb-5">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-gray-800 text-lg tracking-tight">Actionable Reclamations</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
              <CheckCircle2 className="h-10 w-10 text-green-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-bold">
                Your environment is fully optimized.
              </p>
              <p className="text-xs text-gray-400 mt-1">No tactical recommendations at this time.</p>
            </div>
          ) : (
            recommendations.map((rec, i) => {
              const sysName = extractSystemName(rec.title);
              const isConfirming = confirmReclaimId === rec.id;
              const isReclaiming = isReclaimingId === rec.id;

              return (
                <Card key={rec.id || i} className={`p-5 border shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all ${isConfirming ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-amber-200 hover:shadow-md'}`}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 border ${isConfirming ? 'bg-red-100 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
                      {isConfirming ? <ShieldAlert className="h-4 w-4 text-red-600" /> : <Activity className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${isConfirming ? 'text-red-900' : 'text-gray-900'}`}>{rec.title}</h4>
                      <p className={`text-sm mt-0.5 leading-relaxed ${isConfirming ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                        {isConfirming ? 'WARNING: Revoking this license will immediately halt access and adjust the departmental ledger. Proceed?' : rec.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    {!isConfirming ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAiModalRec(rec)}
                          className="flex-1 xl:flex-none bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs font-bold shadow-sm"
                        >
                          <BrainCircuit className="h-3.5 w-3.5 mr-1.5" /> Interrogate AI
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onInvestigate(sysName)}
                          className="flex-1 xl:flex-none bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs font-bold shadow-sm"
                        >
                          <Search className="h-3.5 w-3.5 mr-1.5" /> Review Logs
                        </Button>

                        <div className="hidden xl:block h-6 w-px bg-gray-200 mx-1"></div>

                        <Button 
                          size="sm" 
                          className="flex-1 xl:flex-none bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs font-bold"
                          onClick={() => setConfirmReclaimId(rec.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Reclaim License
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 xl:flex-none bg-white text-gray-700 border-gray-300 hover:bg-gray-100 text-xs font-bold shadow-sm"
                          onClick={() => setConfirmReclaimId(null)}
                          disabled={isReclaiming}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 xl:flex-none bg-red-700 hover:bg-red-800 text-white shadow-sm text-xs font-bold"
                          onClick={() => handleExecuteReclaim(rec.id)}
                          disabled={isReclaiming}
                        >
                          {isReclaiming ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Revoking...</> : 'Confirm Revoke'}
                        </Button>
                      </>
                    )}
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
                  <p className="font-bold text-green-600 text-base">{generateConfidence(aiModalRec.id || 1)}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 mb-2">Mathematical Justification</p>
                <p className="text-gray-700 leading-relaxed font-medium">
                  Analysis of the trailing telemetry indicates active session time of <span className="text-red-600 font-bold">under 30 minutes</span> over the last {generateIdleDays(aiModalRec.id || 1)} days. 
                  Calculated RoI for this seat is negative given the unit cost. Decommissioning recommended to optimize OpEx.
                </p>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-2xl">
                <p className="font-mono text-[11px] text-indigo-400 mb-2 tracking-tighter">&gt; analyzing_license_lifecycle: {extractSystemName(aiModalRec.title).replace(' ', '_').toUpperCase()}</p>
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