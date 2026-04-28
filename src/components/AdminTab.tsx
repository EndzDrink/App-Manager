import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, RotateCcw, RefreshCw, Settings, Wallet, Globe, 
  Plus, Link2, FileSpreadsheet, Database, Users, Server, X 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AdminTabProps {
  stats: { totalApps: number; activeSubscriptions: number; recommendations: number; monthlyCost: number; };
  budget: number;
  connectors: any[];
  onRefresh: () => void;
  onExport: () => void;
  onUpdateBudget: (newBudget: number) => Promise<void>;
  onAddConnector: (connector: any) => Promise<void>;
}

export const AdminTab: React.FC<AdminTabProps> = ({ 
  stats, budget, connectors, onRefresh, onExport, onUpdateBudget, onAddConnector 
}) => {
  const [newBudget, setNewBudget] = useState(budget.toString());
  const [isAddingConnector, setIsAddingConnector] = useState(false);
  
  // Generic Connector State
  const [provider, setProvider] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Individual targeted sync engine
  const handleTargetedSync = async (id: number) => {
    setSyncingId(id);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/connectors/${id}/sync`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setSyncingId(null);
    }
  };

  const handleGlobalSync = () => {
    onRefresh(); // Refreshes all metrics and data across the dashboard
  };

  const handleResetEngine = () => {
    if (confirm("WARNING: This will reload the dashboard and clear unsaved local states. Continue?")) {
      window.location.reload();
    }
  };

  const handleAddConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddConnector({ 
      provider_name: provider, 
      api_endpoint: endpoint, 
      api_key: apiKey, 
      sync_frequency: 'daily' 
    });
    setIsAddingConnector(false);
    setProvider(''); setEndpoint(''); setApiKey('');
  };

  // Smart Icon Engine based on connection name
  const getConnectorIcon = (name: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('sharepoint') || lowerName.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    if (lowerName.includes('sql') || lowerName.includes('database')) return <Database className="h-5 w-5 text-purple-600" />;
    if (lowerName.includes('okta') || lowerName.includes('entra') || lowerName.includes('ad')) return <Users className="h-5 w-5 text-orange-600" />;
    if (lowerName.includes('aws') || lowerName.includes('azure')) return <Server className="h-5 w-5 text-blue-600" />;
    return <Globe className="h-5 w-5 text-indigo-500" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      
      {/* 1. UNIFIED INTEGRATION HUB */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <Link2 className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Enterprise Integration Hub</h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Manage all external data sources, active directories, and API endpoints.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => setIsAddingConnector(!isAddingConnector)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            {isAddingConnector ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isAddingConnector ? "Cancel" : "Add Connection"}
          </Button>
        </div>

        {/* Dynamic Add Form */}
        {isAddingConnector && (
          <Card className="p-6 mb-6 border-indigo-200 bg-indigo-50/30 shadow-inner">
            <h3 className="text-sm font-bold text-indigo-900 mb-4">Configure New Data Source</h3>
            <form onSubmit={handleAddConnector} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Provider Name</label>
                <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g., IMU SharePoint" className="p-2 border border-indigo-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">API/Webhook Endpoint</label>
                <input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://graph.microsoft.com/v1.0/..." className="p-2 border border-indigo-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Authentication Token (Encrypted)</label>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="••••••••••••••••" className="p-2 border border-indigo-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingConnector(false)} className="text-gray-600 hover:bg-gray-200">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Initialize Connection</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Existing Connectors Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.length === 0 ? (
             <div className="col-span-1 md:col-span-2 text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
               <Link2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
               <p className="text-sm text-gray-500 font-medium">No integrations configured.</p>
             </div>
          ) : (
            connectors.map(conn => (
              <Card key={conn.id} className="p-5 bg-white border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      {getConnectorIcon(conn.provider_name)}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-gray-900 truncate">{conn.provider_name}</h3>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5" title={conn.api_endpoint}>{conn.api_endpoint}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${conn.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {conn.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                  <span className="text-[10px] text-gray-500 font-medium">
                    Last Sync: {conn.last_sync ? new Date(conn.last_sync).toLocaleString() : 'Never'}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleTargetedSync(conn.id)}
                    disabled={syncingId === conn.id}
                    className="h-7 text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                    {syncingId === conn.id ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* 2. SYSTEM TOOLS & BUDGET CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-200">
        
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">System Controls</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={onExport} variant="outline" className="flex-col h-auto py-5 text-xs bg-white hover:bg-gray-50 border-gray-200 shadow-sm transition-all hover:shadow-md">
              <Download className="h-6 w-6 mb-2 text-gray-600" />
              <span className="font-semibold text-gray-700">Export Dump</span>
            </Button>
            <Button onClick={handleResetEngine} variant="outline" className="flex-col h-auto py-5 text-xs bg-white hover:bg-orange-50 border-orange-200 shadow-sm transition-all hover:shadow-md group">
              <RotateCcw className="h-6 w-6 mb-2 text-orange-500 group-hover:-rotate-180 transition-transform duration-500" />
              <span className="font-semibold text-orange-700">Reset UI</span>
            </Button>
            <Button onClick={handleGlobalSync} variant="outline" className="flex-col h-auto py-5 text-xs bg-white hover:bg-indigo-50 border-indigo-200 shadow-sm transition-all hover:shadow-md group">
              <RefreshCw className="h-6 w-6 mb-2 text-indigo-500 group-hover:animate-spin" />
              <span className="font-semibold text-indigo-700">Global Refresh</span>
            </Button>
          </div>
        </section>

        <section>
          <div className="flex items-center space-x-3 mb-4">
            <Wallet className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Enterprise Limit Constraint</h2>
          </div>
          <Card className="p-5 bg-white border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-3">Adjust the global threshold used to calculate budget overruns on the main dashboard.</p>
            <div className="flex space-x-3 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">ZAR</span>
                <input 
                  type="number" 
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" 
                  value={newBudget} 
                  onChange={e => setNewBudget(e.target.value)} 
                />
              </div>
              <Button onClick={() => onUpdateBudget(parseFloat(newBudget))} className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm px-6 h-11">
                Enforce Rule
              </Button>
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
};