import React, { useState } from 'react';
import { Server, Plus, ArrowLeft, ShieldAlert, CheckCircle2, LayoutGrid, Users, Filter, BookA, X } from 'lucide-react';
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
  
  // BI States for dual-filtering
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeAlphaFilter, setActiveAlphaFilter] = useState<string>('All');

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
        setErrorMsg(data.message || data.error || 'Failed to add system');
      } else {
        setSuccessMsg(`Success: ${newName} added to IT Catalog.`);
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMsg('');
          setNewName('');
          onAddApp(); 
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DATA PROCESSING: Dual Filtering & Sorting ---
  
  // 1. Get unique categories
  const uniqueCategories = ['All', ...Array.from(new Set(apps.map(app => app.category)))].sort();

  // 2. Generate standard A-Z alphabet
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // 3. Smart check to see if a letter actually has apps (based on current category filter)
  const hasAppsForLetter = (letter: string) => {
    return apps.some(app => 
      app.name.charAt(0).toUpperCase() === letter && 
      (activeCategoryFilter === 'All' || app.category === activeCategoryFilter)
    );
  };

  // 4. Filter by Category AND Alphabet, then sort A-Z
  const processedApps = apps
    .filter(app => activeCategoryFilter === 'All' || app.category === activeCategoryFilter)
    .filter(app => activeAlphaFilter === 'All' || app.name.charAt(0).toUpperCase() === activeAlphaFilter)
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- DETAILED DRILL-DOWN VIEW ---
  if (selectedApp) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1 border border-gray-200">
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
              <Users className="h-4 w-4 mr-2 text-indigo-500" /> Active Municipal Deployments
            </h3>
            {selectedApp.departments && selectedApp.departments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedApp.departments.sort().map((dept: string, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 flex items-center shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                    {dept}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">No active deployments found for this system.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN CATALOG VIEW ---
  return (
    <div className="animate-in fade-in duration-500 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center tracking-tight">
            <LayoutGrid className="h-5 w-5 mr-2 text-indigo-600" />
            Enterprise IT Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Approved systems for eThekwini Municipality</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className={`${isAdding ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} shadow-sm transition-colors`}
        >
          {isAdding ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> Register System</>}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 shadow-inner mb-6 animate-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-indigo-900 mb-4">Register New System to Catalog</h3>
          <form onSubmit={handleAddSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">System Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Oracle Financials"
                className="w-full border border-indigo-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Functional Category</label>
              <select 
                className="w-full border border-indigo-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Productivity">Productivity</option>
                <option value="Communication">Communication</option>
                <option value="Geospatial">Geospatial</option>
                <option value="Resource Planning">Resource Planning</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="Security">Security</option>
                <option value="Asset Management">Asset Management</option>
                <option value="Emergency Response">Emergency Response</option>
                <option value="Logistics">Logistics</option>
                <option value="Scheduling">Scheduling</option>
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9">
              {isSubmitting ? 'Verifying...' : 'Submit to Catalog'}
            </Button>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700 text-sm shadow-sm">
              <ShieldAlert className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
              <p><strong>Compliance Alert:</strong> {errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700 text-sm font-medium shadow-sm">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* 1. Category Slicer Row */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-1 custom-scrollbar">
        <div className="flex items-center text-gray-400 mr-2 shrink-0">
          <Filter className="h-4 w-4 mr-1" />
          <span className="text-xs font-bold uppercase tracking-wider">Category:</span>
        </div>
        {uniqueCategories.map(category => (
          <button
            key={category}
            onClick={() => {
              setActiveCategoryFilter(category);
              setActiveAlphaFilter('All'); // Reset alphabet when category changes for better UX
            }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeCategoryFilter === category 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-indigo-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 2. NEW: A-Z Directory Slicer Row */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-4 mb-3 custom-scrollbar">
        <div className="flex items-center text-gray-400 mr-3 shrink-0">
          <BookA className="h-4 w-4 mr-1" />
          <span className="text-xs font-bold uppercase tracking-wider">Directory:</span>
        </div>
        
        <button
          onClick={() => setActiveAlphaFilter('All')}
          className={`flex-shrink-0 px-3 py-1 rounded-md text-xs font-bold transition-all border ${
            activeAlphaFilter === 'All' 
              ? 'bg-gray-800 text-white border-gray-800 shadow-sm' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
        >
          All
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1 shrink-0"></div>

        {alphabet.map(letter => {
          const hasApps = hasAppsForLetter(letter);
          return (
            <button
              key={letter}
              disabled={!hasApps}
              onClick={() => setActiveAlphaFilter(letter)}
              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all border ${
                !hasApps 
                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                  : activeAlphaFilter === letter 
                    ? 'bg-gray-800 text-white border-gray-800 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Grid of Systems */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {processedApps.map((app) => (
          <div 
            key={app.id} 
            onClick={() => setSelectedApp(app)}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-gray-50 border border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 rounded-lg transition-colors">
                <Server className="h-5 w-5 text-gray-500 group-hover:text-indigo-600" />
              </div>
              <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
                SYS-{app.id}
              </span>
            </div>
            
            <div className="mb-4 flex-1">
              <h3 className="font-bold text-gray-900 text-base leading-tight mb-1.5 group-hover:text-indigo-700 transition-colors">{app.name}</h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 inline-flex items-center px-2 py-0.5 rounded-full uppercase tracking-wider">
                {app.category}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-auto">
              <span className="flex items-center font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                <Users className="h-3 w-3 mr-1.5 text-indigo-500" /> 
                {app.departments ? app.departments.length : 0} Depts
              </span>
              <span className="text-[10px] uppercase font-semibold">Added: {app.created_at}</span>
            </div>
          </div>
        ))}
        
        {processedApps.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <Server className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No systems found matching your exact filters.</p>
            <Button 
              variant="link" 
              onClick={() => { setActiveCategoryFilter('All'); setActiveAlphaFilter('All'); }}
              className="text-indigo-600 mt-2 text-xs"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};