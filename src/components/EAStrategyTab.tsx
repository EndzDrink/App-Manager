import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, AlertTriangle, CheckCircle, XCircle, 
  BarChart3, Server, Loader2, Fingerprint, RefreshCw, LayoutTemplate, Network, Database, Briefcase
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EARequest {
  id: string; 
  system: string;
  requester: string;
  dept: string;
  score: number;
  ea_status: string; 
  created_at: string; 
  ea_comments?: string;
  alignment_score?: number;
}

export const EAStrategyTab = () => {
  const [requests, setRequests] = useState<EARequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EARequest | null>(null);
  
  // Vetting States
  const [score, setScore] = useState(50);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<string | null>('Awaiting EA Vetting');

  // TOGAF 10 Domain Assessment States (Visual only for dashboard interactivity)
  const [domainScores, setDomainScores] = useState({
    business: true,
    data: true,
    application: false,
    technology: true
  });

  const fetchEARequests = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Fetch all requests to build comprehensive EA metrics
          setRequests(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch EA requests:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchEARequests(); 
  }, []);

  const handleSelectRequest = (req: EARequest) => {
    setSelectedRequest(req);
    setScore(req.alignment_score || 50);
    setComments(req.ea_comments || "");
  };

  const handleVetting = async (status: 'Approved' | 'Vetoed') => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    
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
          alignment_score: score,
          ea_status: status,
          ea_comments: comments
        })
      });
      
      if (res.ok) {
        setSelectedRequest(null);
        setScore(50);
        setComments("");
        fetchEARequests();
      } else {
        const errorData = await res.json();
        alert(`Vetting failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Vetting failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDomain = (domain: keyof typeof domainScores) => {
    setDomainScores(prev => ({ ...prev, [domain]: !prev[domain] }));
    // Auto-adjust score based on TOGAF domain compliance
    const newCount = Object.values({ ...domainScores, [domain]: !domainScores[domain] }).filter(Boolean).length;
    setScore(Math.max(25, newCount * 25));
  };

  // ----------------------------------------------------------------
  // MEMOIZED COMPUTATIONS & FILTERING
  // ----------------------------------------------------------------
  const pendingCount = useMemo(() => requests.filter(r => r.ea_status === 'Awaiting EA Vetting').length, [requests]);
  const approvedCount = useMemo(() => requests.filter(r => r.ea_status === 'Approved').length, [requests]);
  const vetoedCount = useMemo(() => requests.filter(r => r.ea_status === 'Rejected' || r.ea_status === 'Vetoed').length, [requests]);
  
  const avgScore = useMemo(() => {
    const scoredReqs = requests.filter(r => r.alignment_score && r.alignment_score > 0);
    if (!scoredReqs.length) return 0;
    const sum = scoredReqs.reduce((acc, curr) => acc + (curr.alignment_score || 0), 0);
    return Math.round(sum / scoredReqs.length);
  }, [requests]);

  const displayedRequests = useMemo(() => {
    if (!activeFilter) return requests;
    if (activeFilter === 'Vetoed') return requests.filter(r => r.ea_status === 'Rejected' || r.ea_status === 'Vetoed');
    return requests.filter(r => r.ea_status === activeFilter);
  }, [requests, activeFilter]);

  const handleFilterToggle = (filterType: string) => {
    setActiveFilter(prev => prev === filterType ? null : filterType);
    setSelectedRequest(null);
  };

  const InteractiveMetricCard = ({ title, value, subtitle, icon, filterKey }: any) => {
    const isActive = activeFilter === filterKey;
    return (
      <div 
        onClick={() => filterKey && handleFilterToggle(filterKey)}
        className={`cursor-pointer transition-all duration-200 h-full ${
          isActive 
            ? 'ring-2 ring-blue-500 scale-[1.02] shadow-md z-10 relative rounded-xl' 
            : 'hover:scale-[1.01] hover:shadow-sm'
        }`}
      >
        <MetricCard icon={icon} title={title} value={value} subtitle={subtitle} />
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
            Active Filter <XCircle className="h-3 w-3 ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveFilter(null); }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4 max-w-[1600px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Fingerprint className="h-6 w-6 mr-2 text-blue-600" />
            Enterprise Architecture Strategy
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Govern IT investments through strict architectural domain alignment.</p>
        </div>
        <div className="flex gap-3">
          {activeFilter && (
            <Button variant="ghost" onClick={() => setActiveFilter(null)} className="text-gray-500 text-xs font-bold hover:bg-gray-100">
              Clear Filters
            </Button>
          )}
          <Button 
            onClick={fetchEARequests} 
            disabled={isRefreshing}
            variant="outline" 
            className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh Queue'}
          </Button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="h-full">
          <MetricCard 
            icon={<BarChart3 className="h-5 w-5" />} 
            title="Strategic Alignment" 
            value={`${avgScore}%`} 
            subtitle={<span className="text-blue-600 font-bold text-[10px]">Average across approved systems</span>}
          />
        </div>
        <InteractiveMetricCard 
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />} 
          title="Pending Vetting" 
          value={pendingCount.toString()} 
          subtitle={<span className="text-yellow-600 font-bold text-[10px]">Awaiting architectural review</span>} 
          filterKey="Awaiting EA Vetting"
        />
        <InteractiveMetricCard 
          icon={<ShieldCheck className="h-5 w-5 text-green-500" />} 
          title="Approved Assets" 
          value={approvedCount.toString()} 
          subtitle={<span className="text-green-600 font-bold text-[10px]">Cleared for PMO funding</span>} 
          filterKey="Approved"
        />
        <InteractiveMetricCard 
          icon={<XCircle className="h-5 w-5 text-red-500" />} 
          title="Vetoed Assets" 
          value={vetoedCount.toString()} 
          subtitle={<span className="text-red-600 font-bold text-[10px]">Blocked due to misalignment</span>} 
          filterKey="Vetoed"
        />
      </div>

      {/* SPLIT PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* PENDING REQUESTS LIST */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center">
              <LayoutTemplate className="h-4 w-4 mr-2 text-blue-600" />
              Architecture Queue {activeFilter && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Filtered View</span>}
            </h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white px-2 py-1 rounded border border-gray-200">
              {displayedRequests.length} Records
            </span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-4 bg-gray-50/30">
            {displayedRequests.length === 0 ? (
              <div className="py-16 text-center h-full flex flex-col justify-center">
                <ShieldCheck className="h-10 w-10 text-green-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">Queue Clear</p>
                <p className="text-xs text-gray-400 mt-1">No requests match this status.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedRequests.map(req => {
                  const isSelected = selectedRequest?.id === req.id;
                  let statusColor = "bg-yellow-100 text-yellow-700 border-yellow-200";
                  if (req.ea_status === 'Approved') statusColor = "bg-green-100 text-green-700 border-green-200";
                  if (req.ea_status === 'Rejected' || req.ea_status === 'Vetoed') statusColor = "bg-red-100 text-red-700 border-red-200";

                  return (
                    <div 
                      key={req.id} 
                      onClick={() => handleSelectRequest(req)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300 bg-white shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">{req.id}</p>
                          <h4 className="font-bold text-gray-900 text-sm">{req.system || "System Request"}</h4>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border tracking-wider ${statusColor}`}>
                          {req.ea_status === 'Awaiting EA Vetting' ? 'Pending EA' : req.ea_status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] text-gray-500 font-medium">Dept: <strong className="text-gray-700">{req.dept || 'Unknown'}</strong></p>
                        <p className="text-[10px] text-gray-400 font-medium flex items-center">
                          {req.alignment_score ? <span className="mr-2 font-bold text-blue-600">Score: {req.alignment_score}%</span> : null}
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* VETTING CONSOLE */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden relative">
          <div className="p-4 border-b border-gray-100 bg-blue-900 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-yellow-400" />
              Architecture Vetting Console
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50">
            {selectedRequest ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Capability Under Review</p>
                   <p className="text-xl font-black text-blue-900">{selectedRequest.system}</p>
                   {selectedRequest.ea_status !== 'Awaiting EA Vetting' && (
                     <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                       <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Previous Audit Notes</p>
                       <p className="text-xs text-gray-700 italic">"{selectedRequest.ea_comments || 'No comments provided.'}"</p>
                     </div>
                   )}
                </div>

                {/* ADM / Architecture Domains Assessment */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center">
                    <Network className="h-3 w-3 mr-1.5" /> Core Architecture Domains (BDAT)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button onClick={() => toggleDomain('business')} className={`p-3 rounded-lg border text-left transition-all ${domainScores.business ? 'bg-green-50 border-green-300 ring-1 ring-green-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <Briefcase className={`h-4 w-4 ${domainScores.business ? 'text-green-600' : 'text-gray-400'}`} />
                        {domainScores.business && <CheckCircle className="h-3 w-3 text-green-500" />}
                      </div>
                      <p className={`text-xs font-bold ${domainScores.business ? 'text-green-900' : 'text-gray-600'}`}>Business Arch</p>
                    </button>
                    
                    <button onClick={() => toggleDomain('data')} className={`p-3 rounded-lg border text-left transition-all ${domainScores.data ? 'bg-green-50 border-green-300 ring-1 ring-green-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <Database className={`h-4 w-4 ${domainScores.data ? 'text-green-600' : 'text-gray-400'}`} />
                        {domainScores.data && <CheckCircle className="h-3 w-3 text-green-500" />}
                      </div>
                      <p className={`text-xs font-bold ${domainScores.data ? 'text-green-900' : 'text-gray-600'}`}>Data Arch</p>
                    </button>

                    <button onClick={() => toggleDomain('application')} className={`p-3 rounded-lg border text-left transition-all ${domainScores.application ? 'bg-green-50 border-green-300 ring-1 ring-green-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <LayoutTemplate className={`h-4 w-4 ${domainScores.application ? 'text-green-600' : 'text-gray-400'}`} />
                        {domainScores.application && <CheckCircle className="h-3 w-3 text-green-500" />}
                      </div>
                      <p className={`text-xs font-bold ${domainScores.application ? 'text-green-900' : 'text-gray-600'}`}>Application Arch</p>
                    </button>

                    <button onClick={() => toggleDomain('technology')} className={`p-3 rounded-lg border text-left transition-all ${domainScores.technology ? 'bg-green-50 border-green-300 ring-1 ring-green-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <Server className={`h-4 w-4 ${domainScores.technology ? 'text-green-600' : 'text-gray-400'}`} />
                        {domainScores.technology && <CheckCircle className="h-3 w-3 text-green-500" />}
                      </div>
                      <p className={`text-xs font-bold ${domainScores.technology ? 'text-green-900' : 'text-gray-600'}`}>Technology Arch</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                    <span>Computed Alignment Score</span>
                    <span className={`px-2 py-1 rounded text-white text-xs font-black ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}>{score}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" value={score} 
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${score >= 75 ? 'accent-green-600 bg-green-100' : score >= 50 ? 'accent-orange-500 bg-orange-100' : 'accent-red-600 bg-red-100'}`}
                  />
                  <div className="flex justify-between text-[9px] font-black text-gray-400 mt-2 uppercase tracking-widest">
                    <span>High Debt / Misaligned</span>
                    <span>Fully Compliant</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Governance Audit Notes</label>
                  <textarea 
                    className="w-full p-4 border border-gray-200 rounded-xl text-sm h-28 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner bg-white placeholder-gray-300 transition-all"
                    placeholder="Provide justification for the alignment score and architectural exceptions..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-16">
                <ShieldCheck className="h-16 w-16 text-blue-300 mb-4" />
                <p className="text-sm font-bold text-gray-600">No Target Selected</p>
                <p className="text-[10px] font-medium text-gray-400 mt-1 max-w-[200px]">Select a request from the queue to assess its architectural alignment.</p>
              </div>
            )}
          </div>
            
          {selectedRequest && (
            <div className="p-4 border-t border-gray-200 bg-white shrink-0 grid grid-cols-2 gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
              <Button 
                onClick={() => handleVetting('Vetoed')}
                disabled={isSubmitting}
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-bold shadow-sm h-10 transition-all"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1.5" /> Veto Request</>}
              </Button>
              <Button 
                onClick={() => handleVetting('Approved')}
                disabled={isSubmitting || score < 50}
                className={`w-full text-xs font-bold shadow-sm h-10 transition-transform ${score < 50 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'}`}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1.5" /> Approve for PMO</>}
              </Button>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};