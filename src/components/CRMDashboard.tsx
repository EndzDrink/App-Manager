import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Users, Activity, CheckCircle2, Clock, XCircle, 
  BarChart3, Inbox, RefreshCw, ChevronRight, 
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
  satisfaction_score: number; 
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
  
  // Pipeline State - EXPANDED to match database strings
  crm_status: 'pending' | 'deflected' | 'cleared' | 'Escalated to EA';
  crm_deflection_score: number;      
  crm_actioned_by: string | null;
  crm_actioned_at: string | null;
  
  // Pipeline State - EXPANDED to match database strings
  ea_status: 'pending' | 'blocked' | 'approved' | 'Awaiting EA Vetting' | 'Approved' | 'Rejected' | 'Vetoed';
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
  functionalCoverage: number;        
  costSavings: number;               
  gaps: string[];                   
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
    // Graceful fallback if required_capabilities is null/undefined or not an array
    const rawReqCaps = Array.isArray(request.required_capabilities) ? request.required_capabilities : [];
    const requiredCaps = new Set(rawReqCaps);
    
    // Graceful fallback if capabilities is null/undefined or not an array
    const rawSysCaps = Array.isArray(sys.capabilities) ? sys.capabilities : [];
    const matchedCaps = rawSysCaps.filter(cap => cap && cap.name && requiredCaps.has(cap.name));
    
    const coverage = requiredCaps.size > 0 ? matchedCaps.length / requiredCaps.size : 0;
    
    // Weight: coverage (60%) + adoption (20%) + satisfaction (20%)
    const activeUsers = typeof sys.active_users === 'number' ? sys.active_users : 0;
    const satisfactionScore = typeof sys.satisfaction_score === 'number' ? sys.satisfaction_score : 50;
    const monthlyCost = typeof sys.monthly_cost_per_seat === 'number' ? sys.monthly_cost_per_seat : 0;
    
    const adoptionScore = Math.min(activeUsers / 10, 1); 
    const weightedScore = (coverage * 0.6) + (adoptionScore * 0.2) + ((satisfactionScore / 100) * 0.2);
    
    return {
      sys: { ...sys, active_users: activeUsers, satisfaction_score: satisfactionScore, monthly_cost_per_seat: monthlyCost },
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
    recommendation = 'hybrid'; 
  } else {
    recommendation = 'escalate';
  }
  
  const estCostAnnual = typeof request.estimated_cost_annual === 'number' ? request.estimated_cost_annual : 0;
  const estUsers = typeof request.estimated_users === 'number' ? request.estimated_users : 1;
  const annualCostSavings = estCostAnnual - (best.sys.monthly_cost_per_seat * 12 * estUsers);
  
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
    demandData.filter(d => d.crm_status === 'cleared' || d.crm_status === 'Escalated to EA').length,
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
      .reduce((sum, d) => sum + (parseFloat(String(d.estimated_cost_annual)) || 0), 0),
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
      const cleanId = selectedRequest.id.replace('REQ-', '');
      const res = await fetch(`${API_URL}/api/requests/${cleanId}/vetting`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          crm_status: 'deflected',
          crm_deflection_score: Math.round(deflectionResult.functionalCoverage * 100),
          ea_status: 'Rejected', 
          ea_comments: `Deflected by CRM to existing tool: ${deflectionResult.existingTool?.name}`
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
        }
      });

      if (res.ok) {
        // Now update the specific CRM deflection score via the vetting endpoint
        const cleanId = selectedRequest.id.replace('REQ-', '');
        await fetch(`${API_URL}/api/requests/${cleanId}/vetting`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            crm_deflection_score: deflectionResult?.functionalCoverage 
              ? Math.round(deflectionResult.functionalCoverage * 100) 
              : 0
          })
        });

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
    if (req.crm_status === 'cleared' || req.crm_status === 'Escalated to EA' || req.ea_status === 'Awaiting EA Vetting') 
      return <span className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><ShieldCheck className="h-3 w-3 mr-1"/> With EA</span>;
    if (req.ea_status === 'Approved') 
      return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><CheckCircle2 className="h-3 w-3 mr-1"/> EA Approved</span>;
    if (req.ea_status === 'Rejected') 
      return <span className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><XCircle className="h-3 w-3 mr-1"/> EA Blocked</span>;
    
    return <span className="bg-yellow-100 text-yellow-700 border-yellow-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Clock className="h-3 w-3 mr-1"/> Needs Triage</span>;
  };

  const needsTriage = selectedRequest?.crm_status === 'pending';

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------
  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4 max-w-[1600px] mx-auto">
      
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        
        <Card className="xl:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Incoming Business Demand
            </h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Click to triage</span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                  <th className="py-3 px-6 font-bold">Request</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Pipeline Stage</th>
                  <th className="py-3 px-4 font-bold">Deflection Score</th>
                  <th className="py-3 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demandData.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  const requiresAttention = req.crm_status === 'pending';
                  
                  const reqCaps = Array.isArray(req.required_capabilities) ? req.required_capabilities : [];
                  
                  return (
                    <tr 
                      key={req.id} 
                      onClick={() => setSelectedRequest(req)}
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-blue-800">{req.system}</p>
                        <p className="text-[10px] text-gray-500 flex items-center mt-1 font-medium">
                          <Users className="h-3 w-3 mr-1 text-sky-500" /> {req.requester}
                        </p>
                        {reqCaps.length > 0 && (
                          <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                            {reqCaps.slice(0, 2).join(', ')}
                            {reqCaps.length > 2 && ` +${reqCaps.length - 2} more`}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded shadow-sm whitespace-nowrap">
                          {req.dept}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(req)}
                      </td>
                      <td className="py-4 px-4">
                        {req.crm_deflection_score !== null && req.crm_deflection_score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${req.crm_deflection_score < 30 ? 'bg-green-500' : req.crm_deflection_score < 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${req.crm_deflection_score}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-600">{req.crm_deflection_score}%</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          variant={requiresAttention ? "default" : "outline"} 
                          size="sm" 
                          className={`h-8 text-xs font-bold transition-all ${
                            requiresAttention 
                              ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-sm border-transparent' 
                              : 'text-blue-600 hover:bg-blue-50 border-blue-200'
                          }`}
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
              <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                <Inbox className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-bold text-gray-500">No requests logged.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden relative">
          <div className="p-4 border-b border-gray-100 shrink-0 bg-blue-900 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Layers className="h-4 w-4 mr-2 text-yellow-400" />
              Deflection Intelligence
            </h3>
          </div>
            
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
            {!selectedRequest ? (
              <div className="text-center py-16 text-gray-400 h-full flex flex-col items-center justify-center">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-20 text-blue-500" />
                <p className="text-sm font-bold text-gray-500">Select a request</p>
                <p className="text-[10px] mt-1 text-gray-400 px-4 max-w-[200px]">
                  The system will scan the Enterprise Catalog for functional overlaps and compute a deflection score.
                </p>
              </div>
            ) : !deflectionResult ? (
              <div className="flex items-center justify-center py-16 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center">
                    <Inbox className="h-3 w-3 mr-1.5" /> Requested System
                  </h4>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                    <p className="font-black text-blue-900 text-lg leading-tight mb-1">{selectedRequest.system}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-[9px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-black uppercase tracking-wider shadow-inner">
                        {selectedRequest.category}
                      </span>
                      <span className="text-[9px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        <Users className="inline h-3 w-3 mr-1 -mt-0.5" /> {selectedRequest.estimated_users || 1} seats
                      </span>
                      <span className="text-[9px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        ZAR {parseFloat(String(selectedRequest.estimated_cost_annual || 0)).toLocaleString()}/yr
                      </span>
                    </div>
                    {selectedRequest.justification && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Business Justification</p>
                        <p className="text-xs text-gray-700 leading-relaxed italic">"{selectedRequest.justification}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center">
                    <AlertTriangle className={`h-3 w-3 mr-1.5 ${deflectionResult.canDeflect ? 'text-green-500' : 'text-orange-500'}`} /> 
                    Catalog Scan Result
                  </h4>
                  
                  {deflectionResult.existingTool ? (
                    <div className="space-y-3">
                      <div className={`border p-4 rounded-xl shadow-sm ${deflectionResult.recommendation === 'deflect' ? 'bg-green-50 border-green-200' : deflectionResult.recommendation === 'hybrid' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">{deflectionResult.existingTool.name}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-0.5">{deflectionResult.existingTool.vendor}</p>
                          </div>
                          <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded border shadow-inner ${deflectionResult.recommendation === 'deflect' ? 'bg-green-100 text-green-700 border-green-200' : deflectionResult.recommendation === 'hybrid' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {deflectionResult.recommendation === 'deflect' ? 'STRONG MATCH' : deflectionResult.recommendation === 'hybrid' ? 'PARTIAL MATCH' : 'WEAK MATCH'}
                          </span>
                        </div>
                        
                        <div className="mb-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1.5">
                            <span className="uppercase tracking-wider">Functional Coverage</span>
                            <span className={`${deflectionResult.functionalCoverage >= 0.85 ? 'text-green-600' : deflectionResult.functionalCoverage >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(deflectionResult.functionalCoverage * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${deflectionResult.functionalCoverage >= 0.85 ? 'bg-green-500' : deflectionResult.functionalCoverage >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${deflectionResult.functionalCoverage * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        {deflectionResult.gaps.length > 0 && (
                          <div className="mt-2 mb-3">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Missing capabilities</p>
                            <div className="flex flex-wrap gap-1.5">
                              {deflectionResult.gaps.map(gap => (
                                <span key={gap} className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold shadow-sm">
                                  {gap}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Savings if deflected</span>
                          <span className="text-sm font-black text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200">ZAR {deflectionResult.costSavings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-5 rounded-xl flex items-start shadow-sm">
                      <CheckCircle2 className="h-6 w-6 mr-3 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-black text-green-800 tracking-tight">No Catalog Overlap</p>
                        <p className="text-xs text-green-700 mt-1 font-medium leading-relaxed">
                          No existing tool in the <span className="font-bold">{selectedRequest.category}</span> category. This appears to be a unique capability requirement.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
            
          {needsTriage && deflectionResult && (
            <div className="p-4 border-t border-gray-200 bg-white shrink-0 grid grid-cols-2 gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
              <Button 
                onClick={handleDeflect}
                disabled={isProcessing || !deflectionResult.canDeflect}
                variant="outline" 
                className={`w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-bold shadow-sm h-10 transition-all ${!deflectionResult.canDeflect ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' : ''}`}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1.5" /> Deflect</>}
              </Button>
              <Button 
                onClick={handleEscalateToEA}
                disabled={isProcessing}
                className="w-full bg-blue-800 hover:bg-blue-900 text-yellow-400 text-xs font-bold shadow-sm h-10 transition-transform active:scale-95"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4 mr-1.5" /> Escalate to EA</>}
              </Button>
            </div>
          )}
          
          {selectedRequest && !needsTriage && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1.5 text-gray-400" /> Triage Audit Trail
              </p>
              <div className="space-y-2.5 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">CRM Action</span>
                  <span className="font-black text-gray-900 uppercase tracking-wider">{selectedRequest.crm_status}</span>
                </div>
                <div className="w-full h-px bg-gray-100"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Deflection Score</span>
                  <span className="font-black text-gray-900">{selectedRequest.crm_deflection_score}%</span>
                </div>
                <div className="w-full h-px bg-gray-100"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Current Stage</span>
                  <span className="font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{selectedRequest.ea_status}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};