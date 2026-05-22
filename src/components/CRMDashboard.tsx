import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Users, Activity, CheckCircle2, Clock, XCircle, 
  BarChart3, TrendingUp, RefreshCw, ChevronRight, 
  Search, AlertTriangle, ArrowRight, ShieldCheck, Loader2,
  ArrowLeftRight, DollarSign, Layers
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
interface Capability {
  id: string;
  name: string;
  description: string;
}

interface System {
  id: string;
  name: string;
  vendor: string;
  category: string;
  capabilities: Capability[];
  integrations: string[];
  deployment_scope: 'enterprise' | 'departmental';
  active_users: number;
  monthly_cost_per_seat: number;
  satisfaction_score: number; // 0-100, derived from support tickets
}

interface DemandRequest {
  id: string;
  system: string;
  requester: string;
  dept: string;
  category: string;
  required_capabilities: string[];
  estimated_users: number;
  estimated_cost_annual: number;
  justification: string;
  
  // Pipeline State
  crm_status: 'pending' | 'deflected' | 'cleared';
  crm_deflection_score: number;      // 0-100: lower = strong overlap, higher = unique need
  crm_actioned_by: string | null;
  crm_actioned_at: string | null;
  
  ea_status: 'pending' | 'blocked' | 'approved';
  ea_alignment_score: number;
  ea_blockers: string[];
  
  pmo_status: 'pending' | 'rejected' | 'conditional' | 'approved';
  pmo_project_linkage: string | null;
  
  created_at: string;
  timeInStage: string;
}

interface DeflectionResult {
  canDeflect: boolean;
  existingTool: System | null;
  functionalCoverage: number;        // 0.0 - 1.0
  costSavings: number;               // ZAR annual
  gaps: string[];                   // What the existing tool misses
  recommendation: 'deflect' | 'escalate' | 'hybrid';
}

