import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, RefreshCw, Settings, Wallet, Save, Loader2, Globe, Plus, Link2 } from "lucide-react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingConnector, setIsAddingConnector] = useState(false);

  // New Connector State
  const [provider, setProvider] = useState('Okta');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleAddConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddConnector({ provider_name: provider, api_endpoint: endpoint, api_key: apiKey, sync_frequency: 'daily' });
    setIsAddingConnector(false);
    setEndpoint('');
    setApiKey('');
  };

  return (
    <div className="space-y-8">
      {/* 1. Data Connectors (Enterprise Section) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-metric-value">External Integrations</h2>
          </div>
          <Button size="sm" onClick={() => setIsAddingConnector(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Connect API
          </Button>
        </div>

        {isAddingConnector && (
          <Card className="p-6 mb-6 border-blue-200 bg-blue-50/30">
            <form onSubmit={handleAddConnector} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Provider (e.g. Azure AD)" className="p-2 border rounded bg-white text-sm" required />
              <input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="API Endpoint URL" className="p-2 border rounded bg-white text-sm" required />
              <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="API Key / Token" className="p-2 border rounded bg-white text-sm" required />
              <div className="md:col-span-3 flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingConnector(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white">Save Connector</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          {connectors.length === 0 ? (
            <p className="text-sm text-metric-label italic text-center py-8 border-2 border-dashed rounded-lg">No active data pipelines found.</p>
          ) : (
            connectors.map(conn => (
              <Card key={conn.id} className="p-4 bg-metric-card border border-border flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-metric-value">{conn.provider_name}</h3>
                    <p className="text-xs text-metric-label">{conn.api_endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-green-100 text-green-700 rounded-full">{conn.status}</span>
                  <div className="text-right text-[10px] text-metric-label">
                    <div>FREQ: {conn.sync_frequency}</div>
                    <div>LAST: {conn.last_sync ? new Date(conn.last_sync).toLocaleDateString() : 'Pending'}</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* 2. Management & Budget (Existing Logic) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="h-5 w-5 text-metric-label" />
            <h2 className="text-xl font-semibold text-metric-value">System Tools</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Button onClick={onExport} variant="outline" className="flex-col h-auto py-4 text-xs"><Download className="h-5 w-5 mb-2" />Export</Button>
            <Button variant="outline" className="flex-col h-auto py-4 text-xs border-orange-200 text-orange-500"><RotateCcw className="h-5 w-5 mb-2" />Reset</Button>
            <Button onClick={onRefresh} variant="outline" className="flex-col h-auto py-4 text-xs border-blue-200 text-blue-500"><RefreshCw className="h-5 w-5 mb-2" />Sync</Button>
          </div>
        </section>

        <section>
          <div className="flex items-center space-x-3 mb-6">
            <Wallet className="h-5 w-5 text-metric-label" />
            <h2 className="text-xl font-semibold text-metric-value">Spending Limit</h2>
          </div>
          <Card className="p-4 bg-metric-card border border-border">
            <div className="flex space-x-3">
              <input type="number" className="flex-1 p-2 bg-transparent border rounded text-metric-value" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
              <Button onClick={() => onUpdateBudget(parseFloat(newBudget))} disabled={isSaving} className="bg-primary text-white">Save</Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};