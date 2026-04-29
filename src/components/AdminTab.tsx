import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, RotateCcw, RefreshCw, Settings, Wallet, Globe, 
  Plus, Link2, FileSpreadsheet, Database, Users, Server, X, Map, LayoutDashboard, CheckCircle2, AlertCircle
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
  budget, connectors, onRefresh, onExport, onUpdateBudget, onAddConnector 
}) => {
  const [newBudget, setNewBudget] = useState(budget.toString());
  const [isAddingConnector, setIsAddingConnector] = useState(false);
  
  const [provider, setProvider] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const connectionTemplates = [
    { name: "Microsoft Entra ID", endpoint: "https://graph.microsoft.com/v1.0/users" },
    { name: "SAP S/4HANA (Finance)", endpoint: "https://api.sap.com/s4hana/odata/v4" },
    { name: "ESRI ArcGIS Server", endpoint: "https://gis.durban.gov.za/server/rest" },
    { name: "Munsoft (mSCOA)", endpoint: "https://api.munsoft.co.za/v1/municipal" }
  ];

  const handleApplyTemplate = (tempName: string, tempEndpoint: string) => {
    setProvider(tempName);
    setEndpoint(tempEndpoint);
  };

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

  const getConnectorIcon = (name: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('sharepoint') || lowerName.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
    if (lowerName.includes('sql') || lowerName.includes('database') || lowerName.includes('sap')) return <Database className="h-4 w-4 text-blue-600" />;
    if (lowerName.includes('okta') || lowerName.includes('entra') || lowerName.includes('ad')) return <Users className="h-4 w-4 text-blue-600" />;
    if (lowerName.includes('aws') || lowerName.includes('azure')) return <Server className="h-4 w-4 text-blue-600" />;
    if (lowerName.includes('esri') || lowerName.includes('gis')) return <Map className="h-4 w-4 text-blue-600" />;
    return <Globe className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">Governance & Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage data interface pipelines and global system parameters.</p>
        </div>
      </div>

      {/* 1. DATA TABLE INTERFACE REGISTRY */}
      <Card className="border border-gray-300 shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Link2 className="h-5 w-5 text-blue-900" />
            <h2 className="text-base font-bold text-gray-900">Architecture Data Interfaces</h2>
          </div>
          <Button 
            size="sm" 
            onClick={() => setIsAddingConnector(!isAddingConnector)} 
            className="bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold shadow-sm h-8"
          >
            {isAddingConnector ? <X className="h-3.5 w-3.5 mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
            {isAddingConnector ? "Cancel" : "Register Interface"}
          </Button>
        </div>

        {isAddingConnector && (
          <div className="p-5 bg-blue-50/50 border-b border-gray-200">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-3">Register New Pipeline</h3>
            
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Templates</p>
              <div className="flex flex-wrap gap-2">
                {connectionTemplates.map((temp, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(temp.name, temp.endpoint)}
                    className="text-[10px] font-bold bg-white border border-blue-200 text-blue-800 px-2.5 py-1 rounded hover:bg-blue-900 hover:text-yellow-400 transition-colors shadow-sm"
                  >
                    {temp.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddConnector} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase">System/Provider</label>
                <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Provider Name" className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="flex flex-col space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-700 uppercase">Target Endpoint URI</label>
                <input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://..." className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase">Auth Bearer Token</label>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="••••••••" className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="md:col-span-4 flex justify-end mt-2">
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm h-8">Initialize Connection</Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold">System Provider</th>
                <th className="px-4 py-3 font-bold">Endpoint URI</th>
                <th className="px-4 py-3 font-bold">Protocol</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold text-center">Last Sync</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connectors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 bg-white">
                    <Link2 className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm">No interfaces detected in registry.</p>
                  </td>
                </tr>
              ) : (
                connectors.map((conn, idx) => {
                  const displayProvider = conn.provider_name || conn.name || conn.provider || "Unknown API";
                  const displayEndpoint = conn.api_endpoint || conn.endpoint || conn.url || "No endpoint provided";
                  const isHealthy = conn.status === 'active' || conn.status === 'healthy';

                  return (
                    <tr key={conn.id || idx} className="bg-white border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 flex items-center">
                        <span className="mr-2 p-1 bg-blue-50 rounded border border-blue-100">
                           {getConnectorIcon(displayProvider)}
                        </span>
                        {displayProvider}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs max-w-[200px] truncate" title={displayEndpoint}>
                        {displayEndpoint}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">REST API</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isHealthy ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" /> Offline
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 font-medium">
                        {conn.last_sync ? new Date(conn.last_sync).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleTargetedSync(conn.id)}
                          disabled={syncingId === conn.id}
                          className="h-7 text-xs font-bold text-blue-900 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                          {syncingId === conn.id ? 'Syncing' : 'Ping'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2. GOVERNANCE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="p-5 bg-white border border-gray-300 shadow-sm rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-base font-bold text-gray-900">Governance Controls</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Execute global administrative actions across the EA environment.</p>
          <div className="flex space-x-3">
            <Button onClick={onExport} variant="outline" className="flex-1 text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-900 h-9">
              <Download className="h-4 w-4 mr-2" /> Dump State
            </Button>
            <Button onClick={onRefresh} variant="outline" className="flex-1 text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-900 h-9">
              <RefreshCw className="h-4 w-4 mr-2" /> Force Refresh
            </Button>
            <Button onClick={handleResetEngine} variant="outline" className="flex-1 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9">
              <RotateCcw className="h-4 w-4 mr-2" /> Soft Reset
            </Button>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-300 shadow-sm rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Wallet className="h-5 w-5 text-gray-600" />
            <h2 className="text-base font-bold text-gray-900">Financial Thresholds</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Configure the global budget constraint utilized by the reporting dashboard.</p>
          <div className="flex space-x-3 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">ZAR</span>
              <input 
                type="number" 
                className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                value={newBudget} 
                onChange={e => setNewBudget(e.target.value)} 
              />
            </div>
            <Button onClick={() => onUpdateBudget(parseFloat(newBudget))} className="bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold shadow-sm h-9 px-6 text-xs">
              Apply Limit
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};