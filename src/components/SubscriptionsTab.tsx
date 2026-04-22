import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, X, Plus, Loader2, Edit2 } from "lucide-react";

interface SubscriptionsTabProps {
  subscriptions: any[];
  onAddSubscription: () => void; 
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ subscriptions, onAddSubscription }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add Form State
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [planName, setPlanName] = useState('Premium');
  const [price, setPrice] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Triggered when the pencil icon is clicked
  const handleEditClick = (sub: any) => {
    setEditingId(sub.id);
    setEditPlanName(sub.plan_name || '');
    setEditPrice(sub.price.toString());
  };

  // Submit the updated data
  const handleUpdate = async (id: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:3000/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: editPlanName,
          price: parseFloat(editPrice)
        })
      });

      if (!response.ok) throw new Error('Failed to update subscription');
      
      setEditingId(null);
      onAddSubscription(); // Refresh the list and totals

    } catch (error) {
      console.error(error);
      alert("Failed to update subscription. Check the console.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          category,
          plan_name: planName,
          price: parseFloat(price),
          billing_cycle: 'monthly'
        })
      });

      if (!response.ok) throw new Error('Failed to save subscription');
      
      setAppName('');
      setPrice('');
      setPlanName('Premium');
      setIsAdding(false);
      
      onAddSubscription(); 

    } catch (error) {
      console.error(error);
      alert("Failed to save subscription. Check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/subscriptions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete subscription');
      onAddSubscription();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete the subscription.");
    }
  };

  const formatZAR = (value: any) => {
    if (typeof value === 'number') return `ZAR ${value.toFixed(2)}`;
    if (typeof value === 'string') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      return `ZAR ${parseFloat(numericValue).toFixed(2)}`;
    }
    return 'ZAR 0.00';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Active Subscriptions</h2>
          <p className="text-sm text-metric-label">Track your recurring subscriptions and costs</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {subscriptions.map((sub) => (
          <Card key={sub.id} className="p-4 bg-metric-card border border-border shadow-sm">
            {editingId === sub.id ? (
              // --- INLINE EDIT MODE ---
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-1/2">
                  <div className={`w-12 h-12 ${sub.color || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0`}>
                    {sub.icon || '📱'}
                  </div>
                  <div className="w-full space-y-2">
                    <h3 className="font-semibold text-metric-value">{sub.name}</h3>
                    <input 
                      className="w-full text-sm p-1.5 bg-transparent border border-border rounded text-metric-value focus:outline-none focus:ring-1 focus:ring-primary" 
                      placeholder="Plan Name (e.g., Premium)"
                      value={editPlanName}
                      onChange={(e) => setEditPlanName(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-metric-label">ZAR</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-24 p-1.5 bg-transparent border border-border rounded text-metric-value focus:outline-none focus:ring-1 focus:ring-primary" 
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdate(sub.id)} 
                    disabled={isUpdating} 
                    className="bg-primary text-primary-foreground"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditingId(null)}
                    className="border-border text-metric-label"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // --- STANDARD DISPLAY MODE ---
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${sub.color || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {sub.icon || '📱'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-metric-value">{sub.name}</h3>
                    <p className="text-sm text-metric-label">
                      {sub.category} {sub.plan_name && `• ${sub.plan_name}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <div className="font-bold text-metric-value">{formatZAR(sub.price)}</div>
                    <div className="text-sm text-metric-label">/month</div>
                  </div>
                  
                  <div className="text-right hidden md:block">
                    <div className="font-medium text-metric-value">{sub.billing || 'Auto-renews'}</div>
                    <div className="text-sm text-metric-label">next billing</div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={`${sub.usageColor || 'bg-green-500'} text-white hidden sm:flex`}>
                      {sub.usage || 'Active'}
                    </Badge>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-border text-metric-label hover:bg-secondary hover:text-metric-value"
                        onClick={() => handleEditClick(sub)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-300 text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(sub.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}

        {isAdding ? (
          <Card className="p-6 bg-metric-card border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-metric-value">Add New Subscription</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-metric-label">App Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full mt-1 p-2 bg-transparent border border-border rounded text-metric-value focus:outline-none focus:ring-1 focus:ring-primary" 
                    placeholder="e.g., Spotify" 
                    value={appName} 
                    onChange={e => setAppName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-metric-label">Monthly Price (ZAR)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full mt-1 p-2 bg-transparent border border-border rounded text-metric-value focus:outline-none focus:ring-1 focus:ring-primary" 
                    placeholder="e.g., 159.99" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-metric-label">Category</label>
                  <select 
                    className="w-full mt-1 p-2 bg-transparent border border-border rounded text-metric-value focus:outline-none focus:ring-1 focus:ring-primary"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Finance">Finance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Games">Games</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-metric-label">Plan Name</label>
                  <input 
                    type="text" 
                    className="w-full mt-1 p-2 bg-transparent border border-border rounded text-metric-value focus:outline-none focus:ring-1 focus:ring-primary" 
                    placeholder="e.g., Premium Family" 
                    value={planName} 
                    onChange={e => setPlanName(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground">
                  {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Save Subscription
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
            <Plus className="mr-2 h-5 w-5" /> Add New Subscription
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsTab;