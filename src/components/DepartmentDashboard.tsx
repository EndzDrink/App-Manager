import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, Users, Wallet, CheckCircle2, XCircle, 
  Clock, AlertTriangle, RefreshCw, Inbox, Trash2, Loader2, Lock, ShieldAlert
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const DepartmentDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const [departmentData, setDepartmentData] = useState<any>({
    name: localStorage.getItem('appManagerDeptName') || 'My Department',
    allocated_budget: 150000, 
    totalSpend: 0
  });
  const [teamEntitlements, setTeamEntitlements] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const fetchDepartmentData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // In a real app, these endpoints would filter by deptId automatically via the backend token
      const [subRes, reqRes, userRes] = await Promise.all([
        fetch(`${API_URL}/api/subscriptions`, { headers }),
        fetch(`${API_URL}/api/requests`, { headers }),
        fetch(`${API_URL}/api/users`, { headers })
      ]);

      if (subRes.ok && reqRes.ok && userRes.ok) {
        const allSubs = await subRes.json();
        const allReqs = await reqRes.json();
        const allUsers = await userRes.json();

        // Filter for this specific department's data
        const deptUsers = allUsers.filter((u: any) => u.department === departmentData.name);
        const userIds = deptUsers.map((u: any) => u.id);
        
        const myTeamSubs = allSubs.filter((sub: any) => 
        userIds.includes(sub.assigned_user_id) || 
        sub.department === departmentData.name || 
        sub.owning_dept === departmentData.name
        );
        const myTeamReqs = allReqs.filter((req: any) => req.dept === departmentData.name && req.status === 'Awaiting Manager Approval');

        const currentSpend = myTeamSubs.reduce((sum: number, sub: any) => {
            const cost = parseFloat(sub.price || sub.monthly_cost || 0);
            return sum + cost;
          }, 0);

        // Enrich subscriptions with mock "Idle" status for the hitlist
        const enrichedSubs = myTeamSubs.map((sub: any, idx: number) => ({
          ...sub,
          assignedEmail: deptUsers.find((u:any) => u.id === sub.assigned_user_id)?.email || 'Unassigned',
          isIdle: idx % 4 === 0 // Mocking that every 4th license is sitting idle
        }));

        setTeamEntitlements(enrichedSubs);
        setPendingRequests(myTeamReqs);
        setDepartmentData(prev => ({ ...prev, totalSpend: currentSpend }));
      }
    } catch (err) {
      console.error("Failed to load department data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  const handleRevokeLicense = async (subId: number) => {
    if(!confirm("Revoke this license? Funds will be returned to your departmental budget.")) return;
    setProcessingId(subId);
    try {
      const token = localStorage.getItem('appManagerToken');
      await fetch(`${API_URL}/api/subscriptions/${subId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchDepartmentData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestAction = async (reqId: number, action: 'Approve' | 'Reject') => {
    setProcessingId(reqId);
    try {
      const token = localStorage.getItem('appManagerToken');
      // If approved, push to CRM. If rejected, kill it.
      await fetch(`${API_URL}/api/requests/${reqId}/vetting`, { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          status: action === 'Approve' ? 'Pending' : 'Rejected', // 'Pending' alerts the CRM triage
          ea_comments: action === 'Approve' ? 'Approved by Department Head. Forwarded to CRM.' : 'Rejected by Department Head (Budget/Need).'
        })
      });
      await fetchDepartmentData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const budgetLimit = parseFloat(departmentData.allocated_budget || "150000");
  const currentSpend = parseFloat(departmentData.totalSpend || 0);
  const ratio = budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0;
  const isOver = ratio > 100;
  
  const idleLicenses = teamEntitlements.filter(s => s.isIdle);
  const idleCount = idleLicenses.length;
  const reclaimableAmount = idleLicenses.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);

  // FISCAL FREEZE CHECK: Does any pending request push us over budget?
  const hasFreezeRisk = useMemo(() => {
    return pendingRequests.some(req => {
      const reqCostMonthly = parseFloat(req.estimated_cost_annual || 18000) / 12; // Fallback to 1500/mo if null
      return (currentSpend + reqCostMonthly) > budgetLimit;
    });
  }, [pendingRequests, currentSpend, budgetLimit]);

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4 max-w-[1600px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-black text-blue-900 flex items-center tracking-tight">
            <Building2 className="h-6 w-6 mr-2 text-blue-800" />
            {departmentData.name} Workspace
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Manage your unit's budget, software entitlements, and staff requests.</p>
        </div>
        <Button 
          onClick={fetchDepartmentData} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          Sync Data
        </Button>
      </div>

      {/* FISCAL FREEZE BANNER */}
      {hasFreezeRisk && (
        <div className="bg-red-50 border-l-4 border-red-600 p-5 mb-6 rounded-r-xl shadow-sm flex items-start animate-in slide-in-from-top-2 shrink-0">
          <ShieldAlert className="h-6 w-6 text-red-600 mr-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-900 font-black text-sm uppercase tracking-widest mb-1">🛑 Fiscal Freeze Initiated</h3>
            <p className="text-red-800 text-xs font-medium leading-relaxed max-w-4xl">
              Approving pending software requests will violate your MFMA allocated budget limit. SEAM has engaged an automated lock on procurement to prevent a departmental deficit.
            </p>
            {idleCount > 0 && (
              <div className="mt-3 p-3 bg-red-100/50 rounded-lg border border-red-200 inline-block">
                <p className="text-red-900 text-xs font-bold flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1.5 text-red-600" />
                  Resolution Path Available
                </p>
                <p className="text-red-800 text-xs mt-1">
                  SEAM has identified <strong className="font-black text-red-900">{idleCount} idle licenses</strong> in your active entitlements. Revoke them below to instantly reclaim <strong className="font-black text-red-900">ZAR {reclaimableAmount.toLocaleString()}/mo</strong> and unlock procurement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BUDGET CARD */}
      <Card className={`p-6 bg-white shadow-sm rounded-xl overflow-hidden mb-6 shrink-0 relative transition-all ${hasFreezeRisk ? 'border-2 border-red-300' : 'border border-sky-200'}`}>
        {idleCount > 0 && (
          <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-[10px] font-black px-3 py-1 rounded-bl-lg border-b border-l border-orange-200 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" /> {idleCount} Licenses Sitting Idle
          </div>
        )}
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center">
              <Wallet className="h-3.5 w-3.5 mr-1.5 text-blue-500" /> Current Spend vs Budget
            </p>
            <p className="text-3xl font-black text-blue-900">ZAR {currentSpend.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500">Limit: <span className="text-blue-900">ZAR {budgetLimit.toLocaleString()}</span></p>
            <p className={`text-sm font-black mt-1 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
              {ratio.toFixed(1)}% Allocated
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ${isOver || hasFreezeRisk ? 'bg-red-500' : 'bg-blue-800'}`} 
            style={{ width: `${Math.min(ratio, 100)}%` }} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* LEFT: THE IDLE SEATS HITLIST */}
        <Card className={`bg-white border shadow-sm rounded-xl flex flex-col h-full overflow-hidden transition-all ${hasFreezeRisk && idleCount > 0 ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-gray-50/50">
            <div className="flex items-center">
              <div className="bg-yellow-400 p-1.5 rounded-lg mr-3 shadow-sm">
                <Users className="h-4 w-4 text-blue-900" />
              </div>
              <h3 className="font-bold text-blue-900 text-base">Active Entitlements</h3>
            </div>
            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
              {teamEntitlements.length} Total Seats
            </span>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 p-5">
            {teamEntitlements.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-bold text-xs border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                No active software licenses in your unit.
              </div>
            ) : (
              <div className="space-y-3">
                {teamEntitlements.map((sub: any) => (
                  <div key={sub.id} className={`flex justify-between items-center p-3 border rounded-lg transition-all ${sub.isIdle ? (hasFreezeRisk ? 'bg-red-50/50 border-red-200 shadow-sm' : 'bg-orange-50/50 border-orange-200') : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{sub.name}</p>
                      <p className="text-[10px] font-bold text-gray-500 flex items-center mt-0.5">
                        {sub.assignedEmail}
                        {sub.isIdle && <span className={`ml-2 text-[9px] px-1.5 rounded uppercase tracking-wider font-black ${hasFreezeRisk ? 'text-red-700 bg-red-100' : 'text-orange-600 bg-orange-100'}`}>Idle 30+ Days</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <p className="text-xs font-black text-blue-900">ZAR {parseFloat(sub.price).toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Per Month</p>
                      </div>
                      <Button 
                        onClick={() => handleRevokeLicense(sub.id)}
                        disabled={processingId === sub.id}
                        variant="outline" 
                        size="icon"
                        className={`h-8 w-8 transition-colors shrink-0 ${sub.isIdle && hasFreezeRisk ? 'text-white bg-red-600 hover:bg-red-700 border-red-700 shadow-md animate-pulse' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                        title="Revoke License & Reclaim Funds"
                      >
                        {processingId === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT: UNIT APPROVAL INBOX */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-blue-900">
            <div className="flex items-center">
              <div className="bg-blue-800 border border-blue-700 p-1.5 rounded-lg mr-3 shadow-sm">
                <Inbox className="h-4 w-4 text-yellow-400" />
              </div>
              <h3 className="font-bold text-white text-base">Unit Approval Inbox</h3>
            </div>
            {pendingRequests.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                {pendingRequests.length} Pending
              </span>
            )}
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 p-5 bg-gray-50">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">Inbox Zero</p>
                <p className="text-xs text-gray-400 mt-1">No staff software requests require your approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req: any) => {
                  const reqCostMonthly = parseFloat(req.estimated_cost_annual || 18000) / 12;
                  const causesDeficit = (currentSpend + reqCostMonthly) > budgetLimit;
                  
                  return (
                    <div key={req.id} className={`bg-white border p-4 rounded-xl shadow-sm transition-all ${causesDeficit ? 'border-red-200 bg-red-50/20' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-1">Requested Software</p>
                          <h4 className={`font-bold text-sm ${causesDeficit ? 'text-red-900' : 'text-blue-900'}`}>{req.system_name || req.system}</h4>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">By: {req.requester}</p>
                        </div>
                        <div className="text-right">
                          <span className={`flex items-center text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider mb-1 ${causesDeficit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {causesDeficit ? <Lock className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />} 
                            {causesDeficit ? 'Locked' : 'Needs Approval'}
                          </span>
                          <span className="text-[10px] font-black text-gray-600">ZAR {reqCostMonthly.toLocaleString()}/mo</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <Button 
                          onClick={() => handleRequestAction(req.id, 'Reject')}
                          disabled={processingId === req.id}
                          variant="outline" 
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold shadow-sm h-9"
                        >
                          {processingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject</>}
                        </Button>
                        <Button 
                          onClick={() => handleRequestAction(req.id, 'Approve')}
                          disabled={processingId === req.id || causesDeficit}
                          className={`w-full text-xs font-bold shadow-sm h-9 transition-colors ${
                            causesDeficit 
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {processingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 
                           causesDeficit ? <><Lock className="h-3.5 w-3.5 mr-1.5" /> Locked (Deficit)</> : 
                           <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};