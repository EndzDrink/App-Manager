import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Laptop, Server, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, ShieldQuestion, Activity, Box, ExternalLink, ChevronDown
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const StaffDashboard = () => {
  const [activeApps, setActiveApps] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  const fetchMyData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Active Subscriptions
      const subRes = await fetch(`${API_URL}/api/subscriptions`, { headers });
      if (subRes.ok) {
        const subData = await subRes.json();
        const myUserId = JSON.parse(localStorage.getItem('appManagerUser') || '{}').id;
        setActiveApps(subData.filter((s: any) => s.assigned_user_id === myUserId));
      }

      // Fetch Procurement Pipeline (Requests)
      const reqRes = await fetch(`${API_URL}/api/requests/me`, { headers });
      if (reqRes.ok) {
        setPendingRequests(await reqRes.json());
      }
    } catch (err) {
      console.error("Failed to load staff data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  // Filter out requests that have been fully procured/fulfilled
  const activePipeline = pendingRequests.filter(req => req.status !== 'Fulfilled');

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-black text-blue-900 flex items-center tracking-tight">
            <Laptop className="h-6 w-6 mr-2 text-sky-500" />
            My Digital Workspace
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Manage your active software entitlements and track procurement requests.</p>
        </div>
        <Button 
          onClick={fetchMyData} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
          Sync Workspace
        </Button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
        <Card className="p-5 border-l-4 border-l-green-500 bg-white shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-4 shrink-0">
            <Server className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Active Systems</p>
            <p className="text-2xl font-black text-gray-800">{activeApps.length}</p>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-yellow-500 bg-white shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center mr-4 shrink-0">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Pending Requests</p>
            <p className="text-2xl font-black text-gray-800">{activePipeline.length}</p>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-blue-500 bg-white shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 shrink-0">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Workspace Status</p>
            <p className="text-sm font-black text-blue-700 mt-1">MFMA Compliant</p>
          </div>
        </Card>
      </div>

      {/* SPLIT PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* LEFT PANE: ACTIVE ENTITLEMENTS (INTERACTIVE) */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center">
              <Box className="h-4 w-4 mr-2 text-sky-500" />
              Active Entitlements
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/20">
            {activeApps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Server className="h-10 w-10 mb-3 text-gray-400" />
                <p className="text-sm font-bold text-gray-600">No active systems</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">You currently do not have any software licenses assigned to your identity.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeApps.map((app, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between group hover:border-sky-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded bg-sky-50 flex items-center justify-center mr-4 border border-sky-100 shrink-0">
                        <Server className="h-5 w-5 text-sky-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 group-hover:text-sky-700 transition-colors">{app.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{app.category}</p>
                      </div>
                    </div>
                    
                    {/* Interactive Launch Button */}
                    <Button 
                      size="sm" 
                      className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => alert(`Launching ${app.name} in a new secure tab...`)}
                    >
                      Launch <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT PANE: PROCUREMENT PIPELINE (FILTERED) */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-500" />
              Procurement Pipeline
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/20">
            {activePipeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <ShieldQuestion className="h-10 w-10 mb-3 text-gray-400" />
                <p className="text-sm font-bold text-gray-600">Pipeline empty</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">You have no pending software requests. Browse the Enterprise Catalog to request tools.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activePipeline.map((req, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-yellow-300 transition-all group">
                    <div className="flex justify-between items-start mb-3 cursor-default">
                      <div>
                        <p className="font-bold text-sm text-gray-900 group-hover:text-yellow-700 transition-colors">{req.system_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">ID: {req.id}</p>
                      </div>
                      
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center ${
                        req.ea_status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                        req.ea_status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {req.ea_status === 'Approved' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : 
                         req.ea_status === 'Rejected' ? <AlertCircle className="h-3 w-3 mr-1" /> : 
                         <Clock className="h-3 w-3 mr-1" />}
                        {req.ea_status}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div className={`h-1.5 rounded-full ${
                        req.ea_status === 'Approved' ? 'w-full bg-green-500' : 
                        req.ea_status === 'Rejected' ? 'w-full bg-red-500' : 
                        req.ea_status === 'Awaiting EA Vetting' ? 'w-1/2 bg-yellow-400' : 'w-1/4 bg-blue-400'
                      }`}></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 mb-2">
                      <span>Requested</span>
                      <span>Vetting</span>
                      <span>Authorized</span>
                    </div>

                    {/* Interactive Expand Hint & Toggle */}
                    <div className="pt-2 mt-2 border-t border-gray-50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setExpandedAuditId(expandedAuditId === req.id ? null : req.id)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center transition-colors focus:outline-none"
                      >
                        {expandedAuditId === req.id ? 'Close Audit Trail' : 'View Audit Trail'} 
                        <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${expandedAuditId === req.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* The Audit Trail Drawer */}
                    {expandedAuditId === req.id && (
                      <div className="mt-3 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300 cursor-default">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Governance Pipeline Audit</h4>
                        
                        <div className="relative pl-4 space-y-5 before:absolute before:inset-y-0 before:left-[7px] before:w-[2px] before:bg-gray-100">
                          
                          {/* Step 1: Request Origin */}
                          <div className="relative">
                            <div className="absolute -left-[20px] top-0.5 h-3.5 w-3.5 rounded-full bg-green-500 ring-4 ring-white shadow-sm flex items-center justify-center">
                              <CheckCircle2 className="h-2 w-2 text-white" />
                            </div>
                            <p className="text-[10px] font-bold text-gray-900 leading-none">Demand Lodged</p>
                            <p className="text-[9px] text-gray-500 mt-1">{new Date(req.request_date).toLocaleString()}</p>
                          </div>

                          {/* Step 2: EA Vetting */}
                          <div className="relative">
                            <div className={`absolute -left-[20px] top-0.5 h-3.5 w-3.5 rounded-full ring-4 ring-white shadow-sm flex items-center justify-center ${
                              req.ea_status === 'Approved' ? 'bg-green-500' :
                              req.ea_status === 'Rejected' ? 'bg-red-500' :
                              'bg-yellow-400'
                            }`}>
                               {req.ea_status === 'Approved' ? <CheckCircle2 className="h-2 w-2 text-white" /> : 
                                req.ea_status === 'Rejected' ? <AlertCircle className="h-2 w-2 text-white" /> : 
                                <Clock className="h-2 w-2 text-white" />}
                            </div>
                            <p className="text-[10px] font-bold text-gray-900 leading-none">EA Architectural Vetting</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                req.ea_status === 'Approved' ? 'bg-green-100 text-green-700' :
                                req.ea_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{req.ea_status}</span>
                              {req.alignment_score > 0 && (
                                <span className="text-[9px] font-bold text-blue-600">Score: {req.alignment_score}%</span>
                              )}
                            </div>
                            {req.ea_comments && (
                              <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-100 text-[10px] text-gray-600 italic shadow-inner">
                                "{req.ea_comments}"
                              </div>
                            )}
                          </div>

                          {/* Step 3: PMO / Fulfillment */}
                          <div className="relative">
                            <div className={`absolute -left-[20px] top-0.5 h-3.5 w-3.5 rounded-full ring-4 ring-white shadow-sm flex items-center justify-center ${
                              req.status === 'Fulfilled' ? 'bg-green-500' :
                              req.ea_status === 'Approved' ? 'bg-yellow-400' :
                              'bg-gray-200'
                            }`}>
                              {req.status === 'Fulfilled' ? <CheckCircle2 className="h-2 w-2 text-white" /> : 
                               req.ea_status === 'Approved' ? <Clock className="h-2 w-2 text-white" /> : 
                               <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />}
                            </div>
                            <p className="text-[10px] font-bold text-gray-900 leading-none">PMO Capital Fulfillment</p>
                            <p className="text-[9px] text-gray-500 mt-1">
                              {req.status === 'Fulfilled' ? 'License officially provisioned to identity.' : 
                               req.ea_status === 'Approved' ? 'Awaiting PMO budget allocation and vendor execution.' : 
                               'Locked pending architectural approval.'}
                            </p>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};