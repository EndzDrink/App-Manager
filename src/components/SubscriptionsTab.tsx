import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, CalendarX, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";

interface SubscriptionsTabProps {
  subscriptions: any[];
  onAddSubscription: () => void;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ subscriptions, onAddSubscription }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [availableSystems, setAvailableSystems] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  // Form State
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [price, setPrice] = useState('');
  
  // Status State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch dropdown data when the form opens
  useEffect(() => {
    if (isAdding) {
      fetch(`${API_URL}/api/systems`).then(res => res.json()).then(setAvailableSystems);
      fetch(`${API_URL}/api/users`).then(res => res.json()).then(setAvailableUsers);
    }
  }, [isAdding]);

  // Auto-fill price based on the selected system
  useEffect(() => {
    if (selectedAppId) {
      const system = availableSystems.find(s => s.id.toString() === selectedAppId);
      if (system) {
        // Mock prices based on category for realism
        const mockPrice = system.category === 'Geospatial' ? 1250 : system.category === 'Resource Planning' ? 2500 : 450;
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
          price: parseFloat(price) 
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Triggers the red Compliance Flag for duplicate licenses
        setErrorMsg(data.message || data.error || 'Procurement failed');
      } else {
        setSuccessMsg(`Success: License procured and assigned securely.`);
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg('');
          setSelectedAppId('');
          setSelectedUserId('');
          setPrice('');
          onAddSubscription(); // Refreshes the table
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if(confirm("Are you sure you want to revoke this license and return funds to the budget?")) {
      const res = await fetch(`${API_URL}/api/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) onAddSubscription(); // Refresh table
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Active Licenses & Renewals</h2>
          <p className="text-sm text-metric-label">Procure software, track costs, and audit active municipal subscriptions.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
        >
          {isAdding ? 'Cancel Procurement' : <><Plus className="h-4 w-4 mr-2" /> Procure License</>}
        </Button>
      </div>

      {/* NEW: Dynamic Procurement Form */}
      {isAdding && (
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm mb-6 animate-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            New License Procurement Requisition
          </h3>
          <form onSubmit={handleProcureSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target System</label>
              <select 
                required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
              >
                <option value="">-- Select System --</option>
                {availableSystems.map(sys => (
                  <option key={sys.id} value={sys.id}>{sys.name} ({sys.category})</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign To (User)</label>
              <select 
                required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.email} - {user.department}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Monthly Cost (ZAR)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Verifying...' : 'Authorize Purchase'}
            </Button>
          </form>

          {/* Compliance Alerts */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700 text-sm">
              <ShieldAlert className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
              <p><strong>Request Denied:</strong> {errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Ledger Table */}
      <Card className="bg-white border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-metric-label text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Enterprise System</th>
                <th className="px-6 py-4">Associated PMO Project</th>
                <th className="px-6 py-4">Monthly Burn</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((sub, i) => {
                const isExpiring = sub.end_date && new Date(sub.end_date).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={sub.id || i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-semibold text-metric-value">{sub.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{sub.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sub.project_name ? (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium text-xs border border-indigo-100">
                          {sub.project_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Operational (Non-Project)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-metric-value">
                      ZAR {parseFloat(sub.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                      {sub.start_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        {sub.end_date ? (
                          <div className={`flex items-center space-x-1.5 text-xs font-bold ${isExpiring ? 'text-red-600' : 'text-gray-600'}`}>
                            {isExpiring && <CalendarX className="h-4 w-4" />}
                            <span>{sub.end_date}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Auto-Renews</span>
                        )}
                        
                        {/* Red Revoke Button appears on hover */}
                        <button 
                          onClick={() => handleRevoke(sub.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md shadow-sm ml-2"
                          title="Revoke License"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic bg-gray-50/50">
                    No active licenses found matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};