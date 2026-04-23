import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, RefreshCw, Settings, Wallet, Globe, Plus, Link2, FileSpreadsheet } from "lucide-react";

interface AdminTabProps {
  stats: { totalApps: number; activeSubscriptions: number; recommendations: number; monthlyCost: number; };
  budget: number;
  connectors: any[];
  onRefresh: () => void;
  onExport: () => void;
  onUpdateBudget: (newBudget: number) => Promise<void>;
  onAddConnector: (connector: any) => Promise<void>;
}

export const AdminTab: React.FC<AdminTabProps> = ({ stats, budget, connectors, onRefresh, onExport, onUpdateBudget, onAddConnector }) => {
  const [newBudget, setNewBudget] = useState(budget.toString());
  const [isAddingConnector, setIsAddingConnector] = useState(false);
  const [provider, setProvider] = useState('Okta');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSyncingPMO, setIsSyncingPMO] = useState(false);

  const handleGlobalSync = async () => {
    const res = await fetch('http://localhost:3000/api/connectors/1/sync', { method: 'POST' });
    if (res.ok) onRefresh();
  };

  const handlePMOSync = async () => {
    setIsSyncingPMO(true);
    // Hits the new stub endpoint
    const res = await fetch('http://localhost:3000/api/pmo/sync', { method: 'POST' });
    if (res.ok) onRefresh();
    setTimeout(() => setIsSyncingPMO(false), 800);
  };

  const handleAddConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddConnector({ provider_name: provider, api_endpoint: endpoint, api_key: apiKey, sync_frequency: 'daily' });
    setIsAddingConnector(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* NEW: PMO SharePoint Integration Module */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-metric-value">PMO SharePoint Integration</h2>
          </div>
        </div>
        <Card className="p-6 border-green-200 bg-green-50/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-metric-value">Project Excel Sync</h3>
              <p className="text-sm text-metric-label mt-1">Connects to Microsoft Graph API to pull active project data and lifecycle dates.</p>
              <div className="flex gap-2 mt-3 text-xs">
                <span className="bg-white border px-2 py-1 rounded text-gray-500">Tenant ID: Not Configured</span>
                <span className="bg-white border px-2 py-1 rounded text-gray-500">Client ID: Not Configured</span>
              </div>
            </div>
            <Button 
              onClick={handlePMOSync} 
              disabled={isSyncingPMO}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingPMO ? 'animate-spin' : ''}`} /> 
              {isSyncingPMO ? 'Syncing...' : 'Sync PMO Data'}
            </Button>
          </div>
        </Card>
      </section>

      {/* Standard Connectors */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-metric-value">External Integrations</h2>
          </div>
          <Button size="sm" onClick={() => setIsAddingConnector(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Connect API
          </Button>
        </div>

        {isAddingConnector && (
          <Card className="p-6 mb-6 border-blue-200 bg-blue-50/30">
            <form onSubmit={handleAddConnector} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Provider (e.g., Okta)" className="p-2 border rounded bg-white text-sm" required />
              <input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="API URL" className="p-2 border rounded bg-white text-sm" required />
              <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="API Key" className="p-2 border rounded bg-white text-sm" required />
              <div className="md:col-span-3 flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingConnector(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white">Save Connector</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          {connectors.map(conn => (
            <Card key={conn.id} className="p-4 bg-white border border-border flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Link2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{conn.provider_name}</h3>
                  <p className="text-xs text-metric-label">{conn.api_endpoint}</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-metric-label uppercase">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{conn.status}</span>
                <div className="mt-2">Last Sync: {conn.last_sync ? new Date(conn.last_sync).toLocaleDateString() : 'Never'}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="h-5 w-5 text-metric-label" />
            <h2 className="text-xl font-semibold text-metric-value">System Tools</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Button onClick={onExport} variant="outline" className="flex-col h-auto py-4 text-xs bg-white hover:bg-gray-50 border-gray-200"><Download className="h-5 w-5 mb-2 text-gray-500" />Export CSV</Button>
            <Button variant="outline" className="flex-col h-auto py-4 text-xs bg-white hover:bg-orange-50 border-orange-200 text-orange-600"><RotateCcw className="h-5 w-5 mb-2" />Reset Engine</Button>
            <Button onClick={handleGlobalSync} variant="outline" className="flex-col h-auto py-4 text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-600"><RefreshCw className="h-5 w-5 mb-2" />Force Sync</Button>
          </div>
        </section>

        <section>
          <div className="flex items-center space-x-3 mb-6">
            <Wallet className="h-5 w-5 text-metric-label" />
            <h2 className="text-xl font-semibold text-metric-value">Spending Limit</h2>
          </div>
          <Card className="p-4 bg-white border border-border shadow-sm">
            <div className="flex space-x-3">
              <input type="number" className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-metric-value focus:ring-2 focus:ring-blue-500 outline-none" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
              <Button onClick={() => onUpdateBudget(parseFloat(newBudget))} className="bg-blue-600 hover:bg-blue-700 text-white">Save Limit</Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};