import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, CreditCard, ShieldAlert, 
  CheckCircle2, Trash2, Building2, 
  ArrowRightLeft, UserX, Wallet, AlertTriangle, X, Loader2
} from "lucide-react";

interface SubscriptionsTabProps {
  subscriptions: any[];
  onAddSubscription: () => void;
}

interface DeptPool {
  name: string;
  budget: number;
  spend: number;
  active: number;
  idle: number;
  unassigned: number;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ subscriptions, onAddSubscription }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReconciling, setIsReconciling] = useState<number | null>(null);
  const [availableSystems, setAvailableSystems] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [transferModal, setTransferModal] = useState<any | null>(null);
  
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [price, setPrice] = useState('');
  const [owningDept, setOwningDept] = useState('Information Management Unit (IMU)');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('appManagerToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/systems`, { headers }),
      fetch(`${API_URL}/api/users`, { headers })
    ]).then(async ([sysRes, userRes]) => {
      if (sysRes.ok) setAvailableSystems(await sysRes.json());
      if (userRes.ok) setAvailableUsers(await userRes.json());
    });
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      const system = availableSystems.find(s => s.id.toString() === selectedAppId);
      if (system) {
        const mockPrice = system.category === 'Geospatial' ? 1250 : system.category === 'Security' ? 2500 : 450;
        setPrice(mockPrice.toString());
      }
    }
  }, [selectedAppId, availableSystems]);

  const handleProcureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('appManagerToken');
      const deptMap: Record<string, number> = {
        'Information Management Unit (IMU)': 1,
        'Water & Sanitation Unit': 2,
        'Metro Police Unit': 3,
        'Parks & Recreation Unit': 4
      };
      
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          system_id: parseInt(selectedAppId), 
          assigned_user_id: selectedUserId ? parseInt(selectedUserId) : null, 
          monthly_cost: parseFloat(price),
          department_id: deptMap[owningDept] || 1
        })
      });
      if (res.ok) {
        setSuccessMsg("License procured successfully.");
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg('');
          setSelectedAppId('');
          setSelectedUserId('');
          setPrice('');
          onAddSubscription();
        }, 1500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Procurement failed");
      }
    } catch(err) {
      setErrorMsg("Failed to connect to server");
    } finally { setIsSubmitting(false); }
  };

  const handleRevoke = async (id: number) => {
    if(confirm("Revoke this license?")) {
      const token = localStorage.getItem('appManagerToken');
      await fetch(`${API_URL}/api/subscriptions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      onAddSubscription();
    }
  }

  const handleExecuteTransfer = async () => {
    setIsTransferring(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/subscriptions/${transferModal.id}/transfer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ new_department: transferModal.user.department })
      });
      
      if (res.ok) {
        setTransferModal(null);
        onAddSubscription();
      }
    } catch (err) {
      console.error(err);
    } finally { setIsTransferring(false); }
  }

  const handleAssignLicense = async (subId: number, targetUserId: string) => {
      if (!targetUserId) return;
      setIsReconciling(subId);
      
      try {
        const token = localStorage.getItem('appManagerToken');
        const targetUser = availableUsers.find(u => u.id.toString() === targetUserId);
        
        const deptMap: Record<string, number> = {
            'Information Management Unit (IMU)': 1,
            'Water & Sanitation Unit': 2,
            'Metro Police Unit': 3,
            'Parks & Recreation Unit': 4
        };
        const deptId = targetUser ? (deptMap[targetUser.department] || 1) : 1;

        const payload = {
            assigned_user_id: parseInt(targetUserId),
            department_id: deptId
        };
        
        const res = await fetch(`${API_URL}/api/subscriptions/${subId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            onAddSubscription(); 
        } else {
            console.error("Failed to assign license");
        }
      } catch (err) {
          console.error(err);
      } finally {
          setIsReconciling(null);
      }
  }

  // ROBUST COST PARSER: Safely handles nulls, strings, and missing price fields
  const getCost = (val: any) => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeUsers = Array.isArray(availableUsers) ? availableUsers : [];
  
  const enrichedSubs = subscriptions.map((sub, index) => {
    const user = safeUsers.find(u => u.id === sub.assigned_user_id) || { id: 0, email: 'Unassigned', department: 'None' };
    const isIdle = user.id !== 0 && (index % 4 === 0);
    const simulatedOwningDept = user.id === 0 ? 'Unknown' : (sub.owning_dept || user.department);
    const isCrossDepartment = user.id !== 0 && user.department !== simulatedOwningDept && user.department !== 'None';
    
    // Check both monthly_cost and price columns
    const computedCost = getCost(sub.monthly_cost || sub.price);

    return { ...sub, user, isIdle, isUnassigned: user.id === 0, owningDept: simulatedOwningDept, isCrossDepartment, computedCost, mockDaysAgo: isIdle ? 35 : 0 };
  });

  const orphanedAssets = enrichedSubs.filter(s => s.isUnassigned);
  const orphanedSpend = orphanedAssets.reduce((sum, s) => sum + s.computedCost, 0);

  const baseDepts: Record<string, DeptPool> = {
    'Information Management Unit (IMU)': { name: 'Information Management Unit (IMU)', budget: 500000, spend: 0, active: 0, idle: 0, unassigned: 0 },
    'Water & Sanitation Unit': { name: 'Water & Sanitation Unit', budget: 1200000, spend: 0, active: 0, idle: 0, unassigned: 0 },
    'Metro Police Unit': { name: 'Metro Police Unit', budget: 800000, spend: 0, active: 0, idle: 0, unassigned: 0 },
    'Parks & Recreation Unit': { name: 'Parks & Recreation Unit', budget: 300000, spend: 0, active: 0, idle: 0, unassigned: 0 }
  };

  enrichedSubs.forEach((sub) => {
    if (sub.owningDept !== 'Unknown' && !baseDepts[sub.owningDept]) {
      baseDepts[sub.owningDept] = { name: sub.owningDept, budget: 150000, spend: 0, active: 0, idle: 0, unassigned: 0 };
    }
    
    if (sub.owningDept !== 'Unknown') {
        baseDepts[sub.owningDept].spend += sub.computedCost;
        if (sub.isIdle) baseDepts[sub.owningDept].idle++;
        else baseDepts[sub.owningDept].active++;
    }
  });

  const deptArray = Object.values(baseDepts).sort((a, b) => b.spend - a.spend);

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4 max-w-[1600px] mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
            Financial License Ledger
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Manage departmental budgets, active usage, and cross-department license transfers.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold shadow-sm shrink-0 transition-colors"
        >
          {isAdding ? 'Cancel Procurement' : <><Plus className="h-4 w-4 mr-2" /> Procure Department License</>}
        </Button>
      </div>

      {orphanedAssets.length > 0 && !isAdding && (
          <div className="bg-red-50 border-l-4 border-red-600 p-5 mb-6 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between animate-in slide-in-from-top-2 shrink-0">
              <div className="flex items-start mb-3 sm:mb-0">
                  <ShieldAlert className="h-6 w-6 text-red-600 mr-4 shrink-0 mt-0.5" />
                  <div>
                      <h3 className="text-red-900 font-black text-sm uppercase tracking-widest mb-1">⚠️ {orphanedAssets.length} Orphaned Assets Detected</h3>
                      <p className="text-red-800 text-xs font-medium leading-relaxed max-w-3xl">
                          The system has identified licenses that are not assigned to a specific user or department. This represents <strong className="font-black bg-red-100 px-1 rounded">ZAR {orphanedSpend.toLocaleString()}/mo</strong> in unattributed shadow spend that is bypassing MFMA budget limits. Please reconcile them below.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {!isAdding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 shrink-0">
          {deptArray.slice(0, 4).map((dept: DeptPool, i: number) => {
            const remaining = dept.budget - dept.spend;
            const avgLicenseCost = 1500; 
            const purchasingPower = Math.floor(remaining / avgLicenseCost);

            return (
              <Card key={i} className="p-4 border border-gray-200 shadow-sm rounded-xl bg-white hover:border-sky-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center overflow-hidden">
                    <Building2 className="h-4 w-4 text-blue-800 mr-2 shrink-0" />
                    <h3 className="text-sm font-bold text-gray-900 truncate">{dept.name}</h3>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Active Spend</p>
                    <p className="text-base font-black text-gray-900">ZAR {dept.spend.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Remaining Budget</p>
                    <p className={`text-sm font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>ZAR {remaining.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border border-gray-100 rounded-lg p-2 bg-gray-50">
                  <div>
                    <p className="text-lg font-black text-blue-900">{dept.active}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Active</p>
                  </div>
                  <div className="border-l border-r border-gray-200">
                    <p className="text-lg font-black text-orange-600">{dept.idle}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Idle</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-green-600">+{purchasingPower > 0 ? purchasingPower : 0}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Affordable</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-md mb-6 animate-in slide-in-from-top-2 shrink-0">
          <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center border-b border-gray-100 pb-3">
            <Wallet className="h-4 w-4 mr-2 text-sky-500" /> Departmental License Procurement
          </h3>
          
          <form onSubmit={handleProcureSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Purchasing Department (Owner)</label>
                <select 
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none bg-blue-50 text-blue-900 cursor-pointer"
                  value={owningDept}
                  onChange={(e) => setOwningDept(e.target.value)}
                >
                  <option value="Information Management Unit (IMU)">Information Management Unit (IMU)</option>
                  <option value="Water & Sanitation Unit">Water & Sanitation Unit</option>
                  <option value="Metro Police Unit">Metro Police Unit</option>
                  <option value="Parks & Recreation Unit">Parks & Recreation Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Target System</label>
                <select 
                  required
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-gray-50 cursor-pointer"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                >
                  <option value="">-- Select System --</option>
                  {availableSystems.map(sys => (
                    <option key={sys.id} value={sys.id}>{sys.name} ({sys.category})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Assign To Identity (Optional)</label>
                <select 
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-gray-50 cursor-pointer"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- Keep as Unassigned Pool License --</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.email} ({user.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Monthly Cost (ZAR)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-white"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-800 hover:bg-blue-900 text-white font-bold h-[42px] px-6 shadow-sm">
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Buy'}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700 text-sm shadow-sm">
              <ShieldAlert className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
              <p><strong>Request Denied:</strong> {errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700 text-sm font-bold shadow-sm">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* TABLE AREA */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Enterprise License Directory</span>
          <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded border border-gray-200">{enrichedSubs.length} Total Registered Seats</span>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <th className="px-6 py-4">System & Cost</th>
                <th className="px-6 py-4">Assigned Identity</th>
                <th className="px-6 py-4">Activity Status</th>
                <th className="px-6 py-4">License Ownership</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrichedSubs.map((sub, i) => (
                <tr key={sub.id || i} className={`transition-colors group ${sub.isUnassigned ? 'bg-red-50/30 hover:bg-red-50/50' : 'bg-white hover:bg-blue-50/30'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${sub.isUnassigned ? 'bg-red-100 group-hover:bg-red-200' : 'bg-gray-100 group-hover:bg-blue-100'}`}>
                        <CreditCard className={`h-4 w-4 ${sub.isUnassigned ? 'text-red-500' : 'text-gray-500 group-hover:text-blue-800'}`} />
                      </div>
                      <div>
                        <p className={`font-bold transition-colors ${sub.isUnassigned ? 'text-red-900' : 'text-gray-900 group-hover:text-blue-900'}`}>{sub.name}</p>
                        <p className="text-[10px] text-gray-500 font-black mt-0.5">ZAR {sub.computedCost.toLocaleString()}/mo</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.isUnassigned ? (
                      <div className="flex items-center max-w-[200px]">
                        <UserX className="h-4 w-4 text-red-500 mr-2 shrink-0" />
                        <select 
                            className="w-full text-[10px] border border-red-300 rounded p-1.5 font-bold bg-white text-red-900 outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-sm"
                            onChange={(e) => handleAssignLicense(sub.id, e.target.value)}
                            value=""
                            disabled={isReconciling === sub.id}
                        >
                            <option value="" disabled>{isReconciling === sub.id ? 'Reconciling...' : 'Reconcile Asset (Assign User)'}</option>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.email}</option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-gray-800 text-xs">{sub.user.email}</p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">{sub.user.department}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sub.isUnassigned ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Shadow Spend
                      </span>
                    ) : sub.isIdle ? (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 w-fit">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span> Idle
                        </span>
                        <span className="text-[9px] text-gray-500 font-semibold mt-1">Last seen {sub.mockDaysAgo} days ago</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 w-fit">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </span>
                        <span className="text-[9px] text-gray-500 font-semibold mt-1">Logged in {sub.mockDaysAgo === 0 ? 'Today' : sub.mockDaysAgo + ' days ago'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sub.isUnassigned ? (
                        <p className="text-[10px] font-bold text-red-600 italic">Unattributed</p>
                    ) : (
                        <>
                            <p className="text-[10px] font-bold text-blue-900 flex items-center mb-1">
                            <Building2 className="h-3 w-3 mr-1 text-sky-500" /> {sub.owningDept}
                            </p>
                            {sub.isCrossDepartment && (
                            <div className="bg-orange-50 border border-orange-200 p-1.5 rounded flex items-start mt-1">
                                <AlertTriangle className="h-3 w-3 text-orange-500 mr-1 shrink-0" />
                                <p className="text-[9px] font-bold text-orange-800 leading-tight">User moved to {sub.user.department}.</p>
                            </div>
                            )}
                        </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {sub.isCrossDepartment && !sub.isUnassigned && (
                        <button 
                          onClick={() => setTransferModal(sub)}
                          className="p-1.5 bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 rounded-md shadow-sm flex items-center transition-colors"
                          title="Initiate Departmental Transfer"
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          <span className="text-[10px] font-bold u...ppercase">Transfer</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleRevoke(sub.id)}
                        className={`p-1.5 border rounded-md shadow-sm transition-colors ${sub.isUnassigned ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'bg-white text-red-600 border-gray-200 hover:bg-red-50 hover:border-red-200'}`}
                        title="Revoke License & Reclaim Funds"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {enrichedSubs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 text-sm">
                    No subscriptions found. Procure a license to begin tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* TRANSFER MODAL */}
      {transferModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-blue-900 text-white">
              <div className="flex items-center font-bold text-sm">
                <ArrowRightLeft className="h-4 w-4 mr-2 text-yellow-400" /> License Chargeback & Transfer
              </div>
              <button onClick={() => setTransferModal(null)} className="text-blue-200 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-5">
                <strong className="text-gray-900">{transferModal.user.email}</strong> was transferred to <strong>{transferModal.user.department}</strong>, but their <strong>{transferModal.name}</strong> license is still being paid for by <strong>{transferModal.owningDept}</strong>.
              </p>
              
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg mb-6 shadow-inner flex justify-between items-center">
                <div className="text-center flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Owner</p>
                  <p className="text-xs font-bold text-red-600 mt-1">{transferModal.owningDept}</p>
                </div>
                <ArrowRightLeft className="h-5 w-5 text-sky-400 mx-2" />
                <div className="text-center flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Owner</p>
                  <p className="text-xs font-bold text-green-600 mt-1">{transferModal.user.department}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleExecuteTransfer} disabled={isTransferring} className="w-full bg-blue-800 hover:bg-blue-900 text-white shadow-sm h-12 flex justify-between">
                  <span>{isTransferring ? 'Processing...' : 'Authorize Transfer & Shift Billing'}</span>
                  {!isTransferring && <span className="text-yellow-400 text-xs bg-blue-950 px-2 py-1 rounded">ZAR {transferModal.computedCost.toLocaleString()} / mo</span>}
                </Button>
                <Button onClick={() => setTransferModal(null)} variant="outline" className="w-full border-gray-300 text-gray-700 h-10">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};