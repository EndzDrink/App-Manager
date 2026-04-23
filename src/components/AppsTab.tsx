import React, { useState } from 'react';
import { Server, Plus, ArrowLeft, ShieldAlert, CheckCircle2, LayoutGrid, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppsTabProps {
  apps: any[];
  onAddApp: () => void;
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, category: newCategory })
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Triggers the red Compliance Flag for duplicates
        setErrorMsg(data.message || data.error || 'Failed to add system');
      } else {
        setSuccessMsg(`Success: ${newName} added to IT Catalog.`);
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg('');
          setNewName('');
          onAddApp(); // Refresh the list
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DETAILED DRILL-DOWN VIEW ---
  if (selectedApp) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedApp(null)}
          className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to IT Catalog
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedApp.name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                  {selectedApp.category}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Catalog Entry Date</p>
              <p className="text-sm font-semibold text-gray-900">{selectedApp.created_at}</p>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-400" /> Active Municipal Deployments
            </h3>
            {selectedApp.departments && selectedApp.departments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedApp.departments.map((dept: string, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    {dept}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No active deployments found for this system.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN CATALOG VIEW ---
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <LayoutGrid className="h-5 w-5 mr-2 text-indigo-600" />
            Enterprise IT Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-1">Approved systems for eThekwini Municipality</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          {isAdding ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Register System</>}
        </Button>
      </div>

      {/* NEW: Dynamic Add System Form with Compliance Flagging */}
      {isAdding && (
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm mb-6 animate-in slide-in-from-top-2">
          <form onSubmit={handleAddSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">System Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Oracle Financials"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category</label>
              <select 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Productivity">Productivity</option>
                <option value="Communication">Communication</option>
                <option value="Geospatial">Geospatial</option>
                <option value="Resource Planning">Resource Planning</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Verifying...' : 'Submit to Catalog'}
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

      {/* Grid of Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apps.map((app) => (
          <div 
            key={app.id} 
            onClick={() => setSelectedApp(app)}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-gray-50 group-hover:bg-indigo-50 rounded-lg transition-colors">
                <Server className="h-5 w-5 text-gray-500 group-hover:text-indigo-600" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                ID: {app.id}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{app.name}</h3>
            <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded-md mb-4">{app.category}</p>
            
            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3">
              <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> {app.departments ? app.departments.length : 0} Depts</span>
              <span>Added: {app.created_at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};