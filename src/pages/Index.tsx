import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { WeeklyUsageChart } from "@/components/WeeklyUsageChart";
import { CategoryUsageChart } from "@/components/CategoryUsageChart";
import { AdminTab } from "@/components/AdminTab";
import { AppsTab } from "@/components/AppsTab";
import { SubscriptionsTab } from "@/components/SubscriptionsTab";
import { RecommendationsTab } from "@/components/RecommendationsTab";
import { UsersTab } from "@/components/UsersTab";
import { AuditTab } from "@/components/AuditTab";
import { DepartmentDetailTab } from "@/components/DepartmentDetailTab";
import { Login } from "@/components/Login";
import Footer from "@/components/Footer"; 
import { Button } from "@/components/ui/button";
import { 
  CreditCard, DollarSign, Lightbulb, TrendingUp, TrendingDown, Lock, Server, Filter, X, 
  Monitor, ShieldAlert, Shield, User, LogOut, Download, RefreshCw, LayoutDashboard, Users, ShieldCheck, Settings
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Index = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('appManagerToken'));
  const [role, setRole] = useState<string>(localStorage.getItem('appManagerRole') || 'StandardUser');

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  
  const [systems, setSystems] = useState<any[]>([]); 
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [duplications, setDuplications] = useState<any[]>([]);
  const [deptSpend, setDeptSpend] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [budget, setBudget] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [deptDetails, setDeptDetails] = useState<any>(null);

  // --- THE TRIPLE-TIER BI FILTERS ---
  const [biSystemFilter, setBiSystemFilter] = useState<string>("All");
  const [biUnitFilter, setBiUnitFilter] = useState<string>("All"); 
  const [biDeptFilter, setBiDeptFilter] = useState<string>("All"); 

  const handleLogout = () => {
    localStorage.removeItem('appManagerToken');
    localStorage.removeItem('appManagerRole');
    setToken(null);
    setRole('StandardUser');
  };

  const handleLoginSuccess = (newToken: string, newRole: string) => {
    localStorage.setItem('appManagerToken', newToken);
    localStorage.setItem('appManagerRole', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  useEffect(() => {
    if (role === 'StandardUser' && !['dashboard', 'systems'].includes(activeTab)) {
      setActiveTab('dashboard');
      setSelectedDeptId(null);
    }
    if (role === 'DepartmentHead' && activeTab === 'admin') {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  const refreshAllData = async () => {
    if (!token) return;
    setIsLoading(true);
    await Promise.all([fetchMonthlyCost(), fetchSubscriptions(), fetchSystems(), fetchRecommendations(), fetchSettings(), fetchConnectors(), fetchUsers(), fetchAuditData(), fetchTrends()]);
    setIsLoading(false);
  };

  const handleUpdateBudget = async (nb: number) => {
    await fetch(`${API_URL}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monthly_budget: nb }) });
    setBudget(nb);
  };

  const handleReclaim = async (id: number) => {
    if (role === 'StandardUser') return;
    const res = await fetch(`${API_URL}/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) refreshAllData();
  };

  const handleDepartmentClick = async (id: number) => {
    const res = await fetch(`${API_URL}/api/departments/${id}/details`);
    if (res.ok) {
      setDeptDetails(await res.json());
      setSelectedDeptId(id);
    }
  };

  const fetchTrends = async () => { const res = await fetch(`${API_URL}/api/metrics/trends`); if (res.ok) setTrends(await res.json()); };
  const fetchAuditData = async () => { const [dupRes, deptRes] = await Promise.all([fetch(`${API_URL}/api/audit/duplication`), fetch(`${API_URL}/api/metrics/departmental-spend`)]); if (dupRes.ok) setDuplications(await dupRes.json()); if (deptRes.ok) setDeptSpend(await deptRes.json()); };
  const fetchUsers = async () => { const res = await fetch(`${API_URL}/api/users`); if (res.ok) setUsers(await res.json()); };
  const fetchConnectors = async () => { const res = await fetch(`${API_URL}/api/connectors`); if (res.ok) setConnectors(await res.json()); };
  const fetchSettings = async () => { const res = await fetch(`${API_URL}/api/settings`); if (res.ok) { const d = await res.json(); setBudget(parseFloat(d.monthly_budget)); } };
  const fetchMonthlyCost = async () => { const res = await fetch(`${API_URL}/api/metrics/monthly-cost`); if (res.ok) { const d = await res.json(); setMonthlyCost(d.total); } };
  const fetchSubscriptions = async () => { const res = await fetch(`${API_URL}/api/subscriptions`); if (res.ok) setSubscriptions(await res.json()); };
  const fetchSystems = async () => { const res = await fetch(`${API_URL}/api/systems`); if (res.ok) setSystems(await res.json()); };
  const fetchRecommendations = async () => { const res = await fetch(`${API_URL}/api/recommendations`); if (res.ok) setRecommendations(await res.json()); };

  useEffect(() => { 
    if(token) refreshAllData(); 
  }, [token]);

  // ==========================================
  // ⚡ SMART CASCADING FILTER ENGINE
  // ==========================================
  
  const allSystemNames = Array.from(new Set(systems.map(s => s.name)));
  const allDeptNames = Array.from(new Set([...users.map(u => u.department).filter(d => d !== 'Unassigned'), "Enterprise Architecture (EA)"]));
  
  const municipalUnits = ["Information Management Unit (IMU)", "Water & Sanitation Unit", "Metro Police Unit", "Parks & Recreation Unit"];
  
  // Maps a department to its parent Unit
  const getUnitForDept = (deptName: string) => {
    if (!deptName) return "Other";
    const lower = deptName.toLowerCase();
    if (lower.includes("it") || lower.includes("architecture")) return "Information Management Unit (IMU)";
    if (lower.includes("water") || lower.includes("sanitation")) return "Water & Sanitation Unit";
    if (lower.includes("police")) return "Metro Police Unit";
    if (lower.includes("park") || lower.includes("recreation")) return "Parks & Recreation Unit";
    return "Other";
  };

  // 1. Calculate Available Units based on System Selection
  const availableUnits = municipalUnits.filter(unit => {
    if (biSystemFilter === "All") return true;
    const sys = systems.find(s => s.name === biSystemFilter);
    const deptsUsingSys = sys?.departments || [];
    const validUnitsForSys = new Set(deptsUsingSys.map(getUnitForDept));
    return validUnitsForSys.has(unit);
  });

  // 2. Calculate Available Departments based on System AND Unit Selection
  const availableDepts = allDeptNames.filter(dept => {
    // Filter by System
    if (biSystemFilter !== "All") {
      const sys = systems.find(s => s.name === biSystemFilter);
      const deptsUsingSys = sys?.departments || [];
      if (!deptsUsingSys.includes(dept)) return false;
    }
    // Filter by Unit
    if (biUnitFilter !== "All") {
      if (getUnitForDept(dept) !== biUnitFilter) return false;
    }
    return true;
  });

  // 3. Cascade Reset Handlers
  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBiSystemFilter(e.target.value);
    setBiUnitFilter("All"); // Reset children
    setBiDeptFilter("All");
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBiUnitFilter(e.target.value);
    setBiDeptFilter("All"); // Reset child
  };

  // ==========================================

  const filteredSubscriptions = subscriptions.filter(sub => biSystemFilter === "All" || sub.name === biSystemFilter);
  const filteredMonthlyCost = biSystemFilter === "All" ? monthlyCost : filteredSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.price || 0), 0);
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
        app.id,
        `"${app.name}"`, 
        `"${app.category}"`, 
        app.created_at, 
        `"${app.departments?.join(', ') || 'None'}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      filename = `eThekwini_IT_Catalog_${dateStamp}.csv`;
    } else {
      const headers = ['System Name', 'Category', 'Monthly Cost (ZAR)', 'Assigned Project', 'Status'];
      const rows = filteredSubscriptions.map(sub => [
        `"${sub.name}"`, 
        `"${sub.category}"`, 
        sub.price, 
        `"${sub.project_name || 'Operational (No Project)'}"`, 
        'Active'
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      filename = `Municipal_SaaS_Audit_${dateStamp}.csv`;
    }

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
      <h2 className="text-xl font-semibold text-metric-value">Access Denied</h2>
      <p className="text-sm text-metric-label mt-2">Your current clearance level ({role}) does not permit access to this module.</p>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['StandardUser', 'DepartmentHead', 'SuperAdmin'] },
    { id: 'systems', label: 'Enterprise Systems', icon: Server, roles: ['StandardUser', 'DepartmentHead', 'SuperAdmin'] },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['DepartmentHead', 'SuperAdmin'] },
    { id: 'users', label: 'Users & IAM', icon: Users, roles: ['DepartmentHead', 'SuperAdmin'] },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, roles: ['DepartmentHead', 'SuperAdmin'] },
    { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck, roles: ['DepartmentHead', 'SuperAdmin'] },
    { id: 'admin', label: 'Settings', icon: Settings, roles: ['SuperAdmin'] }
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  const renderDashboardContent = () => (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard icon={<Server className="h-5 w-5" />} title={role === 'StandardUser' ? "Approved Systems" : "Filtered Systems"} value={biSystemFilter === "All" ? systems.length.toString() : "1"} subtitle={role === 'StandardUser' ? "Available in IT Catalog" : biSystemFilter === "All" ? "Org-wide Deployments" : `Isolated View`} />
        <MetricCard icon={<CreditCard className="h-5 w-5" />} title={role === 'StandardUser' ? "My Active Tools" : "Active Licenses"} value={role === 'StandardUser' ? "2" : filteredSubscriptions.length.toString()} subtitle={role === 'StandardUser' ? "Assigned to your account" : biSystemFilter === "All" ? "Procured seats" : `Seats for ${biSystemFilter}`} />
        {role !== 'StandardUser' && (
          <>
            <MetricCard icon={<DollarSign className="h-5 w-5" />} title={biSystemFilter === "All" ? "Total Burn" : "System Burn"} value={`ZAR ${filteredMonthlyCost.toFixed(2)}`} subtitle={<div className="flex items-center space-x-2"><span className={costColor}>{biSystemFilter === "All" ? `${percentUsed.toFixed(0)}% of budget` : 'Direct Cost'}</span>{biSystemFilter === "All" && trends && (<span className={`flex items-center text-[10px] font-bold ${parseFloat(trends.momChange) > 0 ? 'text-red-500' : 'text-green-500'}`}>{parseFloat(trends.momChange) > 0 ? <TrendingUp className="h-2 w-2 mr-0.5"/> : <TrendingDown className="h-2 w-2 mr-0.5"/>}{Math.abs(trends.momChange)}%</span>)}</div>} />
            <MetricCard icon={<Lightbulb className="h-5 w-5" />} title="Saving Ops" value={filteredRecommendations.length.toString()} subtitle={biSystemFilter === "All" ? "Optimization identified" : `Flags for ${biSystemFilter}`} />
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12 items-start">
        <WeeklyUsageChart systemFilter={biSystemFilter} deptFilter={biDeptFilter} />
        {role !== 'StandardUser' ? (
           <CategoryUsageChart systemFilter={biSystemFilter} deptFilter={biDeptFilter} />
        ) : (
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm flex flex-col justify-center items-center text-center">
            <h3 className="font-semibold text-metric-value mb-2">Need a new Enterprise System?</h3>
            <p className="text-sm text-metric-label mb-4">Check the Systems tab for approved software, or contact PMO to request a new license.</p>
            <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">Request Procurement</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (selectedDeptId && deptDetails) {
      if (role === 'StandardUser') return <UnauthorizedView />;
      return <DepartmentDetailTab details={deptDetails} onBack={() => { setSelectedDeptId(null); setDeptDetails(null); }} />;
    }

    switch (activeTab) {
      case "admin": return role === 'SuperAdmin' ? <AdminTab onRefresh={refreshAllData} onExport={handleExportData} budget={budget} onUpdateBudget={handleUpdateBudget} connectors={connectors} onAddConnector={async () => {}} stats={{ totalApps: systems.length, activeSubscriptions: subscriptions.length, recommendations: recommendations.length, monthlyCost }} /> : <UnauthorizedView />;
      case "systems": return <AppsTab apps={systems} onAddApp={refreshAllData} />; 
      case "subscriptions": return ['SuperAdmin', 'DepartmentHead'].includes(role) ? <SubscriptionsTab subscriptions={subscriptions} onAddSubscription={refreshAllData} /> : <UnauthorizedView />;
      case "users": return ['SuperAdmin', 'DepartmentHead'].includes(role) ? <UsersTab users={users} onRefresh={refreshAllData} /> : <UnauthorizedView />;
      case "recommendations": return ['SuperAdmin', 'DepartmentHead'].includes(role) ? <RecommendationsTab recommendations={recommendations} onReclaim={handleReclaim} /> : <UnauthorizedView />;
      case "audit": return ['SuperAdmin', 'DepartmentHead'].includes(role) ? <AuditTab duplications={duplications} deptSpend={deptSpend} onDepartmentClick={handleDepartmentClick} /> : <UnauthorizedView />;
      default: return renderDashboardContent();
    }
  };

  // --- TRIPLE TIER SMART SLICERS UI ---
  const renderTripleTierFilters = () => (
    <div className="hidden lg:flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-3 text-gray-400 border-r border-gray-100 flex items-center bg-gray-50/50 rounded-l-lg h-9">
        <Filter className="h-4 w-4" />
      </div>
      
      {/* 1. Systems Slicer (Parent) */}
      <select 
        className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-r border-gray-100 px-3 h-9 hover:bg-gray-50 transition-colors max-w-[200px]" 
        value={biSystemFilter} 
        onChange={handleSystemChange}
      >
        <option value="All">All Systems</option>
        {allSystemNames.map(name => <option key={name} value={name}>{name}</option>)}
      </select>

      {/* 2. Units Slicer (Child) */}
      <select 
        className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-r border-gray-100 px-3 h-9 hover:bg-gray-50 transition-colors max-w-[200px]" 
        value={biUnitFilter} 
        onChange={handleUnitChange}
      >
        <option value="All">All Units</option>
        {availableUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
      </select>

      {/* 3. Departments Slicer (Grandchild) */}
      <select 
        className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer px-3 h-9 hover:bg-gray-50 transition-colors rounded-r-lg max-w-[200px]" 
        value={biDeptFilter} 
        onChange={(e) => setBiDeptFilter(e.target.value)}
      >
        <option value="All">All Departments</option>
        {availableDepts.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
  );

  if (isLiveMode) {
    return (
      <div className="min-h-screen bg-dashboard-bg overflow-y-auto custom-scrollbar">
        <div className="bg-white border-b border-border p-4 flex justify-between items-center mb-6 shadow-sm sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success rounded-lg animate-pulse">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-metric-value leading-tight">Executive Presentation Mode</h1>
              <p className="text-[10px] text-metric-label uppercase tracking-wider font-semibold">Live Data Feed</p>
            </div>
          </div>
          
          {role !== 'StandardUser' && (
            <div className="flex items-center ml-8">
              {renderTripleTierFilters()}
            </div>
          )}

          <button onClick={() => setIsLiveMode(false)} className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors border border-red-100 shadow-sm ml-auto">
            <X className="h-4 w-4 mr-2" /> Exit
          </button>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 pb-8">
          {renderDashboardContent()}
          <div className="mt-8">
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dashboard-bg overflow-hidden">
      
      <aside className="w-64 bg-white border-r border-border flex flex-col shrink-0 shadow-sm z-10">
        <div className="h-20 flex items-center px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Smart Analytics</h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">OS Analytics Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSelectedDeptId(null); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-gray-50/50">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm mb-3">
            {role === 'SuperAdmin' ? <ShieldAlert className="h-4 w-4 text-green-600 shrink-0" /> : 
             role === 'DepartmentHead' ? <Shield className="h-4 w-4 text-green-600 shrink-0" /> : 
             <User className="h-4 w-4 text-green-600 shrink-0" />}
            <div className="truncate">
              <p className="text-xs font-bold text-gray-900 truncate">Logged In</p>
              <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider truncate">{role}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        
        <header className="h-20 bg-white border-b border-border px-8 flex items-center justify-between shrink-0 shadow-sm z-0">
          
          <div className="flex items-center space-x-6 flex-1">
            {activeTab !== 'dashboard' && (
              <h2 className="text-lg font-bold text-gray-900 capitalize tracking-tight min-w-max">
                {activeTab === 'users' ? 'Identity Matrix' : activeTab.replace('-', ' ')}
              </h2>
            )}
            
            {activeTab === 'dashboard' && role !== 'StandardUser' && (
              <div>
                {renderTripleTierFilters()}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {activeTab === 'dashboard' && (
              <Button 
                onClick={() => setIsLiveMode(true)} 
                variant="outline" 
                size="sm" 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 bg-success hover:bg-green-500 text-white shadow-sm transition-colors duration-200 border-none"
              >
                <Monitor className="h-4 w-4 mr-2 text-white" /> Live Dashboard
              </Button>
            )}
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            
            <Button onClick={handleExportData} variant="outline" size="icon" className="bg-white border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm h-9 w-9" title="Export Audit CSV">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button onClick={refreshAllData} disabled={isLoading} variant="outline" size="icon" className="bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm h-9 w-9 disabled:opacity-50" title="Refresh Engine">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {renderTabContent()}
          <div className="mt-8">
            <Footer />
          </div>
        </div>
        
      </main>
    </div>
  );
};

export default Index;