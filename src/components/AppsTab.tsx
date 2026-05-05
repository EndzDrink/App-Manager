import React, { useState, useEffect } from 'react';
import { 
  Server, Plus, ArrowLeft, ShieldAlert, CheckCircle2, Users, Filter, X, 
  Search, Building2, Cloud, HardDrive, AlertTriangle, Activity, Fingerprint, Clock, XCircle, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppsTabProps {
  apps: any[];
  onAddApp: () => void;
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Add Form States
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [newVendor, setNewVendor] = useState('');
  const [newDeployment, setNewDeployment] = useState('External SaaS');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeAlphaFilter, setActiveAlphaFilter] = useState<string>('All');
  const [activeDeploymentFilter, setActiveDeploymentFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // --- CRM DEMAND TRACKER STATES ---
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isRequesting, setIsRequesting] = useState<number | null>(null);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // --- FETCH CRM REQUESTS ---
  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  // Auto-open or auto-close the pipeline based on contents
  useEffect(() => {
    setIsPipelineOpen(myRequests.length > 0);
  }, [myRequests.length]);

  const handleRequestLicense = async (systemId: number) => {
    setIsRequesting(systemId);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ system_id: systemId })
      });
      
      if (res.ok) {
        const requestedApp = apps.find(a => a.id === systemId);
        setMyRequests(prev => [{
          id: Date.now(),
          system_name: requestedApp?.name,
          status: 'Pending',
          ea_status: 'Awaiting EA Vetting',
          alignment_score: 0,
          request_date: new Date().toISOString()
        }, ...prev]);
      }
    } catch (err) {
      console.error("Request failed:", err);
    } finally {
      setIsRequesting(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/systems`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Added Authorization Header
        },
        body: JSON.stringify({ 
          name: newName, 
          functional_category: newCategory, // Fixed schema mismatch
          vendor: newVendor || 'Internal/Unknown',
          deployment_type: newDeployment,
          deployment_architecture: newDeployment.includes('SaaS') ? 'Cloud' : 'On-Premise' // Aligning to DB schema
        })
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
          setNewVendor('');
          onAddApp(); 
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HELPER FUNCTIONS FOR CRM TRACKER ---
  const getStatusIcon = (eaStatus: string) => {
    switch (eaStatus) {
      case 'Approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'Vetoed': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadgeClass = (eaStatus: string) => {
    switch (eaStatus) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Vetoed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const uniqueCategories = ['All', ...Array.from(new Set(apps.map(app => app.category)))].sort();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const hasAppsForLetter = (letter: string) => {
    return apps.some(app => 
      app.name.charAt(0).toUpperCase() === letter && 
      (activeCategoryFilter === 'All' || app.category === activeCategoryFilter) &&
      (activeDeploymentFilter === 'All' || (app.deployment_type || 'External SaaS') === activeDeploymentFilter)
    );
  };

  const normalizedApps = apps.map(app => ({
    ...app,
    vendor: app.vendor || 'Unknown Vendor',
    deployment_type: app.deployment_type || 'External SaaS'
  }));

  const processedApps = normalizedApps
    .filter(app => activeCategoryFilter === 'All' || app.category === activeCategoryFilter)
    .filter(app => activeAlphaFilter === 'All' || app.name.charAt(0).toUpperCase() === activeAlphaFilter)
    .filter(app => activeDeploymentFilter === 'All' || app.deployment_type === activeDeploymentFilter)
    .filter(app => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return app.name.toLowerCase().includes(query) || 
             app.category.toLowerCase().includes(query) || 
             app.vendor.toLowerCase().includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- DETAILED DRILL-DOWN VIEW ---
  if (selectedApp) {
    const overlappingApps = normalizedApps.filter(a => a.category === selectedApp.category && a.id !== selectedApp.id);
    
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
        <button 
          onClick={() => setSelectedApp(null)}
          className="flex items-center text-sm font-semibold text-blue-800 hover:text-blue-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to IT Catalog
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="bg-sky-50 border-b border-sky-100 px-6 py-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-900 rounded-lg flex items-center justify-center text-yellow-400 shadow-sm shrink-0">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedApp.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-white text-blue-900 border border-sky-200 shadow-sm tracking-wider">
                    {selectedApp.category}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-blue-100 text-blue-800 border border-blue-200 tracking-wider">
                    {selectedApp.deployment_type || 'External SaaS'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-blue-900/60 uppercase font-bold tracking-wider mb-1">Catalog Entry Date</p>
                <p className="text-sm font-semibold text-blue-900">{selectedApp.created_at}</p>
              </div>
              <Button 
                onClick={() => handleRequestLicense(selectedApp.id)}
                disabled={isRequesting === selectedApp.id}
                className="bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold shadow-sm"
              >
                {isRequesting === selectedApp.id ? 'Submitting...' : 'Request License'}
              </Button>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-800" /> Active Municipal Deployments
              </h3>
              {selectedApp.departments && selectedApp.departments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedApp.departments.sort().map((dept: string, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-sm font-bold text-gray-700 flex items-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                      {dept}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">No active deployments found.</p>
              )}
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="mb-5">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Vendor / Publisher</h3>
                <p className="text-sm font-bold text-gray-900 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" /> {selectedApp.vendor || 'Unknown Vendor'}
                </p>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Capability Overlap Check
                </h3>
                {overlappingApps.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 font-medium mb-3">
                      Warning: We already own {overlappingApps.length} other system(s) in the <strong>{selectedApp.category}</strong> category. Avoid duplicating licenses.
                    </p>
                    {overlappingApps.slice(0, 3).map(oa => (
                      <div key={oa.id} className="flex justify-between items-center bg-white border border-red-100 p-2 rounded-md shadow-sm">
                        <span className="text-xs font-bold text-gray-800">{oa.name}</span>
                        <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Alternative</span>
                      </div>
                    ))}
                    {overlappingApps.length > 3 && <p className="text-[10px] font-bold text-gray-400 text-center mt-2">+ {overlappingApps.length - 3} more...</p>}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-xs font-bold text-green-800">Unique Capability. No immediate duplicates found in catalog.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN CATALOG VIEW ---
  return (
    <div className="animate-in fade-in duration-500 max-w-7xl space-y-8">
      
      {/* 1. CRM DEMAND TRACKER (Collapsible) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsPipelineOpen(!isPipelineOpen)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            <h2 className="text-lg font-bold text-blue-900 tracking-tight">My Procurement Pipeline</h2>
            <span className={`ml-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${myRequests.length > 0 ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-600'}`}>
              {myRequests.length} {myRequests.length === 1 ? 'Request' : 'Requests'}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isPipelineOpen ? 'rotate-180' : ''}`} />
        </button>

        {isPipelineOpen && (
          <div className="p-4 border-t border-gray-200 bg-white">
            {myRequests.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <ShieldAlert className="h-6 w-6 text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-500">No Active Requests</p>
                <p className="text-xs text-gray-400 mt-1">Your system requests will be tracked here through EA vetting and PMO funding.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(req.ea_status)}
                        <h3 className="font-bold text-gray-900 text-sm truncate max-w-[150px]" title={req.system_name}>{req.system_name}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${getStatusBadgeClass(req.ea_status)}`}>
                        {req.ea_status}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-2 border border-gray-100">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="flex items-center"><Fingerprint className="h-3 w-3 mr-1"/> EA Alignment Score:</span>
                        <span className={`font-bold ${req.alignment_score > 70 ? 'text-green-600' : req.alignment_score > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {req.alignment_score > 0 ? `${req.alignment_score}%` : 'Pending'}
                        </span>
                      </div>
                      {req.ea_comments && (
                        <div className="italic text-gray-500 pt-1 line-clamp-2" title={req.ea_comments}>
                          "{req.ea_comments}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. CATALOG HEADER & ADD FORM */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-blue-900 flex items-center tracking-tight">
              <Server className="h-5 w-5 mr-2 text-blue-800" />
              Enterprise IT Catalog
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Approved systems for eThekwini Municipality</p>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className={`${isAdding ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-900 hover:bg-blue-800 text-yellow-400'} font-bold shadow-sm transition-colors`}
          >
            {isAdding ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> Register System</>}
          </Button>
        </div>

        {isAdding && (
          <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-md mb-6 animate-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center pb-3 border-b border-gray-100">
              <Plus className="h-4 w-4 mr-2 text-sky-500" /> Register New System to Catalog
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">System Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Oracle Financials"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner bg-gray-50"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Vendor / Publisher</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Microsoft, SAP, Internal Build"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner bg-gray-50"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Functional Category</label>
                  <select 
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-gray-50 cursor-pointer font-medium"
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
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Deployment Architecture</label>
                  <select 
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-gray-50 cursor-pointer font-medium"
                    value={newDeployment}
                    onChange={(e) => setNewDeployment(e.target.value)}
                  >
                    <option value="External SaaS">External SaaS (Cloud)</option>
                    <option value="Internal Build">Internal Build (On-Premise)</option>
                    <option value="Hybrid Architecture">Hybrid Architecture</option>
                  </select>
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-blue-800 hover:bg-blue-900 text-white font-bold shadow-sm h-[42px] px-8">
                  {isSubmitting ? 'Verifying...' : 'Submit'}
                </Button>
              </div>
            </form>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700 text-sm shadow-sm">
                <ShieldAlert className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <p><strong>Compliance Alert:</strong> {errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700 text-sm font-bold shadow-sm">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {successMsg}
              </div>
            )}
          </div>
        )}

        {/* 3. PACKAGED COMMAND TOOLBAR */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between transition-colors hover:border-sky-200">
          
          <div className="relative w-full lg:max-w-md xl:max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-sky-500" />
            </div>
            <input
              type="text"
              placeholder="Search by system, vendor, or category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-blue-900 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            
            <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-sky-300 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-2 shrink-0">Type:</span>
              <select
                className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer"
                value={activeDeploymentFilter}
                onChange={(e) => setActiveDeploymentFilter(e.target.value)}
              >
                <option value="All">All Deployments</option>
                <option value="Internal Build">Internal Builds</option>
                <option value="External SaaS">External SaaS</option>
                <option value="Hybrid Architecture">Hybrid</option>
              </select>
            </div>

            <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-sky-300 transition-colors">
              <Filter className="h-4 w-4 mr-2 text-blue-800 shrink-0" />
              <select
                className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer w-full"
                value={activeCategoryFilter}
                onChange={(e) => {
                  setActiveCategoryFilter(e.target.value);
                  setActiveAlphaFilter('All');
                }}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Functions' : cat}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-6 bg-gray-200 hidden lg:block"></div>

            <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-sky-300 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-2 shrink-0">Index:</span>
              <select
                className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer"
                value={activeAlphaFilter}
                onChange={(e) => setActiveAlphaFilter(e.target.value)}
              >
                <option value="All">A-Z (All)</option>
                {alphabet.map(letter => {
                  const hasApps = hasAppsForLetter(letter);
                  return (
                    <option key={letter} value={letter} disabled={!hasApps}>
                      {letter} {!hasApps && '(Empty)'}
                    </option>
                  );
                })
                }
              </select>
            </div>

          </div>
        </div>

        {/* Grid of Systems */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {processedApps.map((app) => {
            const isInternal = app.deployment_type === 'Internal Build';
            const DeploymentIcon = isInternal ? HardDrive : Cloud;

            return (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isInternal ? 'bg-green-500' : 'bg-sky-400'}`}></div>

                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 group-hover:bg-blue-900 group-hover:border-blue-800 rounded-lg transition-colors">
                    <DeploymentIcon className={`h-5 w-5 ${isInternal ? 'text-green-600' : 'text-sky-500'} group-hover:text-yellow-400 transition-colors`} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
                      SYS-{app.id}
                    </span>
                    <span className="text-[8px] uppercase font-bold text-gray-500 flex items-center">
                      {app.vendor.length > 15 ? app.vendor.substring(0, 15) + '...' : app.vendor}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4 flex-1">
                  <h3 className="font-bold text-gray-900 text-base leading-tight mb-1.5 group-hover:text-blue-800 transition-colors">{app.name}</h3>
                  <span className="text-[10px] font-bold text-blue-900 bg-sky-50 border border-sky-100 inline-flex items-center px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {app.category}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-auto">
                  <span className="flex items-center font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    <Users className="h-3 w-3 mr-1.5 text-sky-500" /> 
                    {app.departments ? app.departments.length : 0}
                  </span>
                  <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded-md border ${isInternal ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {isInternal ? 'Internal' : 'External'}
                  </span>
                </div>
              </div>
            );
          })}
          
          {processedApps.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white border border-dashed border-gray-300 rounded-xl shadow-sm">
              <Search className="h-10 w-10 text-sky-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-900">No systems found matching your search or filters.</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your keywords or clearing the dropdowns.</p>
              <Button 
                variant="outline" 
                onClick={() => { 
                  setActiveCategoryFilter('All'); 
                  setActiveAlphaFilter('All'); 
                  setActiveDeploymentFilter('All');
                  setSearchQuery(''); 
                }}
                className="mt-4 text-xs font-bold text-blue-800 border-blue-200 hover:bg-sky-50"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};