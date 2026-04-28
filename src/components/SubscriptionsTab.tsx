import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, CreditCard, CalendarX, ShieldAlert, 
  CheckCircle2, Trash2, Receipt, Building2, 
  ArrowRightLeft, UserX, UserCheck, Wallet, AlertTriangle, X
} from "lucide-react";

interface SubscriptionsTabProps {
  subscriptions: any[];
  onAddSubscription: () => void;
}

// Explicitly define the Department Pool structure
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
  const [availableSystems, setAvailableSystems] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  // Transfer Modal State
  const [transferModal, setTransferModal] = useState<any | null>(null);
  
  // Form State
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [price, setPrice] = useState('');
  const [owningDept, setOwningDept] = useState('Information Management Unit (IMU)');
  
  // Status State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetch(`${API_URL}/api/systems`).then(res => res.json()).then(setAvailableSystems);
    fetch(`${API_URL}/api/users`).then(res => res.json()).then(setAvailableUsers);
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
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          app_id: parseInt(selectedAppId), 
          user_id: parseInt(selectedUserId), 
          price: parseFloat(price),
          owning_dept: owningDept
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Procurement failed due to budget limits.');
      } else {
        setSuccessMsg(`Success: License procured and assigned to ${owningDept}.`);
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg('');
          setSelectedAppId('');
          setSelectedUserId('');
          setPrice('');
          onAddSubscription(); 
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if(confirm("Are you sure you want to revoke this license? It will be returned to the Department's unassigned pool.")) {
      await fetch(`${API_URL}/api/subscriptions/${id}`, { method: 'DELETE' });
      onAddSubscription();
    }
  }

  const handleExecuteTransfer = () => {
    setSuccessMsg('Executing inter-departmental chargeback...');
    setTimeout(() => {
      setTransferModal(null);
      setSuccessMsg('');
      onAddSubscription(); 
    }, 1500);
  }

  const enrichedSubs = subscriptions.map((sub, index) => {
    const user = availableUsers.find(u => u.id === sub.user_id) || availableUsers[index % availableUsers.length] || { id: 0, email: 'Unassigned', department: 'None' };
    
    const mockDaysAgo = user.id === 0 ? 0 : (user.id + (sub.id || index) * 7) % 45;
    const isIdle = user.id !== 0 && mockDaysAgo > 30;
    const isUnassigned = user.id === 0;
    
    const simulatedOwningDept = sub.owning_dept || (index % 4 === 0 ? 'Information Management Unit (IMU)' : user.department);
    const isCrossDepartment = !isUnassigned && user.department !== simulatedOwningDept;

    return { ...sub, user, isIdle, isUnassigned, mockDaysAgo, owningDept: simulatedOwningDept, isCrossDepartment };
  });

  const departmentPools = enrichedSubs.reduce((acc, sub) => {
    if (!acc[sub.owningDept]) {
      acc[sub.owningDept] = { name: sub.owningDept, budget: 150000, spend: 0, active: 0, idle: 0, unassigned: 0 };
    }
    acc[sub.owningDept].spend += parseFloat(sub.price || 0);
    if (sub.isUnassigned) acc[sub.owningDept].unassigned++;
    else if (sub.isIdle) acc[sub.owningDept].idle++;
    else acc[sub.owningDept].active++;
    return acc;
  }, {} as Record<string, DeptPool>);

  // THE FIX: Explicitly forcing the output to be an array of DeptPool so VS Code stops complaining
  const deptArray: DeptPool[] = (Object.values(departmentPools) as DeptPool[]).sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-blue-900 flex items-center tracking-tight">
            <CreditCard className="h-5 w-5 mr-2 text-blue-800" />
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

      {!isAdding && deptArray.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {/* THE FIX: Explicitly stating that 'dept' is a DeptPool in the map function */}
          {deptArray.slice(0, 3).map((dept: DeptPool, i: number) => {
            const remaining = dept.budget - dept.spend;
            const avgLicenseCost = 1500; 
            const purchasingPower = Math.floor(remaining / avgLicenseCost);

            return (
              <Card key={i} className="p-4 border border-gray-200 shadow-sm rounded-xl bg-white hover:border-sky-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-blue-800 mr-2" />
                    <h3 className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{dept.name}</h3>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-800 px-2 py-0.5 rounded">Pool {i+1}</span>
                </div>
                
                <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Active Spend</p>
                    <p className="text-base font-black text-gray-900">ZAR {dept.spend.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Remaining Budget</p>
                    <p className="text-sm font-bold text-green-600">ZAR {remaining.toLocaleString()}</p>
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
                    <p className="text-lg font-black text-green-600">+{purchasingPower}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Affordable</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-md mb-6 animate-in slide-in-from-top-2">
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
                    {isSubmitting ? 'Verifying...' : 'Buy'}
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
        </div>
      )}

      <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-xl">
        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Enterprise License Directory</span>
          <span className="text-[10px] text-gray-500 font-bold">{enrichedSubs.length} Total Registered Seats</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-blue-900 text-[10px] uppercase tracking-widest font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">System & Cost</th>
                <th className="px-6 py-4">Assigned Identity</th>
                <th className="px-6 py-4">Activity Status</th>
                <th className="px-6 py-4">License Ownership</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrichedSubs.map((sub, i) => {
                return (
                  <tr key={sub.id || i} className="hover:bg-sky-50/30 transition-colors group bg-white">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors shrink-0">
                          <CreditCard className="h-4 w-4 text-gray-500 group-hover:text-blue-800" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{sub.name}</p>
                          <p className="text-[10px] text-gray-500 font-black mt-0.5">ZAR {parseFloat(sub.price).toLocaleString()}/mo</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {sub.isUnassigned ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          <UserX className="h-3 w-3 mr-1" /> Unassigned Pool
                        </span>
                      ) : (
                        <div>
                          <p className="font-bold text-gray-800 text-xs">{sub.user.email}</p>
                          <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">{sub.user.department}</p>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {sub.isUnassigned ? (
                        <span className="text-[10px] font-bold text-gray-400 italic">N/A</span>
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
                      <p className="text-[10px] font-bold text-blue-900 flex items-center mb-1">
                        <Building2 className="h-3 w-3 mr-1 text-sky-500" /> {sub.owningDept}
                      </p>
                      
                      {sub.isCrossDepartment && (
                        <div className="bg-orange-50 border border-orange-200 p-1.5 rounded flex items-start mt-1">
                          <AlertTriangle className="h-3 w-3 text-orange-500 mr-1 shrink-0" />
                          <p className="text-[9px] font-bold text-orange-800 leading-tight">
                            User moved to {sub.user.department}. Chargeback or transfer required.
                          </p>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {sub.isCrossDepartment && (
                          <button 
                            onClick={() => setTransferModal(sub)}
                            className="p-1.5 bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 rounded-md shadow-sm flex items-center transition-colors"
                            title="Initiate Departmental Transfer"
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            <span className="text-[10px] font-bold uppercase">Transfer</span>
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleRevoke(sub.id)}
                          className="p-1.5 bg-white text-red-600 border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-md shadow-sm transition-colors"
                          title="Revoke License & Reclaim Funds"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

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
                <Button onClick={handleExecuteTransfer} className="w-full bg-blue-800 hover:bg-blue-900 text-white shadow-sm h-12 flex justify-between">
                  <span>Authorize Transfer & Shift Billing</span>
                  <span className="text-yellow-400 text-xs bg-blue-950 px-2 py-1 rounded">ZAR {parseFloat(transferModal.price).toLocaleString()} / mo</span>
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