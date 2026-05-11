import React, { useState, useEffect } from 'react';
import { 
  Server, Plus, ArrowLeft, ShieldAlert, CheckCircle2, Users, Filter, X, 
  Search, Building2, Cloud, HardDrive, AlertTriangle, Activity, Fingerprint, 
  Clock, XCircle, ChevronDown, Key, Laptop, Inbox, CheckSquare, Loader2,
  LayoutGrid, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppsTabProps {
  apps: any[];
  onAddApp: () => void;
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Role & Identity State
  const [userRole, setUserRole] = useState(localStorage.getItem('appManagerRole') || 'StandardUser');
  const canManageCatalog = ['SuperAdmin', 'EA', 'CIO'].includes(userRole);
  const isManager = ['SuperAdmin', 'EA', 'DepartmentHead', 'CRMHead'].includes(userRole);

  // Add Form States
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [newVendor, setNewVendor] = useState('');
  const [newDeployment, setNewDeployment] = useState('External SaaS');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<number | null>(null);
  
  // Filter & View States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeAlphaFilter, setActiveAlphaFilter] = useState<string>('All');
  const [activeDeploymentFilter, setActiveDeploymentFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // --- WORKSPACE STATES ---
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myEntitlements, setMyEntitlements] = useState<any[]>([]);
  const [actionQueue, setActionQueue] = useState<any[]>([]); // For Managers
  const [isRequesting, setIsRequesting] = useState<number | null>(null);
  // Default to false. Will auto-open if data exists.
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false); 

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // --- FETCH CONTEXTUAL WORKSPACE DATA ---
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const token = localStorage.getItem('appManagerToken');
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        if (!isManager) {
          // 1. STANDARD STAFF: Fetch Personal CRM Requests
          let staffReqs = [];
          let staffEnts = [];

          const reqRes = await fetch(`${API_URL}/api/requests/me`, { headers });
          if (reqRes.ok) {
            staffReqs = await reqRes.json();
            setMyRequests(staffReqs);
          }

          // Fetch Personal Entitlements
          let myId = null;
          try { myId = JSON.parse(atob(token.split('.')[1])).id; } catch (e) {}

          if (myId) {
            const usrRes = await fetch(`${API_URL}/api/users`, { headers });
            if (usrRes.ok) {
              const usersData = await usrRes.json();
              const me = usersData.find((u: any) => u.id === myId);
              if (me) {
                try {
                  staffEnts = Array.isArray(me.assigned_systems) 
                    ? me.assigned_systems 
                    : (typeof me.assigned_systems === 'string' ? JSON.parse(me.assigned_systems) : []);
                } catch (e) {}
                setMyEntitlements(staffEnts);
              }
            }
          }
          
          // UX Feature: Auto-open if staff has active licenses or pending requests
          if (staffReqs.length > 0 || staffEnts.length > 0) {
            setIsWorkspaceOpen(true);
          }

        } else {
          // 2. MANAGERS / EA: Fetch the Action Queue
          const qRes = await fetch(`${API_URL}/api/requests`, { headers });
          if (qRes.ok) {
            const allRequests = await qRes.json();
            const pendingQueue = allRequests.filter((r: any) => r.status === 'Pending' || r.status === 'Awaiting EA Vetting');
            setActionQueue(pendingQueue);
            
            // UX Feature: Auto-open ONLY if there are items needing approval
            if (pendingQueue.length > 0) {
              setIsWorkspaceOpen(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      }
    };

    fetchWorkspaceData();
  }, [isManager]);

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
        setSuccessMsg("Request submitted successfully to your Department Head!");
        setIsWorkspaceOpen(true); // Auto-open to show the new request
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error("Request failed:", err);
    } finally {
      setIsRequesting(null);
    }
  };

  // --- HANDLE MANAGER/EA VETTING ACTION ---
  const handleVettingAction = async (requestId: number, status: 'Approved' | 'Vetoed') => {
    setIsProcessingId(requestId);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests/${requestId}/vetting`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alignment_score: status === 'Approved' ? 95 : 15,
          ea_status: status,
          ea_comments: status === 'Approved' ? 'Fast-tracked and Approved via Workspace Inbox.' : 'Vetoed by Department Head / EA.'
        })
      });

      if (res.ok) {
        setActionQueue(prev => {
          const newQueue = prev.filter(req => req.id !== requestId);
          // Auto-close if we just cleared the last item
          if (newQueue.length === 0) setIsWorkspaceOpen(false);
          return newQueue;
        });
      } else {
        const data = await res.json();
        alert(data.error || "You do not have permission to vet this request.");
      }
    } catch (err) {
      console.error("Vetting error:", err);
    } finally {
      setIsProcessingId(null);
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
          deployment_type: newDeployment,
          deployment_architecture: newDeployment.includes('SaaS') ? 'Cloud' : 'On-Premise'
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

  // --- HELPER FUNCTIONS ---
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
    const isAlreadyAssigned = myEntitlements.some((ent: any) => ent.name === selectedApp.name);
    const hasPendingRequest = myRequests.some((req: any) => req.system_name === selectedApp.name && req.status !== 'Rejected');
    
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
        <button 
          onClick={() => setSelectedApp(null)}
          className="flex items-center text-sm font-bold text-blue-800 hover:text-blue-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to IT Catalog
        </button>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center font-bold shadow-sm animate-in zoom-in-95">
            <CheckCircle2 className="h-5 w-5 mr-2" /> {successMsg}
          </div>
        )}

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
              
              {/* SMART REQUEST BUTTON */}
              {!isManager && (
                isAlreadyAssigned ? (
                  <Button disabled className="bg-green-100 text-green-700 font-bold border border-green-200 opacity-100 cursor-not-allowed">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Active License Held
                  </Button>
                ) : hasPendingRequest ? (
                  <Button disabled className="bg-yellow-100 text-yellow-700 font-bold border border-yellow-200 opacity-100 cursor-not-allowed">
                    <Clock className="h-4 w-4 mr-2" /> Request Pending
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleRequestLicense(selectedApp.id)}
                    disabled={isRequesting === selectedApp.id}
                    className="bg-[#00a9e0] hover:bg-[#008bc6] text-white font-bold shadow-md transition-transform active:scale-95"
                  >
                    {isRequesting === selectedApp.id ? 'Submitting...' : 'Request License'}
                  </Button>
                )
              )}
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
      
      {/* 1. CONTEXTUAL DIGITAL WORKSPACE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          className={`w-full flex items-center justify-between p-4 transition-colors ${isWorkspaceOpen ? 'bg-gray-50 border-b border-gray-100' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="flex items-center">
            {isManager ? <Inbox className="h-5 w-5 mr-2 text-orange-500" /> : <Laptop className="h-5 w-5 mr-2 text-[#00a9e0]" />}
            <h2 className="text-lg font-black text-blue-900 tracking-tight">
              {isManager ? 'Action Required: Pending Requests' : 'My Digital Workspace'}
            </h2>
            {isManager && actionQueue.length > 0 && (
              <span className="ml-3 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">
                {actionQueue.length} Pending
              </span>
            )}
            {!isManager && myRequests.length > 0 && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {myRequests.length} Active Request(s)
              </span>
            )}
          </div>
          <div className="flex items-center">
            {!isWorkspaceOpen && <span className="text-xs font-bold text-gray-400 mr-3 hidden sm:inline-block"></span>}
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isWorkspaceOpen && (
          <div className="p-6 bg-white animate-in slide-in-from-top-2 duration-300">
            
            {/* VIEW A: MANAGER ACTION INBOX */}
            {isManager ? (
              <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-5">
                {actionQueue.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-gray-100">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 text-green-200" />
                    <p className="text-xs font-bold text-gray-500">Inbox Zero</p>
                    <p className="text-[10px] mt-1">No staff requests require your attention.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {actionQueue.map((req) => (
                      <div key={req.id} className="p-4 border border-orange-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-blue-900 text-sm truncate max-w-[150px]">{req.system}</h3>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">Requester: <span className="text-gray-800">{req.requester}</span></p>
                          </div>
                          <Clock className="h-4 w-4 text-orange-400 shrink-0" />
                        </div>
                        
                        <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                          <Button 
                            onClick={() => handleVettingAction(req.id, 'Approved')}
                            disabled={isProcessingId === req.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8 font-bold shadow-sm"
                          >
                            {isProcessingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve</>}
                          </Button>
                          <Button 
                            onClick={() => handleVettingAction(req.id, 'Vetoed')}
                            disabled={isProcessingId === req.id}
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 font-bold"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Veto
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            ) : (

            /* VIEW B: STAFF PERSONAL WORKSPACE */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Active Entitlements Panel */}
              <div className="border border-sky-100 bg-sky-50/30 rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center">
                  <Key className="h-4 w-4 mr-2 text-sky-500" /> Active Entitlements ({myEntitlements.length})
                </h3>
                {myEntitlements.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-gray-100 shadow-inner">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No active licenses assigned.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myEntitlements.map((sys: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-sky-100 shadow-sm">
                        <span className="font-bold text-sm text-gray-800">{sys.name}</span>
                        <span className="flex items-center text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> ACTIVE
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Requests Panel */}
              <div className="border border-gray-200 bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-500" /> Procurement Pipeline ({myRequests.length})
                </h3>
                {myRequests.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-gray-100 shadow-inner">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No pending requests.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map((req) => (
                      <div key={req.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{req.system_name}</h4>
                          <div className="flex items-center mt-1">
                            <Fingerprint className="h-3 w-3 mr-1 text-gray-400"/>
                            <span className={`text-[10px] font-bold ${req.alignment_score > 70 ? 'text-green-600' : req.alignment_score > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {req.alignment_score > 0 ? `EA Score: ${req.alignment_score}%` : 'Awaiting Vetting'}
                            </span>
                          </div>
                        </div>
                        <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded border uppercase ${getStatusBadgeClass(req.ea_status)}`}>
                          {getStatusIcon(req.ea_status)} <span className="ml-1">{req.ea_status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* 2. CATALOG HEADER & ADD FORM */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 pb-2">
          <div>
            <h2 className="text-lg font-black text-blue-900 flex items-center tracking-tight">
              <Server className="h-5 w-5 mr-2 text-blue-800" />
              Enterprise IT Catalog
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Browse approved systems for eThekwini Municipality to request access.</p>
          </div>
          
          {canManageCatalog && (
            <Button 
              onClick={() => setIsAdding(!isAdding)} 
              className={`${isAdding ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-900 hover:bg-blue-800 text-yellow-400'} font-bold shadow-sm transition-colors`}
            >
              {isAdding ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> Register System</>}
            </Button>
          )}
        </div>

        {isAdding && canManageCatalog && (
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

        {/* 3. PACKAGED COMMAND TOOLBAR (Now with Layout Toggle) */}
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
            
            {/* VIEW TOGGLE */}
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

        {/* 4. DYNAMIC CATALOG RENDERING (Grid or List) */}
        {processedApps.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-gray-300 rounded-xl shadow-sm">
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
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {processedApps.map((app) => {
              const isInternal = app.deployment_type === 'Internal Build';
              const DeploymentIcon = isInternal ? HardDrive : Cloud;

              return (
                <div 
                  key={app.id} 
                  onClick={() => setSelectedApp(app)}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#00a9e0] transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isInternal ? 'bg-green-500' : 'bg-[#00a9e0]'}`}></div>

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
          </div>
        ) : (
          /* LIST VIEW */
          <div className="flex flex-col space-y-3">
            {processedApps.map((app) => {
              const isInternal = app.deployment_type === 'Internal Build';
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
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 pr-2">SYS-{app.id}</span>
                        <span className="text-[10px] font-bold text-blue-900 bg-sky-50 px-2 rounded-full uppercase tracking-wider">{app.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 sm:space-x-8 lg:w-1/2 justify-between">
                    <div className="hidden md:block">
                      <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Publisher</p>
                      <p className="text-xs font-bold text-gray-700 flex items-center">
                        <Building2 className="h-3 w-3 mr-1 text-gray-400" /> {app.vendor}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-auto sm:ml-0">
                      <span className="flex flex-col items-center">
                        <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Users</span>
                        <span className="flex items-center font-bold text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          <Users className="h-3 w-3 mr-1 text-sky-500" /> {app.departments ? app.departments.length : 0}
                        </span>
                      </span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded-md border h-fit mt-3 ${isInternal ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {isInternal ? 'Internal' : 'External'}
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