// ------------------------------------------------------------------
// PURE LOGIC: DEFLECTION ENGINE
// ------------------------------------------------------------------
const computeDeflection = (request: DemandRequest, catalog: System[]): DeflectionResult => {
  // 1. Find same-category tools
  const categoryMatches = catalog.filter(sys => sys.category === request.category);
  
  if (categoryMatches.length === 0) {
    return {
      canDeflect: false,
      existingTool: null,
      functionalCoverage: 0,
      costSavings: 0,
      gaps: [],
      recommendation: 'escalate'
    };
  }
  
  // 2. Score each match by capability overlap
  const scored = categoryMatches.map(sys => {
    const requiredCaps = new Set(request.required_capabilities);
    const matchedCaps = sys.capabilities.filter(cap => requiredCaps.has(cap.name));
    const coverage = requiredCaps.size > 0 ? matchedCaps.length / requiredCaps.size : 0;
    
    // Weight: coverage (60%) + adoption (20%) + satisfaction (20%)
    const adoptionScore = Math.min(sys.active_users / 10, 1); // normalize
    const weightedScore = (coverage * 0.6) + (adoptionScore * 0.2) + ((sys.satisfaction_score / 100) * 0.2);
    
    return {
      sys,
      coverage,
      weightedScore,
      matchedCaps: matchedCaps.map(c => c.name),
      missingCaps: Array.from(requiredCaps).filter(req => !matchedCaps.some(m => m.name === req))
    };
  }).sort((a, b) => b.weightedScore - a.weightedScore);
  
  const best = scored[0];
  
  // 3. Decision logic
  let recommendation: 'deflect' | 'escalate' | 'hybrid';
  if (best.coverage >= 0.85 && best.weightedScore > 0.7) {
    recommendation = 'deflect';
  } else if (best.coverage >= 0.5 && best.weightedScore > 0.4) {
    recommendation = 'hybrid'; // deflect + request feature addition
  } else {
    recommendation = 'escalate';
  }
  
  const annualCostSavings = request.estimated_cost_annual - (best.sys.monthly_cost_per_seat * 12 * request.estimated_users);
  
  return {
    canDeflect: recommendation !== 'escalate',
    existingTool: best.sys,
    functionalCoverage: best.coverage,
    costSavings: Math.max(0, annualCostSavings),
    gaps: best.missingCaps,
    recommendation
  };
};

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------
export const CRMDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [demandData, setDemandData] = useState<DemandRequest[]>([]);
  const [catalog, setCatalog] = useState<System[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DemandRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [reqRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/requests`, { headers }),
        fetch(`${API_URL}/api/systems?includeCapabilities=true`, { headers })
      ]);

      if (reqRes.ok) setDemandData(await reqRes.json());
      if (catRes.ok) setCatalog(await catRes.json());
    } catch (err) {
      console.error("Failed to fetch CRM data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ----------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // ----------------------------------------------------------------
  const deflectionResult = useMemo(() => {
    if (!selectedRequest) return null;
    return computeDeflection(selectedRequest, catalog);
  }, [selectedRequest, catalog]);

  const pendingTriage = useMemo(() => 
    demandData.filter(d => d.crm_status === 'pending').length,
    [demandData]
  );

  const clearedToEA = useMemo(() => 
    demandData.filter(d => d.crm_status === 'cleared').length,
    [demandData]
  );

  const deflectedCount = useMemo(() => 
    demandData.filter(d => d.crm_status === 'deflected').length,
    [demandData]
  );

  const deflectionRate = useMemo(() => 
    demandData.length > 0 ? Math.round((deflectedCount / demandData.length) * 100) : 0,
    [demandData, deflectedCount]
  );

  const opexSaved = useMemo(() => 
    demandData
      .filter(d => d.crm_status === 'deflected')
      .reduce((sum, d) => sum + (d.estimated_cost_annual || 0), 0),
    [demandData]
  );

  // ----------------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------------
  const handleDeflect = useCallback(async () => {
    if (!selectedRequest || !deflectionResult?.canDeflect) return;
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests/${selectedRequest.id}/deflect`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          crm_status: 'deflected',
          crm_deflection_score: deflectionResult.functionalCoverage * 100,
          deflected_to_system_id: deflectionResult.existingTool?.id,
          estimated_savings_zar: deflectionResult.costSavings,
          gaps: deflectionResult.gaps,
          // Auto-notify requester
          notify_requester: true,
          notify_message: `Your request for ${selectedRequest.system} has been deflected. ` +
            `The municipality already licenses ${deflectionResult.existingTool?.name} ` +
            `which covers ${Math.round(deflectionResult.functionalCoverage * 100)}% of your requirements. ` +
            (deflectionResult.gaps.length > 0 
              ? `Missing capabilities: ${deflectionResult.gaps.join(', ')}. ` 
              : '') +
            `Click here to request access or training.`
        })
      });

      if (res.ok) {
        await fetchData();
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRequest, deflectionResult, fetchData]);

  const handleEscalateToEA = useCallback(async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests/${selectedRequest.id}/escalate`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          crm_status: 'cleared',
          crm_deflection_score: deflectionResult?.functionalCoverage 
            ? (1 - deflectionResult.functionalCoverage) * 100 
            : 100,
          ea_status: 'pending',
          ea_alignment_score: null,
          crm_notes: deflectionResult?.existingTool 
            ? `CRM cleared: ${deflectionResult.existingTool.name} only covers ${Math.round((deflectionResult.functionalCoverage || 0) * 100)}%. Unique requirements justify new procurement.`
            : 'CRM cleared: No catalog overlap detected. Unique functional requirement.'
        })
      });

      if (res.ok) {
        await fetchData();
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRequest, deflectionResult, fetchData]);

  // ----------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------
  const getStatusBadge = (req: DemandRequest) => {
    if (req.crm_status === 'deflected') 
      return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><ArrowLeftRight className="h-3 w-3 mr-1"/> Deflected</span>;
    if (req.crm_status === 'cleared' && req.ea_status === 'pending') 
      return <span className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><ShieldCheck className="h-3 w-3 mr-1"/> With EA</span>;
    if (req.ea_status === 'approved') 
      return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><CheckCircle2 className="h-3 w-3 mr-1"/> EA Approved</span>;
    if (req.ea_status === 'blocked') 
      return <span className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><XCircle className="h-3 w-3 mr-1"/> EA Blocked</span>;
    
    return <span className="bg-yellow-100 text-yellow-700 border-yellow-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Clock className="h-3 w-3 mr-1"/> Needs Triage</span>;
  };

  const needsTriage = selectedRequest?.crm_status === 'pending';

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------
  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            CRM Demand & Deflection Hub
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Algorithmic overlap detection. Deflect redundant demand before it reaches EA.
          </p>
        </div>
        <Button 
          onClick={fetchData} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh Pipeline'}
        </Button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0">
        <MetricCard 
          icon={<BarChart3 className="h-5 w-5" />} 
          title="Total Demand" 
          value={demandData.length.toString()} 
          subtitle="All logged requests" 
        />
        <MetricCard 
          icon={<Clock className="h-5 w-5 text-yellow-500" />} 
          title="Triage Queue" 
          value={pendingTriage.toString()} 
          subtitle={<span className="text-yellow-600 font-bold text-[10px]">Awaiting overlap scan</span>} 
        />
        <MetricCard 
          icon={<ShieldCheck className="h-5 w-5 text-blue-500" />} 
          title="Cleared to EA" 
          value={clearedToEA.toString()} 
          subtitle={<span className="text-blue-600 font-bold text-[10px]">Unique requirements</span>} 
        />
        <MetricCard 
          icon={<ArrowLeftRight className="h-5 w-5 text-green-500" />} 
          title="Deflected" 
          value={deflectedCount.toString()} 
          subtitle={<span className="text-green-600 font-bold text-[10px]">Redirected to existing tool</span>} 
        />
        <MetricCard 
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />} 
          title="OPEX Saved" 
          value={`ZAR ${(opexSaved / 1000).toFixed(1)}k`} 
          subtitle={<span className="text-emerald-600 font-bold text-[10px]">Prevented duplicate spend</span>} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start flex-1 min-h-0">
        
        {/* DEMAND TABLE */}
        <Card className="xl:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Incoming Business Demand
            </h3>
            <span className="text-xs font-bold text-gray-500">Click to triage</span>
          </div>
          
          <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 relative bg-gray-50/30">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-100 border-b border-gray-200 z-10 shadow-sm">
                <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-6 font-bold">Request</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Pipeline Stage</th>
                  <th className="py-3 px-4 font-bold">Deflection Score</th>
                  <th className="py-3 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {demandData.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  const requiresAttention = req.crm_status === 'pending';
                  
                  return (
                    <tr 
                      key={req.id} 
                      onClick={() => setSelectedRequest(req)}
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-blue-800">{req.system}</p>
                        <p className="text-[10px] text-gray-500 flex items-center mt-1 font-medium">
                          <Users className="h-3 w-3 mr-1 text-sky-500" /> {req.requester}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          {req.required_capabilities.slice(0, 3).join(', ')}
                          {req.required_capabilities.length > 3 && ` +${req.required_capabilities.length - 3} more`}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[11px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                          {req.dept}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(req)}
                      </td>
                      <td className="py-4 px-4">
                        {req.crm_deflection_score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${req.crm_deflection_score < 30 ? 'bg-green-500' : req.crm_deflection_score < 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${req.crm_deflection_score}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-600">{req.crm_deflection_score}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          variant={requiresAttention ? "default" : "ghost"} 
                          size="sm" 
                          className={`h-8 text-xs font-bold ${requiresAttention ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
                        >
                          {requiresAttention ? 'Triage' : 'View'} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {demandData.length === 0 && (
              <div className="py-12 text-center text-sm font-medium text-gray-500">No requests logged.</div>
            )}
          </div>
        </Card>

        {/* TRIAGE WORKSPACE */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden relative">
          <div className="p-6 border-b border-gray-100 shrink-0 bg-blue-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Layers className="h-4 w-4 mr-2 text-yellow-400" />
              Deflection Intelligence
            </h3>
          </div>
            
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
            {!selectedRequest ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold text-gray-500">Select a request</p>
                <p className="text-[10px] mt-1 text-gray-400 px-4">
                  The system will scan the Enterprise Catalog for functional overlaps and compute a deflection score.
                </p>
              </div>
            ) : !deflectionResult ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                
                {/* REQUEST SUMMARY */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Requested System</h4>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <p className="font-black text-blue-900 text-lg leading-tight mb-1">{selectedRequest.system}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {selectedRequest.category}
                      </span>
                      <span className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-bold">
                        {selectedRequest.estimated_users} users
                      </span>
                      <span className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-bold">
                        ZAR {selectedRequest.estimated_cost_annual?.toLocaleString()}/yr
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">{selectedRequest.justification}</p>
                  </div>
                </div>

                {/* DEFLECTION ANALYSIS */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center">
                    <AlertTriangle className={`h-3 w-3 mr-1 ${deflectionResult.canDeflect ? 'text-green-500' : 'text-orange-500'}`} /> 
                    Catalog Scan Result
                  </h4>
                  
                  {deflectionResult.existingTool ? (
                    <div className="space-y-3">
                      {/* Match Card */}
                      <div className={`border p-4 rounded-xl shadow-sm ${deflectionResult.recommendation === 'deflect' ? 'bg-green-50 border-green-200' : deflectionResult.recommendation === 'hybrid' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{deflectionResult.existingTool.name}</p>
                            <p className="text-[10px] font-medium text-gray-500">{deflectionResult.existingTool.vendor}</p>
                          </div>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded ${deflectionResult.recommendation === 'deflect' ? 'bg-green-100 text-green-700' : deflectionResult.recommendation === 'hybrid' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {deflectionResult.recommendation === 'deflect' ? 'STRONG MATCH' : deflectionResult.recommendation === 'hybrid' ? 'PARTIAL MATCH' : 'WEAK MATCH'}
                          </span>
                        </div>
                        
                        {/* Coverage Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                            <span>Functional Coverage</span>
                            <span>{Math.round(deflectionResult.functionalCoverage * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${deflectionResult.functionalCoverage >= 0.85 ? 'bg-green-500' : deflectionResult.functionalCoverage >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${deflectionResult.functionalCoverage * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Gaps */}
                        {deflectionResult.gaps.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] font-bold text-gray-500 mb-1">Missing capabilities:</p>
                            <div className="flex flex-wrap gap-1">
                              {deflectionResult.gaps.map(gap => (
                                <span key={gap} className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                                  {gap}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Cost Impact */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500">Annual savings if deflected:</span>
                          <span className="text-sm font-black text-green-700">ZAR {deflectionResult.costSavings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start shadow-sm">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-green-800">No Catalog Overlap</p>
                        <p className="text-[10px] text-green-700 mt-1">
                          No existing tool in the {selectedRequest.category} category. This appears to be a unique requirement.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
            
          {/* ACTION BAR */}
          {needsTriage && deflectionResult && (
            <div className="p-5 border-t border-gray-100 bg-white shrink-0 grid grid-cols-2 gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
              <Button 
                onClick={handleDeflect}
                disabled={isProcessing || !deflectionResult.canDeflect}
                variant="outline" 
                className={`w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-bold shadow-sm h-10 ${!deflectionResult.canDeflect ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1.5" /> Deflect to Existing</>}
              </Button>
              <Button 
                onClick={handleEscalateToEA}
                disabled={isProcessing}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-sm h-10"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4 mr-1.5" /> Escalate to EA</>}
              </Button>
            </div>
          )}
          
          {/* If already actioned, show audit trail */}
          {selectedRequest && !needsTriage && (
            <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Audit Trail</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">CRM Action:</span>
                  <span className="font-bold text-gray-900">{selectedRequest.crm_status}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">Deflection Score:</span>
                  <span className="font-bold text-gray-900">{selectedRequest.crm_deflection_score}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">Current Stage:</span>
                  <span className="font-bold text-blue-700">{selectedRequest.ea_status}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};