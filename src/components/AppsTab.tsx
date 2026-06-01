import React, { useState, useEffect } from 'react';
import { 
  Server, Plus, ArrowLeft, ShieldAlert, CheckCircle2, Users, Filter, X, 
  Search, Building2, Cloud, HardDrive, AlertTriangle, LayoutGrid, List, Check, Database, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppsTabProps {
  apps: any[];
  onAddApp: () => void;
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Role State
  const [userRole] = useState(localStorage.getItem('appManagerRole') || 'StandardUser');
  const canManageCatalog = ['SuperAdmin', 'EA', 'CIO'].includes(userRole);
  const isManager = ['SuperAdmin', 'EA', 'DepartmentHead', 'CRMHead'].includes(userRole);

  // Add Form States matching DB constraints
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [newVendor, setNewVendor] = useState('');
  const [newDeploymentType, setNewDeploymentType] = useState('External');
  const [newDeploymentArch, setNewDeploymentArch] = useState('SaaS');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter & View States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeAlphaFilter, setActiveAlphaFilter] = useState<string>('All');
  const [activeDeploymentFilter, setActiveDeploymentFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isRequesting, setIsRequesting] = useState<number | string | null>(null);
  
  // Semantic Triage States
  const [justification, setJustification] = useState('');
  const [isTriageBlocked, setIsTriageBlocked] = useState(false);
  const [triageSuggestion, setTriageSuggestion] = useState<any | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [selectedTriageOption, setSelectedTriageOption] = useState<'use_existing' | 'exception' | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!justification || justification.length < 10 || selectedTriageOption) {
      setIsTriageBlocked(false);
      setTriageSuggestion(null);
      return;
    }

    const text = justification.toLowerCase();
    
    const matches = apps.map(app => {
      let score = 0;
      if (text.includes(app.category.toLowerCase())) score += 5;
      if (text.includes('task') || text.includes('project') || text.includes('agile')) {
        if (app.category === 'Productivity' || app.category === 'Operations') score += 10;
      }
      if (text.includes('map') || text.includes('gis') || text.includes('location')) {
        if (app.category === 'Geospatial') score += 10;
      }
      return { app, score };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);

    if (matches.length > 0 && matches[0].score >= 10 && matches[0].app.id !== selectedApp?.id) {
      setIsTriageBlocked(true);
      setTriageSuggestion(matches[0].app);
    } else {
      setIsTriageBlocked(false);
      setTriageSuggestion(null);
    }
  }, [justification, apps, selectedApp, selectedTriageOption]);

  const handleRequestLicense = async (systemId: number | string) => {
    if (selectedTriageOption === 'exception' && exceptionReason.length < 10) {
        setErrorMsg("You must provide architectural justification to bypass the enterprise standard.");
        return;
    }
    
    setIsRequesting(systemId);
    const cleanSystemId = typeof systemId === 'string' ? parseInt(systemId.replace('SYS-', ''), 10) : systemId;

    try {
      const token = localStorage.getItem('appManagerToken');
      const finalJustification = selectedTriageOption === 'exception' 
        ? `${justification} 

[ARCHITECTURAL EXCEPTION]: ${exceptionReason}`
        : justification;

      const res = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            system_id: cleanSystemId,
            justification: finalJustification
        }) 
      });
      
      if (res.ok) {
        setSuccessMsg("Request submitted successfully. Track it on your Workspace Dashboard.");
        setTimeout(() => {
            setSuccessMsg('');
            setJustification('');
            setExceptionReason('');
            setSelectedTriageOption(null);
        }, 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to request license");
        setTimeout(() => setErrorMsg(''), 3000);
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newName, 
          functional_category: newCategory,
          vendor: newVendor || 'Internal/Unknown',
          deployment_type: newDeploymentType,
          deployment_architecture: newDeploymentArch
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

  const uniqueCategories = ['All', ...Array.from(new Set(apps.map(app => app.category)))].sort();
  
  const normalizedApps = apps.map(app => ({
    ...app,
    vendor: app.vendor || 'Unknown Vendor',
    deployment_type: app.deployment_type || 'External',
    deployment_architecture: app.deployment_architecture || 'SaaS'
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
    const targetSystemId = (selectedTriageOption === 'use_existing' && triageSuggestion) ? triageSuggestion.id : selectedApp.id;
        
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-8">
        <button 
          onClick={() => {
              setSelectedApp(null);
              setJustification('');
              setIsTriageBlocked(false);
              setTriageSuggestion(null);
              setSelectedTriageOption(null);
          }}
          className="flex items-center text-sm font-bold text-blue-800 hover:text-blue-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to IT Catalog
        </button>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center font-bold shadow-sm animate-in zoom-in-95">
            <CheckCircle2 className="h-5 w-5 mr-2" /> {successMsg}
          </div>
        )}
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center font-bold shadow-sm animate-in zoom-in-95">
            <ShieldAlert className="h-5 w-5 mr-2" /> {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="bg-sky-50 border-b border-sky-100 px-6 py-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-blue-900 rounded-lg flex items-center justify-center text-yellow-400 shadow-sm shrink-0">
                {selectedApp.deployment_type?.includes('Internal') || selectedApp.deployment_architecture?.includes('On-Prem') ? <HardDrive className="h-7 w-7" /> : <Cloud className="h-7 w-7" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedApp.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-white text-blue-900 border border-sky-200 shadow-sm tracking-wider">
                    {selectedApp.category}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-blue-100 text-blue-800 border border-blue-200 tracking-wider">
                    Type: {selectedApp.deployment_type || 'External'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-purple-100 text-purple-800 border border-purple-200 tracking-wider">
                    Arch: {selectedApp.deployment_architecture || 'SaaS'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-blue-900/60 uppercase font-bold tracking-wider mb-0.5">Catalog Entry Date</p>
                <p className="text-sm font-semibold text-blue-900">{selectedApp.created_at || 'Legacy Data'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: The Request Form */}
            <div className="flex flex-col h-full">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center">
                <Database className="h-4 w-4 mr-2 text-sky-500" /> Procurement Request Form
              </h3>
              
              {!isManager ? (
                <div className="flex flex-col h-full bg-gray-50 border border-gray-100 p-5 rounded-xl">
                   <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                       Business Justification
                   </label>
                   <p className="text-xs text-gray-500 mb-3">Please explain why you need this software and what business tasks it will solve.</p>
                   <textarea 
                     className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                     placeholder="e.g. I need to track my team's project tasks and deadlines..."
                     value={justification}
                     onChange={(e) => setJustification(e.target.value)}
                     disabled={selectedTriageOption === 'use_existing'}
                   />

                   {isTriageBlocked && triageSuggestion && !selectedTriageOption && (
                     <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm animate-in zoom-in-95">
                         <div className="flex items-start">
                             <ShieldAlert className="h-5 w-5 text-orange-600 mr-3 mt-0.5 shrink-0" />
                             <div>
                                 <h4 className="text-sm font-black text-orange-900 tracking-tight">Procurement Blocked</h4>
                                 <p className="text-xs text-orange-800 mt-1 mb-3">
                                     eThekwini Municipality already holds an enterprise license for <strong className="font-black text-gray-900 bg-white px-1 py-0.5 rounded">{triageSuggestion.name}</strong>, which aligns with your stated requirements.
                                 </p>
                                 <div className="space-y-2">
                                     <button 
                                        onClick={() => setSelectedTriageOption('use_existing')}
                                        className="w-full text-left bg-white border border-orange-200 p-2 rounded text-xs font-bold text-gray-800 hover:border-orange-400 hover:bg-orange-100/50 transition-colors"
                                     >
                                         <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5 text-green-600" />
                                         I will request access to {triageSuggestion.name} instead.
                                     </button>
                                     <button 
                                        onClick={() => setSelectedTriageOption('exception')}
                                        className="w-full text-left bg-white border border-orange-200 p-2 rounded text-xs font-bold text-gray-800 hover:border-orange-400 hover:bg-orange-100/50 transition-colors"
                                     >
                                         <X className="h-3.5 w-3.5 inline mr-1.5 text-red-600" />
                                         The existing tool does not meet my needs.
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                   )}

                   {selectedTriageOption === 'exception' && (
                       <div className="mb-4 animate-in slide-in-from-top-2">
                           <label className="block text-[10px] font-black text-red-600 uppercase tracking-wider mb-2 flex items-center">
                               <AlertTriangle className="h-3 w-3 mr-1" /> Architectural Exception Justification
                           </label>
                           <textarea 
                             className="w-full h-24 p-3 border-2 border-red-200 bg-red-50 rounded-lg text-sm outline-none focus:ring-red-500 resize-none transition-all"
                             placeholder={`Explain why ${triageSuggestion?.name} cannot fulfill your requirement. This will be audited by the EA team.`}
                             value={exceptionReason}
                             onChange={(e) => setExceptionReason(e.target.value)}
                           />
                       </div>
                   )}

                   <div className="mt-auto pt-4 flex justify-end">
                       <Button 
                         onClick={() => handleRequestLicense(targetSystemId)}
                         disabled={isRequesting === targetSystemId || (justification.length < 10) || (isTriageBlocked && !selectedTriageOption)}
                         className={`font-bold shadow-md transition-all h-10 px-6 ${
                             isTriageBlocked && !selectedTriageOption 
                             ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none' 
                             : 'bg-blue-900 hover:bg-blue-800 text-yellow-400 active:scale-95'
                         }`}
                       >
                         {isRequesting === targetSystemId ? 'Submitting...' : 
                          isTriageBlocked && !selectedTriageOption ? <><Lock className="h-4 w-4 mr-2"/> Blocked</> : 
                          'Submit Request'}
                       </Button>
                   </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
                    <div>
                        <ShieldAlert className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-500">Management Account</p>
                        <p className="text-xs text-gray-400 mt-1">Software requests must be lodged via standard user accounts.</p>
                    </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 flex flex-col">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Publisher Details</h3>
                <p className="text-base font-bold text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-500" /> {selectedApp.vendor || 'Unknown Vendor'}
                </p>
              </div>

              <div className="flex-1">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> EA Capability Overlap Audit
                </h3>
                {overlappingApps.length > 0 ? (
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      <strong>Warning:</strong> The municipality already maintains <span className="text-red-600 font-black">{overlappingApps.length}</span> other system(s) in the <strong>{selectedApp.category}</strong> category.
                    </p>
                    <div className="space-y-2 mt-3">
                    {overlappingApps.slice(0, 3).map(oa => (
                      <div key={oa.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-2.5 rounded-md">
                        <span className="text-xs font-bold text-gray-800 flex items-center"><Server className="h-3 w-3 mr-2 text-gray-400"/>{oa.name}</span>
                        <span className="text-[9px] uppercase font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Alternative</span>
                      </div>
                    ))}
                    </div>
                    {overlappingApps.length > 3 && <p className="text-[10px] font-bold text-gray-400 text-center mt-3 pt-2 border-t border-gray-100">+ {overlappingApps.length - 3} more catalog entries</p>}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-xs font-bold text-green-800 leading-tight">Unique Capability Verified. No functional duplicates currently exist in the Enterprise Catalog.</span>
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
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4 max-w-7xl mx-auto">
      
      {/* 1. CATALOG HEADER & ADD FORM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h2 className="text-xl font-black text-blue-900 flex items-center tracking-tight">
            <Server className="h-6 w-6 mr-2 text-blue-800" />
            Enterprise IT Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Browse approved software systems for eThekwini Municipality.</p>
        </div>
        
        {canManageCatalog && (
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className={`${isAdding ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-900 hover:bg-blue-800 text-yellow-400'} font-bold shadow-sm transition-colors h-10 px-5`}
          >
            {isAdding ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> Register System</>}
          </Button>
        )}
      </div>

      {isAdding && canManageCatalog && (
        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-md mb-6 animate-in slide-in-from-top-2 shrink-0">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="w-full">
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
              
              <div className="w-full">
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Deployment Type</label>
                <select 
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-gray-50 cursor-pointer font-medium"
                  value={newDeploymentType}
                  onChange={(e) => setNewDeploymentType(e.target.value)}
                >
                  <option value="External">External</option>
                  <option value="External SaaS">External SaaS</option>
                  <option value="Internal Build">Internal Build</option>
                  <option value="Hybrid Architecture">Hybrid Architecture</option>
                </select>
              </div>

              <div className="w-full">
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Architecture</label>
                <select 
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-inner bg-gray-50 cursor-pointer font-medium"
                  value={newDeploymentArch}
                  onChange={(e) => setNewDeploymentArch(e.target.value)}
                >
                  <option value="SaaS">SaaS</option>
                  <option value="Cloud">Cloud</option>
                  <option value="On-Premise">On-Premise</option>
                  <option value="Legacy On-Prem">Legacy On-Prem</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Desktop-Sync">Desktop-Sync</option>
                </select>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold shadow-sm h-[42px]">
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

      {/* 2. FILTER TOOLBAR */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between shrink-0">
        
        <div className="relative w-full lg:max-w-md">
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
          
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 hidden lg:block"></div>
            <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-sky-300 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-2 shrink-0">Deploy:</span>
              <select
                className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer"
                value={activeDeploymentFilter}
                onChange={(e) => setActiveDeploymentFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="External">External</option>
                <option value="External SaaS">External SaaS</option>
                <option value="Internal Build">Internal Build</option>
                <option value="Hybrid Architecture">Hybrid Architecture</option>
              </select>
            </div>

          <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-sky-300 transition-colors">
            <Filter className="h-3.5 w-3.5 mr-2 text-blue-800 shrink-0" />
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
        </div>
      </div>

      {/* 3. CATALOG GRID / LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1">
        {processedApps.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-gray-300 rounded-xl shadow-sm h-full flex flex-col items-center justify-center">
            <Search className="h-10 w-10 text-sky-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-blue-900">No systems found in catalog.</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your keywords or clearing the filters.</p>
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
            {processedApps.map((app) => {
              const isInternal = app.deployment_type?.includes('Internal') || app.deployment_architecture?.includes('On-Prem');
              const DeploymentIcon = isInternal ? HardDrive : Cloud;

              return (
                <div 
                  key={app.id} 
                  onClick={() => setSelectedApp(app)}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#00a9e0] transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isInternal ? 'bg-green-500' : 'bg-[#00a9e0]'}`}></div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 group-hover:bg-blue-900 group-hover:border-blue-800 rounded-lg transition-colors shrink-0">
                      <DeploymentIcon className={`h-5 w-5 ${isInternal ? 'text-green-600' : 'text-sky-500'} group-hover:text-yellow-400 transition-colors`} />
                    </div>
                    <div className="flex flex-col items-end gap-1 overflow-hidden pl-2">
                      <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                        SYS-{app.id}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-gray-500 truncate w-full text-right" title={app.vendor}>
                        {app.vendor}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4 flex-1">
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 group-hover:text-blue-800 transition-colors line-clamp-2">{app.name}</h3>
                    <span className="text-[10px] font-bold text-blue-900 bg-sky-50 border border-sky-100 inline-flex items-center px-2 py-0.5 rounded uppercase tracking-wider">
                      {app.category}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-3 mt-auto">
                    <span className="flex items-center font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      <Users className="h-3 w-3 mr-1.5 text-sky-500" /> 
                      {app.departments ? app.departments.length : 0}
                    </span>
                    <span className={`text-[8px] uppercase font-bold px-2 py-1 rounded border truncate max-w-[100px] ${isInternal ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {app.deployment_type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col space-y-3 pb-8">
            {processedApps.map((app) => {
              const isInternal = app.deployment_type?.includes('Internal') || app.deployment_architecture?.includes('On-Prem');
              const DeploymentIcon = isInternal ? HardDrive : Cloud;

              return (
                <div 
                  key={app.id} 
                  onClick={() => setSelectedApp(app)}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#00a9e0] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 h-full w-1 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ${isInternal ? 'bg-green-500' : 'bg-[#00a9e0]'}`}></div>
                  
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 bg-gray-50 border border-gray-100 group-hover:bg-blue-900 group-hover:border-blue-800 rounded-lg transition-colors shrink-0">
                      <DeploymentIcon className={`h-5 w-5 ${isInternal ? 'text-green-600' : 'text-sky-500'} group-hover:text-yellow-400 transition-colors`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-800 transition-colors">{app.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-200 pr-2">SYS-{app.id}</span>
                        <span className="text-[9px] font-bold text-blue-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wider">{app.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 sm:space-x-8 lg:w-1/2 justify-between">
                    <div className="hidden md:block min-w-[120px]">
                      <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Publisher</p>
                      <p className="text-xs font-bold text-gray-700 flex items-center truncate" title={app.vendor}>
                        <Building2 className="h-3 w-3 mr-1 text-gray-400 shrink-0" /> <span className="truncate">{app.vendor}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-auto sm:ml-0">
                      <span className="flex flex-col items-center">
                        <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Users</span>
                        <span className="flex items-center font-bold text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          <Users className="h-3 w-3 mr-1 text-sky-500" /> {app.departments ? app.departments.length : 0}
                        </span>
                      </span>
                      <span className={`text-[8px] uppercase font-bold px-2 py-1 rounded border h-fit mt-3 w-[100px] text-center truncate ${isInternal ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {app.deployment_type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};