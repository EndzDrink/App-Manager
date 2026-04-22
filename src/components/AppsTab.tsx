import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Trash2, Loader2, Clock } from "lucide-react";

interface AppsTabProps {
  apps: any[]; 
  onAddApp: () => void; 
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState('Productivity');

  const handleLogUsage = async (appId: string, minutes: number) => {
    setLoggingId(appId);
    try {
      const response = await fetch('http://localhost:3000/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, duration_minutes: minutes })
      });

      if (!response.ok) throw new Error('Failed to log usage');
      
      // Optional: Add a toast notification here if you have one
      console.log(`Successfully logged ${minutes} minutes`);
      
      // We trigger onAddApp to refresh the data flow, 
      // though in Index.tsx you might want to call refreshAllData() 
      // to update the charts as well.
      onAddApp(); 

    } catch (error) {
      console.error(error);
      alert("Failed to log usage.");
    } finally {
      setLoggingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: appName, category })
      });

      if (!response.ok) throw new Error('Failed to save app');
      
      setAppName('');
      setIsAdding(false);
      onAddApp(); 

    } catch (error) {
      console.error(error);
      alert("Failed to save app.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this app? (It will fail if a subscription is linked to it)")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/apps/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete app');
      onAddApp();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete the app.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Your Apps</h2>
          <p className="text-sm text-metric-label">Manage and track your installed applications</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {apps.map((app) => (
          <Card key={app.id} className="p-4 bg-metric-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                  {app.icon || '📱'}
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{app.name}</h3>
                  <p className="text-sm text-metric-label">{app.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Session Logging Section */}
                <div className="flex items-center space-x-2 border-r border-border pr-6">
                  <span className="text-xs font-medium text-metric-label uppercase mr-2 hidden md:block">Log Session:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs hover:bg-secondary"
                    onClick={() => handleLogUsage(app.id, 30)}
                    disabled={loggingId === app.id}
                  >
                    {loggingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "+30m"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs hover:bg-secondary"
                    onClick={() => handleLogUsage(app.id, 60)}
                    disabled={loggingId === app.id}
                  >
                    {loggingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "+1h"}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-300 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(app.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {isAdding ? (
          <Card className="p-6 bg-metric-card border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-metric-value">Add New App</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-metric-label">App Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full mt-1 p-2 bg-transparent border border-border rounded text-metric-value" 
                    placeholder="e.g., Slack" 
                    value={appName} 
                    onChange={e => setAppName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-metric-label">Category</label>
                  <select 
                    className="w-full mt-1 p-2 bg-transparent border border-border rounded text-metric-value"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Productivity">Productivity</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Finance">Finance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Games">Games</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground">
                  {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Save App
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Button 
            onClick={() => setIsAdding(true)} 
            className="w-full border-dashed py-8 text-metric-label hover:text-metric-value hover:bg-secondary/50" 
            variant="outline"
          >
            <Plus className="mr-2 h-5 w-5" /> Add New App
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppsTab;