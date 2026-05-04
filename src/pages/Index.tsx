import { useState, useEffect } from "react";
import { CIODashboard } from "@/components/CIODashboard";
import { AppsDashboard } from "@/components/AppsDashboard";
import { PMODashboard } from "@/components/PMODashboard";
import { CRMDashboard } from "@/components/CRMDashboard"; 
import { NetworksDashboard } from "@/components/NetworksDashboard";

import { AdminTab } from "@/components/AdminTab";
import { AppsTab } from "@/components/AppsTab";
import { SubscriptionsTab } from "@/components/SubscriptionsTab";
import { RecommendationsTab } from "@/components/RecommendationsTab";
import { UsersTab } from "@/components/UsersTab";
import { AuditTab } from "@/components/AuditTab";
import { DepartmentDetailTab } from "@/components/DepartmentDetailTab";
import { EAStrategyTab } from "@/components/EAStrategyTab"; 
import { Login } from "@/components/Login";
import Footer from "@/components/Footer"; 
import { Button } from "@/components/ui/button";
import { 
  CreditCard, Lightbulb, Lock, Server, Filter, X, 
  Monitor, ShieldAlert, Shield, LogOut, Download, RefreshCw, 
  LayoutDashboard, Users, ShieldCheck, Settings, Menu, Archive, FileText, Fingerprint
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Index = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('appManagerToken'));
  const [role, setRole] = useState<string>(localStorage.getItem('appManagerRole') || 'StandardUser');
  
  const [userDepartmentId, setUserDepartmentId] = useState<number | null>(
    localStorage.getItem('appManagerDeptId') ? parseInt(localStorage.getItem('appManagerDeptId')!) : null
  );

  const [activeTab, setActiveTab] = useState(role === 'StandardUser' ? 'systems' : 'dashboard');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<any[]>(JSON.parse(localStorage.getItem('ea_saved_reports') || '[]'));

  const [systems, setSystems] = useState<any[]>([]); 
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [duplications, setDuplications] = useState<any[]>([]);
  const [deptSpend, setDeptSpend] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [budget, setBudget] = useState<number>(150000); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [deptDetails, setDeptDetails] = useState<any>(null);

  const [biSystemFilter, setBiSystemFilter] = useState<string>("All");
  const [biUnitFilter, setBiUnitFilter] = useState<string>("All"); 
  const [biDeptFilter, setBiDeptFilter] = useState<string>("All"); 

  const handleLogout = () => {
    localStorage.removeItem('appManagerToken');
    localStorage.removeItem('appManagerRole');
    localStorage.removeItem('appManagerDeptId');
    setToken(null);
    setRole('StandardUser');
    setUserDepartmentId(null);
  };

  const handleLoginSuccess = (newToken: string, newRole: string, deptId?: number) => {
    localStorage.setItem('appManagerToken', newToken);
    localStorage.setItem('appManagerRole', newRole);
    if (deptId) localStorage.setItem('appManagerDeptId', deptId.toString());
    
    setToken(newToken);
    setRole(newRole);
    if (deptId) setUserDepartmentId(deptId);
    
    // Auto-route based on blueprint
    setActiveTab(newRole === 'StandardUser' ? 'systems' : 'dashboard');
  };

  // --- UPDATED ROLE ACCESSIBILITY MATRIX (THE EA BLUEPRINT) ---
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead', 'ApplicationsHead', 'NetworksHead', 'CRMHead'] },
    { id: 'systems', label: 'Enterprise Catalog', icon: Server, roles: ['StandardUser', 'DepartmentHead', 'SuperAdmin', 'EA', 'CIO', 'PMOLead', 'ApplicationsHead', 'NetworksHead', 'CRMHead'] },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead'] },
    { id: 'users', label: 'Identity Matrix', icon: Users, roles: ['SuperAdmin', 'EA', 'DepartmentHead'] },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, roles: ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead', 'ApplicationsHead'] },
    { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck, roles: ['SuperAdmin', 'EA'] }, // Locked to EA only
    { id: 'ea-strategy', label: 'EA Strategy', icon: Fingerprint, roles: ['SuperAdmin', 'EA'] },
    { id: 'admin', label: 'Settings', icon: Settings, roles: ['SuperAdmin'] } // EA DD Apex control
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  // Ensure users can't URL-hack into tabs they don't own
  useEffect(() => {
    if (visibleNavItems.length > 0 && !visibleNavItems.find(item => item.id === activeTab)) {
      setActiveTab(visibleNavItems[0].id);
      setSelectedDeptId(null);
    }
  }, [role, activeTab, visibleNavItems]);

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('appManagerToken');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...options.headers,
    };
    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
  };

  const refreshAllData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMonthlyCost(), 
        fetchSubscriptions(), 
        fetchSystems(), 
        fetchRecommendations(), 
        fetchSettings(), 
        fetchConnectors(), 
        fetchUsers(), 
        fetchAuditData(), 
        fetchTrends()
      ]);
    } catch (error) {
      console.error("Failed to sync engine:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBudget = async (nb: number) => {
    await fetchWithAuth('/api/settings', { method: 'PUT', body: JSON.stringify({ monthly_budget: nb }) });
    setBudget(nb);
  };

  const handleReclaim = async (id: number) => {
    if (role === 'StandardUser') return;
    const res = await fetchWithAuth(`/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) refreshAllData();
  };

  const handleDepartmentClick = async (id: number) => {
    const res = await fetchWithAuth(`/api/departments/${id}/details`);
    if (res.ok) {
      const details = await res.json();
      setDeptDetails(details);
      setSelectedDeptId(id);
    }
  };

  const handleAddConnector = async (connectorData: any) => {
    try {
      await fetchWithAuth('/api/connectors', { method: 'POST', body: JSON.stringify(connectorData) });
      refreshAllData(); 
    } catch (err) {
      console.error("Failed to save connector:", err);
    }
  };

  const fetchTrends = async () => { const res = await fetchWithAuth('/api/metrics/trends'); if (res.ok) setTrends(await res.json()); };
  const fetchAuditData = async () => { 
    // Only attempt to fetch global audit if the user is EA/SuperAdmin
    if (['SuperAdmin', 'EA'].includes(role)) {
      const [dupRes, deptRes] = await Promise.all([fetchWithAuth('/api/audit/duplication'), fetchWithAuth('/api/metrics/departmental-spend')]); 
      if (dupRes.ok) setDuplications(await dupRes.json()); 
      if (deptRes.ok) setDeptSpend(await deptRes.json()); 
    }
  };
  const fetchUsers = async () => { const res = await fetchWithAuth('/api/users'); if (res.ok) setUsers(await res.json()); };
  const fetchConnectors = async () => { const res = await fetchWithAuth('/api/connectors'); if (res.ok) setConnectors(await res.json()); };
  const fetchSettings = async () => { const res = await fetchWithAuth('/api/settings'); if (res.ok) { const d = await res.json(); setBudget(parseFloat(d.monthly_budget)); } };
  const fetchMonthlyCost = async () => { const res = await fetchWithAuth('/api/metrics/monthly-cost'); if (res.ok) { const d = await res.json(); setMonthlyCost(d.total); } };
  const fetchSubscriptions = async () => { const res = await fetchWithAuth('/api/subscriptions'); if (res.ok) setSubscriptions(await res.json()); };
  const fetchSystems = async () => { const res = await fetchWithAuth('/api/systems'); if (res.ok) setSystems(await res.json()); };
  const fetchRecommendations = async () => { const res = await fetchWithAuth('/api/recommendations'); if (res.ok) setRecommendations(await res.json()); };

  useEffect(() => { 
    if(token) refreshAllData(); 
  }, [token]);

  const handleSaveReportToArchive = (filename: string, content: string) => {
    const newReport = { id: Date.now(), filename, date: new Date().toLocaleString(), content };
    const updatedReports = [newReport, ...savedReports].slice(0, 50); 
    setSavedReports(updatedReports);
    localStorage.setItem('ea_saved_reports', JSON.stringify(updatedReports));
  };

  const handleReDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearArchive = () => {
    setSavedReports([]);
    localStorage.removeItem('ea_saved_reports');
  };

  const municipalUnits = ["Information Management Unit (IMU)", "Water & Sanitation Unit", "Metro Police Unit", "Parks & Recreation Unit"];
  const imuDepartments = ["Enterprise Architecture", "Applications/Dev", "Networks", "PMO", "Security", "GIS", "Admin", "Customer Service"];
  
  const getUnitForDept = (deptName: string) => {
    if (!deptName || deptName === 'Unassigned') return "Other";
    if (imuDepartments.includes(deptName)) return "Information Management Unit (IMU)";
    const lower = deptName.toLowerCase();
    if (lower.includes("water") || lower.includes("sanitation")) return "Water & Sanitation Unit";
    if (lower.includes("police")) return "Metro Police Unit";
    if (lower.includes("park") || lower.includes("recreation")) return "Parks & Recreation Unit";
    return "Other";
  };

  const allSystemNames = Array.from(new Set(systems.map(s => s.name))).sort();
  const allDeptNames = Array.from(new Set(users.map(u => u.department).filter(d => d && d !== 'Unassigned'))).sort();

  const availableSystems = allSystemNames.filter(sys => {
    return users.some(u => {
      const matchUnit = biUnitFilter === "All" || getUnitForDept(u.department) === biUnitFilter;
      const matchDept = biDeptFilter === "All" || u.department === biDeptFilter;
      const hasSys = u.assigned_systems?.some((s:any) => s.name === sys);
      return matchUnit && matchDept && hasSys;
    });
  });

  const availableUnits = municipalUnits.filter(unit => {
    return users.some(u => {
      const matchSys = biSystemFilter === "All" || u.assigned_systems?.some((s:any) => s.name === biSystemFilter);
      const matchDept = biDeptFilter === "All" || u.department === biDeptFilter;
      const isUnit = getUnitForDept(u.department) === unit;
      return matchSys && matchDept && isUnit;
    });
  });

  const availableDepts = allDeptNames.filter(dept => {
    return users.some(u => {
      const matchSys = biSystemFilter === "All" || u.assigned_systems?.some((s:any) => s.name === biSystemFilter);
      const matchUnit = biUnitFilter === "All" || getUnitForDept(u.department) === biUnitFilter;
      const isDept = u.department === dept;
      return matchSys && matchUnit && isDept;
    });
  });

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBiSystemFilter(val);
    if (val !== "All") {
      if (biUnitFilter !== "All" && !users.some(u => getUnitForDept(u.department) === biUnitFilter && u.assigned_systems?.some((s:any) => s.name === val))) setBiUnitFilter("All");
      if (biDeptFilter !== "All" && !users.some(u => u.department === biDeptFilter && u.assigned_systems?.some((s:any) => s.name === val))) setBiDeptFilter("All");
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBiUnitFilter(val);
    if (val !== "All") {
      if (biDeptFilter !== "All" && getUnitForDept(biDeptFilter) !== val) setBiDeptFilter("All");
      if (biSystemFilter !== "All" && !users.some(u => getUnitForDept(u.department) === val && u.assigned_systems?.some((s:any) => s.name === biSystemFilter))) setBiSystemFilter("All");
    }
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBiDeptFilter(val);
    if (val !== "All") {
      const parentUnit = getUnitForDept(val);
      if (biUnitFilter !== parentUnit) setBiUnitFilter(parentUnit); 
      if (biSystemFilter !== "All" && !users.some(u => u.department === val && u.assigned_systems?.some((s:any) => s.name === biSystemFilter))) setBiSystemFilter("All");
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (role === 'DepartmentHead' && sub.department_id !== userDepartmentId) return false;
    if (biSystemFilter !== "All" && sub.name !== biSystemFilter) return false;
    if (biUnitFilter !== "All" || biDeptFilter !== "All") {
       const userForSub = users.find(u => u.assigned_systems?.some((s:any) => s.name === sub.name && s.price === sub.price));
       if (userForSub) {
         if (biUnitFilter !== "All" && getUnitForDept(userForSub.department) !== biUnitFilter) return false;
         if (biDeptFilter !== "All" && userForSub.department !== biDeptFilter) return false;
       }
    }
    return true;
  });

  const filteredMonthlyCost = filteredSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.price || 0), 0);
  const filteredRecommendations = biSystemFilter === "All" ? recommendations : recommendations.filter(rec => rec.title.includes(biSystemFilter));
  const percentUsed = budget > 0 ? (filteredMonthlyCost / budget) * 100 : 0;
  const costColor = percentUsed >= 100 ? "text-red-600" : percentUsed >= 80 ? "text-orange-500" : "text-green-600";

  const handleExportData = () => {
    let csvContent = "";
    let filename = "";
    const dateStamp = new Date().toISOString().split('T')[0];

    if (activeTab === 'systems') {
      const headers = ['System ID', 'System Name', 'Category', 'Date Added', 'Deployed Departments'];
      const rows = systems.map(app => [
        app.id, `"${app.name}"`, `"${app.category}"`, app.created_at, `"${app.departments?.join(', ') || 'None'}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      filename = `eThekwini_IT_Catalog_${dateStamp}.csv`;
    } else {
      const headers = ['System Name', 'Category', 'Monthly Cost (ZAR)', 'Assigned Project', 'Status'];
      const rows = filteredSubscriptions.map(sub => [
        `"${sub.name}"`, `"${sub.category}"`, sub.price, `"${sub.project_name || 'Operational (No Project)'}"`, 'Active'
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      filename = `Municipal_SaaS_Audit_${dateStamp}.csv`;
    }

    handleSaveReportToArchive(filename, csvContent);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!token) return <Login onLoginSuccess={handleLoginSuccess} />;

  const UnauthorizedView = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
      <Lock className="h-12 w-12 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
      <p className="text-sm text-gray-500 mt-2">Your current clearance level ({role}) does not permit access to this module.</p>
    </div>
  );

  // --- THE TRAFFIC CONTROLLER ---
  const renderDashboardContent = () => {
    switch (role) {
      case 'SuperAdmin':
      case 'EA':
      case 'CIO':
      case 'DepartmentHead':
        // Department Head safely receives this dashboard because the backend 
        // physically filters their monthlyCost, trends, and subscriptions.
        return (
          <CIODashboard 
            systems={systems}
            subscriptions={filteredSubscriptions}
            monthlyCost={filteredMonthlyCost}
            percentUsed={percentUsed}
            costColor={costColor}
            trends={trends}
            recommendations={filteredRecommendations}
            biSystemFilter={biSystemFilter}
            biUnitFilter={biUnitFilter}
            biDeptFilter={biDeptFilter}
            onSaveReport={handleSaveReportToArchive}
            onNavigateToRecommendations={() => setActiveTab('recommendations')}
          />
        );
      
      case 'ApplicationsHead':
        return <AppsDashboard systems={systems} />;

      case 'PMOLead':
        return <PMODashboard />; 

      case 'CRMHead':
        return <CRMDashboard />;

      case 'NetworksHead':
        return <NetworksDashboard systems={systems} />; 

      case 'StandardUser':
      default:
        // StandardUsers should be auto-routed to 'systems', but this acts as a fallback
        return (
          <div className="animate-in fade-in duration-500 pb-12">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center min-h-[450px] w-full">
              <h3 className="font-semibold text-gray-900 mb-2">Need a new Enterprise System?</h3>
              <p className="text-sm text-gray-500 mb-4">Check the Systems tab to access the CRM Demand Tracker, or request a custom build.</p>
              <Button onClick={() => setActiveTab('systems')} className="px-4 py-2 bg-blue-900 text-yellow-400 font-bold hover:bg-blue-800 transition-colors">
                Access Procurement
              </Button>
            </div>
          </div>
        );
    }
  };

  const renderTabContent = () => {
    if (selectedDeptId && deptDetails) {
      if (role === 'StandardUser') return <UnauthorizedView />;
      return <DepartmentDetailTab details={deptDetails} onBack={() => { setSelectedDeptId(null); setDeptDetails(null); }} />;
    }

    switch (activeTab) {
      case "admin": return role === 'SuperAdmin' ? <AdminTab onRefresh={refreshAllData} onExport={handleExportData} budget={budget} onUpdateBudget={handleUpdateBudget} connectors={connectors} onAddConnector={handleAddConnector} stats={{ totalApps: systems.length, activeSubscriptions: subscriptions.length, recommendations: recommendations.length, monthlyCost }} /> : <UnauthorizedView />;
      case "systems": return <AppsTab apps={systems} onAddApp={refreshAllData} />; 
      case "subscriptions": return ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead'].includes(role) ? <SubscriptionsTab subscriptions={subscriptions} onAddSubscription={refreshAllData} /> : <UnauthorizedView />;
      case "audit": return ['SuperAdmin', 'EA'].includes(role) ? 
        <AuditTab 
            duplications={duplications} 
            deptSpend={deptSpend} 
            onDepartmentClick={handleDepartmentClick} 
            systems={systems} 
        /> : <UnauthorizedView />;
      case "recommendations": return ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead', 'ApplicationsHead'].includes(role) ? 
        <RecommendationsTab 
            recommendations={recommendations} 
            onReclaim={handleReclaim} 
            onInvestigate={(sysName) => {
                setActiveTab('users');
                setBiSystemFilter(sysName);
                setBiUnitFilter('All');
                setBiDeptFilter('All');
            }}
        /> : <UnauthorizedView />;
      case "users": return ['SuperAdmin', 'EA', 'DepartmentHead'].includes(role) ? <UsersTab users={users} onRefresh={refreshAllData} /> : <UnauthorizedView />;
      case "ea-strategy": return ['SuperAdmin', 'EA'].includes(role) ? <EAStrategyTab /> : <UnauthorizedView />;
      default: return renderDashboardContent();
    }
  };

  const renderTripleTierFilters = () => (
    <div className="hidden lg:flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-3 text-gray-500 border-r border-gray-200 flex items-center bg-gray-50 rounded-l-lg h-9">
        <Filter className="h-4 w-4" />
      </div>
      
      <select 
        className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer border-r border-gray-200 px-3 h-9 hover:bg-gray-50 transition-colors max-w-[200px]" 
        value={biSystemFilter} 
        onChange={handleSystemChange}
      >
        <option value="All">All Systems</option>
        {availableSystems.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
      </select>

      <select 
        className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer border-r border-gray-200 px-3 h-9 hover:bg-gray-50 transition-colors max-w-[200px]" 
        value={biUnitFilter} 
        onChange={handleUnitChange}
      >
        <option value="All">All Units</option>
        {availableUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
      </select>

      <select 
        className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer px-3 h-9 hover:bg-gray-50 transition-colors rounded-r-lg max-w-[200px]" 
        value={biDeptFilter} 
        onChange={handleDeptChange}
      >
        <option value="All">All Departments</option>
        {availableDepts.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
      </select>
    </div>
  );

  if (isLiveMode) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <div className="bg-blue-900 border-b border-blue-800 p-4 flex justify-between items-center shadow-md shrink-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-400 rounded-lg animate-pulse shadow-sm">
              <Monitor className="h-5 w-5 text-blue-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Presentation Mode</h1>
              <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">Live Data Feed</p>
            </div>
          </div>
          
          {['SuperAdmin', 'DepartmentHead', 'EA'].includes(role) && (
            <div className="flex items-center ml-8">
              {renderTripleTierFilters()}
            </div>
          )}

          <button onClick={() => setIsLiveMode(false)} className="flex items-center px-4 py-2 bg-white/10 text-white rounded-md text-sm font-medium hover:bg-white/20 transition-colors border border-white/20 shadow-sm ml-auto">
            <X className="h-4 w-4 mr-2" /> Exit
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[1600px] mx-auto pb-4">
            {renderDashboardContent()}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-gray-50">
      
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-900 to-blue-800 border-r border-blue-950 flex flex-col shrink-0 shadow-sm z-20 transition-all duration-300 ease-in-out relative`}>
        
        <div className="h-20 flex items-center justify-center px-4 border-b border-blue-800 bg-sky-700 shrink-0">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 w-full'}`}>
            <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Monitor className="h-5 w-5 text-blue-900" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-xl font-bold text-white tracking-tight">SAM</h1>
                <p className="text-[9px] text-yellow-300 uppercase tracking-widest font-bold mt-0.5">Enterprise System</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar overflow-x-hidden">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSelectedDeptId(null); }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                  ? 'bg-blue-950 text-yellow-400 font-bold border-l-4 border-yellow-400 rounded-l-none' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-yellow-400' : 'text-blue-300'}`} />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800 bg-blue-900/50 shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex items-center space-x-2 bg-blue-950 px-3 py-2 rounded-lg shadow-sm mb-3 whitespace-nowrap overflow-hidden border border-blue-800">
              {role === 'SuperAdmin' ? <ShieldAlert className="h-4 w-4 text-yellow-400 shrink-0" /> : <Shield className="h-4 w-4 text-yellow-400 shrink-0" />}
              <div className="truncate">
                <p className="text-xs font-medium text-blue-200 truncate">Logged In</p>
                <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{role}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center shadow-sm border border-blue-800">
                <ShieldAlert className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
          )}
          <Button onClick={handleLogout} variant="outline" className={`w-full bg-blue-950 border-blue-800 text-blue-200 hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors shadow-sm ${isSidebarCollapsed ? 'px-0 justify-center' : ''}`} title={isSidebarCollapsed ? "Logout" : undefined}>
            <LogOut className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} /> 
            {!isSidebarCollapsed && "Logout"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 relative z-0">
        
        <header className="h-20 bg-blue-900 border-b border-blue-800 px-8 flex items-center justify-between shrink-0 shadow-md z-10">
          <div className="flex items-center space-x-4 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="text-blue-200 hover:bg-blue-800 hover:text-white rounded-full h-9 w-9 shrink-0 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {activeTab !== 'dashboard' && (
              <h2 className="text-lg font-bold text-white capitalize tracking-tight min-w-max ml-2">
                {activeTab === 'users' ? 'Identity Matrix' : activeTab.replace('-', ' ')}
              </h2>
            )}
            
            {activeTab === 'dashboard' && ['SuperAdmin', 'DepartmentHead', 'EA'].includes(role) && (
              <div className="ml-2">
                {renderTripleTierFilters()}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2">
                {activeTab === 'dashboard' && (
                  <Button 
                    onClick={() => setIsLiveMode(true)} 
                    className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold shadow-sm h-9 px-4 mr-2"
                  >
                    <Monitor className="h-4 w-4 mr-2" /> Live Dashboard
                  </Button>
                )}

                <Button 
                  onClick={() => setIsArchiveOpen(true)} 
                  variant="outline" 
                  size="icon" 
                  className="bg-blue-800 border-blue-700 text-blue-100 hover:bg-blue-700 hover:text-white shadow-sm h-9 w-9 relative transition-colors" 
                  title="Report Archive"
                >
                  <Archive className="h-4 w-4" />
                  {savedReports.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {savedReports.length}
                    </span>
                  )}
                </Button>

                <Button onClick={handleExportData} variant="outline" size="icon" className="bg-blue-800 border-blue-700 text-blue-100 hover:text-white hover:bg-blue-700 shadow-sm h-9 w-9 transition-colors" title="Export Current View">
                    <Download className="h-4 w-4" />
                </Button>
                
                <Button onClick={refreshAllData} disabled={isLoading} variant="outline" size="icon" className="bg-blue-800 border-blue-700 text-blue-100 hover:text-white hover:bg-blue-700 shadow-sm h-9 w-9 disabled:opacity-50 transition-colors" title="Refresh Engine">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-yellow-400' : ''}`} />
                </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-0">
          {renderTabContent()}
        </div>
        
        <Footer />
        
      </main>

      {isArchiveOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-900">
              <div className="flex items-center text-white">
                <Archive className="h-5 w-5 mr-2 text-yellow-400" />
                <h2 className="text-lg font-bold">Generated Reports Archive</h2>
              </div>
              <button onClick={() => setIsArchiveOpen(false)} className="text-blue-200 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50 custom-scrollbar">
              {savedReports.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <FileText className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium text-gray-500">No reports have been generated yet.</p>
                  <p className="text-xs mt-1 text-gray-400">Click the export buttons on the dashboard to archive them here.</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {savedReports.map(report => (
                    <div key={report.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-200 transition-colors group">
                      <div className="flex items-start">
                        <FileText className="h-8 w-8 text-yellow-100 fill-yellow-400 mr-3 shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-blue-900 truncate max-w-[300px] sm:max-w-md">{report.filename}</p>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mt-1">{report.date}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleReDownload(report.filename, report.content)} 
                        variant="outline" 
                        size="sm"
                        className="bg-white text-blue-900 hover:bg-blue-50 hover:border-blue-200 border-gray-200 shadow-sm shrink-0 font-bold"
                      >
                        <Download className="h-3.5 w-3.5 sm:mr-2 text-blue-600" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {savedReports.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-end">
                <Button onClick={handleClearArchive} variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold">
                  Clear History
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;