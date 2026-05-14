import React, { useState, useEffect } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Users, Activity, CheckCircle2, Clock, XCircle, 
  BarChart3, TrendingUp, RefreshCw, ChevronRight , 
  Search, AlertTriangle, ArrowRight, ShieldCheck, Loader2
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const CRMDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [demandData, setDemandData] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  
  // New State for CRM Triage
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [reqRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/requests`, { headers }),
        fetch(`${API_URL}/api/systems`, { headers })
      ]);

      if (reqRes.ok) setDemandData(await reqRes.json());
      if (catRes.ok) setCatalog(await catRes.json());
      
    } catch (err) {
      console.error("Failed to fetch CRM data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriageAction = async (action: 'Vetoed' | 'Approved') => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests/${selectedRequest.id}/vetting`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alignment_score: action === 'Approved' ? 50 : 0, // 50 means CRM approved, waiting for EA to finalize
          ea_status: action === 'Approved' ? 'Awaiting EA Vetting' : 'Vetoed',
          ea_comments: action === 'Approved' 
            ? 'CRM Triage Passed: No viable internal alternatives found. Forwarded to EA.' 
            : 'CRM Triage Rejected: Viable alternatives exist in the current Enterprise Catalog.'
        })
      });

      if (res.ok) {
        await fetchData();
        setSelectedRequest(null);
      } else {
        alert("Action failed. Check permissions.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalRequests = demandData.length;
  // FIX: Make the pending count logic tolerant of nulls
  const pendingTriage = demandData.filter(d => d.status === 'Pending' || d.score === 0 || !d.score).length;
  const forwardedToEA = demandData.filter(d => d.ea_status === 'Awaiting EA Vetting' && d.score > 0).length;
  const rejectedCount = demandData.filter(d => d.ea_status === 'Vetoed').length;
  
  const deflectionRate = totalRequests > 0 ? Math.round((rejectedCount / totalRequests) * 100) : 0;

  const getStatusBadge = (req: any) => {
    if (req.ea_status === 'Vetoed') return <span className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><XCircle className="h-3 w-3 mr-1"/> Deflected (Rejected)</span>;
    if (req.ea_status === 'Approved' || req.status === 'Funded & Active') return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><CheckCircle2 className="h-3 w-3 mr-1"/> EA Approved</span>;
    if (req.score > 0) return <span className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><ShieldCheck className="h-3 w-3 mr-1"/> With EA for Vetting</span>;
    
    return <span className="bg-yellow-100 text-yellow-700 border-yellow-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Clock className="h-3 w-3 mr-1"/> Needs CRM Triage</span>;
  };

  // Helper to find overlaps for the selected request
  const getOverlaps = () => {
    if (!selectedRequest) return [];
    const requestedSystemInCatalog = catalog.find(c => c.name === selectedRequest.system);
    if (!requestedSystemInCatalog) return [];
    
    return catalog.filter(c => 
      c.category === requestedSystemInCatalog.category && 
      c.id !== requestedSystemInCatalog.id
    );
  };

  const overlaps = getOverlaps();
  const requestedAppDetails = catalog.find(c => c?.name === selectedRequest?.system);

  // FIX: The robust logic check to see if this request still needs CRM Triage
  const needsTriage = selectedRequest && 
                      selectedRequest.ea_status !== 'Vetoed' && 
                      selectedRequest.ea_status !== 'Approved' && 
                      (!selectedRequest.score || selectedRequest.score === 0);

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            CRM Demand & Triage Hub
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Vet incoming requests against existing capabilities before escalating to EA.</p>
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

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
        <MetricCard 
          icon={<BarChart3 className="h-5 w-5" />} 
          title="Total Demand" 
          value={totalRequests.toString()} 
          subtitle="All logged business requests" 
        />
        <MetricCard 
          icon={<Search className="h-5 w-5 text-yellow-500" />} 
          title="CRM Triage Queue" 
          value={pendingTriage.toString()} 
          subtitle={<span className="text-yellow-600 font-bold text-[10px]">Awaiting functional overlap check</span>} 
        />
        <MetricCard 
          icon={<ShieldCheck className="h-5 w-5 text-blue-500" />} 
          title="Escalated to EA" 
          value={forwardedToEA.toString()} 
          subtitle={<span className="text-blue-600 font-bold text-[10px]">Cleared CRM, with Architecture</span>} 
        />
        <MetricCard 
          icon={<TrendingUp className="h-5 w-5 text-green-500" />} 
          title="Deflection Rate" 
          value={`${deflectionRate}%`} 
          subtitle={<span className="text-green-600 font-bold text-[10px]">Redundant requests stopped by CRM</span>} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start flex-1 min-h-0">
        
        {/* MAIN DEMAND TABLE */}
        <Card className="xl:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Incoming Business Demand
            </h3>
            <span className="text-xs font-bold text-gray-500">Click any request to Triage</span>
          </div>
          
          <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 relative bg-gray-50/30">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-100 border-b border-gray-200 z-10 shadow-sm">
                <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-6 font-bold">Request Details</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Triage Status</th>
                  <th className="py-3 px-4 font-bold">Time in Queue</th>
                  <th className="py-3 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {demandData.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  // If it needs triage, draw attention to the row
                  const requiresAttention = (!req.score || req.score === 0) && req.ea_status !== 'Vetoed';
                  
                  return (
                    <tr 
                      key={req.id} 
                      onClick={() => setSelectedRequest(req)}
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-blue-800">{req.system}</p>
                        <p className="text-[10px] text-gray-500 flex items-center mt-1 font-medium">
                          <Users className="h-3 w-3 mr-1 text-sky-500" /> Req: {req.requester}
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
                        <span className="text-[11px] font-bold text-gray-600">
                          {req.timeInStage || 'Just now'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {/* FIX: Clearer Button Label */}
                        <Button variant={requiresAttention ? "default" : "ghost"} size="sm" className={`h-8 text-xs font-bold ${requiresAttention ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}>
                          {requiresAttention ? 'Triage Request' : 'Inspect'} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {demandData.length === 0 && (
              <div className="py-12 text-center text-sm font-medium text-gray-500">No requests have been logged yet.</div>
            )}
          </div>
        </Card>

        {/* CRM TRIAGE WORKSPACE (RIGHT SIDEBAR) */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden relative">
          <div className="p-6 border-b border-gray-100 shrink-0 bg-blue-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Search className="h-4 w-4 mr-2 text-yellow-400" />
              Capability Overlap Checker
            </h3>
          </div>
            
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
            {!selectedRequest ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold text-gray-500">Select a request to triage</p>
                <p className="text-[10px] mt-1 text-gray-400 px-4">The system will automatically scan the Enterprise Catalog for functional duplicates.</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                
                {/* Target Information */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Requested System</h4>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <p className="font-black text-blue-900 text-lg leading-tight mb-1">{selectedRequest.system}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {requestedAppDetails?.category || 'Unknown Category'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overlap Intelligence */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" /> Enterprise Catalog Scan
                  </h4>
                  
                  {overlaps.length > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-xs font-bold text-orange-800 shadow-sm">
                        Warning: We already own {overlaps.length} system(s) in the '{requestedAppDetails?.category}' category.
                      </div>
                      
                      {overlaps.map(alt => (
                        <div key={alt.id} className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{alt.name}</p>
                            <p className="text-[10px] font-medium text-gray-500 mt-0.5">{alt.vendor}</p>
                          </div>
                          <span className="bg-green-50 text-green-700 border border-green-200 text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                            Active Catalog
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start shadow-sm">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-green-800">No Overlaps Detected</p>
                        <p className="text-[10px] text-green-700 mt-1">This appears to be a unique functional requirement. Safe to escalate to Enterprise Architecture for technical vetting.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
            
          {/* FIX: The Action Buttons at the bottom will now properly render for null scores */}
          {needsTriage && (
            <div className="p-5 border-t border-gray-100 bg-white shrink-0 grid grid-cols-2 gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
              <Button 
                onClick={() => handleTriageAction('Vetoed')}
                disabled={isProcessing}
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-bold shadow-sm h-10"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1.5" /> Deflect / Reject</>}
              </Button>
              <Button 
                onClick={() => handleTriageAction('Approved')}
                disabled={isProcessing}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-sm h-10"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4 mr-1.5" /> Push to EA</>}
              </Button>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};