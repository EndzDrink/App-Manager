import { useState, useEffect, useMemo, useCallback } from "react";
import type { ElementType } from "react";
import { CIODashboard } from "@/components/CIODashboard";
import { StaffDashboard } from "@/components/StaffDashboard";
import { DepartmentDashboard } from "@/components/DepartmentDashboard";
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
  LayoutDashboard, Users, ShieldCheck, Settings, Menu, Archive, FileText, Fingerprint, SlidersHorizontal
} from "lucide-react";

// ------------------------------------------------------------------
// 1. ENV & CONSTANTS
// ------------------------------------------------------------------
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MUNICIPAL_UNITS = [
  "Information Management Unit (IMU)",
  "Water & Sanitation Unit",
  "Metro Police Unit",
  "Parks & Recreation Unit"
] as const;

const IMU_DEPARTMENTS = [
  "Enterprise Architecture",
  "Applications/Dev",
  "Networks",
  "PMO",
  "Security",
  "GIS",
  "Admin",
  "Customer Service"
] as const;

const DASHBOARD_WIDGETS = [
  { id: 'financial', label: 'Executive Financial Governance', description: 'Budget dials, variance metrics, and high-level spend.' },
  { id: 'portfolio', label: 'Portfolio Operations', description: 'Active licenses, enterprise catalog count, and EA pipeline.' },
  { id: 'usage', label: 'Systems Usage Trend', description: '7-day daily active utilization footprint chart.' },
  { id: 'category', label: 'Category Utilization', description: 'Donut chart of system categories and architectural spread.' },
  { id: 'recommendations', label: 'AI Optimization Insights', description: 'Cost-saving insights and platform redundancies.' }
];

// ------------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------------
type AppRole =
  | 'SuperAdmin'
  | 'EA'
  | 'CIO'
  | 'DepartmentHead'
  | 'PMOLead'
  | 'ApplicationsHead'
  | 'NetworksHead'
  | 'CRMHead'
  | 'StandardUser';

interface System {
  id: number;
  name: string;
  category: string;
  created_at?: string;
  departments?: string[];
}

interface Subscription {
  id: number;
  name: string;
  category: string;
  price: string | number;
  department_id?: number;
  project_name?: string;
}

interface User {
  id?: number;
  email?: string;
  department?: string;
  assigned_systems?: { name: string; price: number }[];
}

interface Recommendation {
  title: string;
  [key: string]: unknown;
}

interface SavedReport {
  id: number;
  filename: string;
  date: string;
  content: string;
}

interface Connector {
  id?: number;
  [key: string]: unknown;
}

interface NavItem {
  id: string;
  label: string;
  icon: ElementType;
  roles: AppRole[];
}

// ------------------------------------------------------------------
// 3. PURE UTILITIES
// ------------------------------------------------------------------
const getUnitForDept = (deptName: string): string => {
  if (!deptName || deptName === 'Unassigned') return "Other";
  if (IMU_DEPARTMENTS.includes(deptName as typeof IMU_DEPARTMENTS[number])) return "Information Management Unit (IMU)";
  const lower = deptName.toLowerCase();
  if (lower.includes("water") || lower.includes("sanitation")) return "Water & Sanitation Unit";
  if (lower.includes("police")) return "Metro Police Unit";
  if (lower.includes("park") || lower.includes("recreation")) return "Parks & Recreation Unit";
  return "Other";
};

const parseRole = (raw: string | null): AppRole => {
  const valid: AppRole[] = [
    'SuperAdmin', 'EA', 'CIO', 'DepartmentHead',
    'PMOLead', 'ApplicationsHead', 'NetworksHead', 'CRMHead', 'StandardUser'
  ];
  return valid.includes(raw as AppRole) ? (raw as AppRole) : 'StandardUser';
};

const escapeCsv = (value: unknown): string => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

// ------------------------------------------------------------------
// 4. RBAC NAVIGATION MATRIX
// ------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead', 'ApplicationsHead', 'NetworksHead', 'CRMHead', 'StandardUser'] },
  { id: 'systems', label: 'Enterprise Catalog', icon: Server, roles: ['StandardUser', 'DepartmentHead', 'SuperAdmin', 'EA', 'CIO', 'PMOLead', 'ApplicationsHead', 'NetworksHead', 'CRMHead'] },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead'] },
  { id: 'users', label: 'Identity Matrix', icon: Users, roles: ['SuperAdmin', 'EA', 'DepartmentHead'] },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, roles: ['SuperAdmin', 'CIO'] },
  { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck, roles: ['SuperAdmin', 'EA'] },
  { id: 'ea-strategy', label: 'EA Strategy', icon: Fingerprint, roles: ['SuperAdmin', 'EA'] },
  { id: 'admin', label: 'Settings', icon: Settings, roles: ['SuperAdmin'] }
];

const SUBSCRIPTION_ROLES: AppRole[] = ['SuperAdmin', 'EA', 'CIO', 'DepartmentHead', 'PMOLead'];
const AUDIT_ROLES: AppRole[] = ['SuperAdmin', 'EA'];
const RECOMMENDATION_ROLES: AppRole[] = ['SuperAdmin', 'CIO'];
const USER_ROLES: AppRole[] = ['SuperAdmin', 'EA', 'DepartmentHead'];
const EA_STRATEGY_ROLES: AppRole[] = ['SuperAdmin', 'EA'];

// ------------------------------------------------------------------
// 5. COMPONENT
// ------------------------------------------------------------------
const Index = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('appManagerToken'));
  const [role, setRole] = useState<AppRole>(() => parseRole(localStorage.getItem('appManagerRole')));
  const [userDepartmentId, setUserDepartmentId] = useState<number | null>(() => {
    const raw = localStorage.getItem('appManagerDeptId');
    return raw ? parseInt(raw, 10) : null;
  });

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // --- Dashboard Customization State ---
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ea_dashboard_widgets');
      return saved ? JSON.parse(saved) : DASHBOARD_WIDGETS.map(w => w.id);
    } catch {
      return DASHBOARD_WIDGETS.map(w => w.id);
    }
  });

  // --- Data State ---
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ea_saved_reports') || '[]');
    } catch {
      return [];
    }
  });

  const [systems, setSystems] = useState<System[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [duplications, setDuplications] = useState<unknown[]>([]);
  const [deptSpend, setDeptSpend] = useState<unknown[]>([]);
  const [trends, setTrends] = useState<unknown>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [budget, setBudget] = useState<number>(150000);
  const [isLoading, setIsLoading] = useState(true);

  // --- Drill-down State ---
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [deptDetails, setDeptDetails] = useState<unknown>(null);

  // --- BI Filters ---
  const [biSystemFilter, setBiSystemFilter] = useState<string>("All");
  const [biUnitFilter, setBiUnitFilter] = useState<string>("All");
  const [biDeptFilter, setBiDeptFilter] = useState<string>("All");

  // ----------------------------------------------------------------
  // 6. MEMOIZED DERIVATIONS
  // ----------------------------------------------------------------
  const visibleNavItems = useMemo(() => NAV_ITEMS.filter(item => item.roles.includes(role)), [role]);

  const allSystemNames = useMemo(
    () => Array.from(new Set(systems.map(s => s.name).filter(Boolean))).sort() as string[],
    [systems]
  );

  const allDeptNames = useMemo(
    () => Array.from(new Set(users.map(u => u.department).filter((d): d is string => !!d && d !== 'Unassigned'))).sort(),
    [users]
  );

  const availableSystems = useMemo(() => {
    if (biUnitFilter === "All" && biDeptFilter === "All") return allSystemNames;
    return allSystemNames.filter(sys =>
      users.some(u => {
        const matchUnit = biUnitFilter === "All" || getUnitForDept(u.department) === biUnitFilter;
        const matchDept = biDeptFilter === "All" || u.department === biDeptFilter;
        const hasSys = u.assigned_systems?.some(s => s.name === sys);
        return matchUnit && matchDept && hasSys;
      })
    );
  }, [allSystemNames, users, biUnitFilter, biDeptFilter]);

  const availableUnits = useMemo(() => {
    return MUNICIPAL_UNITS.filter(unit =>
      users.some(u => {
        const matchSys = biSystemFilter === "All" || u.assigned_systems?.some(s => s.name === biSystemFilter);
        const matchDept = biDeptFilter === "All" || u.department === biDeptFilter;
        const isUnit = getUnitForDept(u.department) === unit;
        return matchSys && matchDept && isUnit;
      })
    );
  }, [users, biSystemFilter, biDeptFilter]);

  const availableDepts = useMemo(() => {
    return allDeptNames.filter(dept =>
      users.some(u => {
        const matchSys = biSystemFilter === "All" || u.assigned_systems?.some(s => s.name === biSystemFilter);
        const matchUnit = biUnitFilter === "All" || getUnitForDept(u.department) === biUnitFilter;
        const isDept = u.department === dept;
        return matchSys && matchUnit && isDept;
      })
    );
  }, [allDeptNames, users, biSystemFilter, biUnitFilter]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      if (role === 'DepartmentHead' && sub.department_id !== userDepartmentId) return false;
      if (biSystemFilter !== "All" && sub.name !== biSystemFilter) return false;
      if (biUnitFilter !== "All" || biDeptFilter !== "All") {
        const userForSub = users.find(u =>
          u.assigned_systems?.some(s => s.name === sub.name && s.price === sub.price)
        );
        if (userForSub) {
          if (biUnitFilter !== "All" && getUnitForDept(userForSub.department) !== biUnitFilter) return false;
          if (biDeptFilter !== "All" && userForSub.department !== biDeptFilter) return false;
        }
      }
      return true;
    });
  }, [subscriptions, role, userDepartmentId, biSystemFilter, biUnitFilter, biDeptFilter, users]);

  const filteredMonthlyCost = useMemo(
    () => filteredSubscriptions.reduce((sum, sub) => sum + parseFloat(String(sub.price || 0)), 0),
    [filteredSubscriptions]
  );

  const filteredRecommendations = useMemo(
    () => (biSystemFilter === "All" ? recommendations : recommendations.filter(rec => rec.title.includes(biSystemFilter))),
    [recommendations, biSystemFilter]
  );

  const percentUsed = useMemo(() => (budget > 0 ? (filteredMonthlyCost / budget) * 100 : 0), [filteredMonthlyCost, budget]);

  const costColor = useMemo(() => {
    if (percentUsed >= 100) return "text-red-600";
    if (percentUsed >= 80) return "text-orange-500";
    return "text-green-600";
  }, [percentUsed]);

  // ----------------------------------------------------------------
  // 7. HANDLERS
  // ----------------------------------------------------------------
  const handleLogout = useCallback(() => {
    localStorage.removeItem('appManagerToken');
    localStorage.removeItem('appManagerRole');
    localStorage.removeItem('appManagerDeptId');
    setToken(null);
    setRole('StandardUser');
    setUserDepartmentId(null);
  }, []);

  const handleLoginSuccess = useCallback((newToken: string, newRole: string, deptId?: number) => {
    localStorage.setItem('appManagerToken', newToken);
    localStorage.setItem('appManagerRole', newRole);
    if (deptId) localStorage.setItem('appManagerDeptId', deptId.toString());

    setToken(newToken);
    setRole(parseRole(newRole));
    if (deptId) setUserDepartmentId(deptId);

    setActiveTab('dashboard'); 
  }, []);

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('appManagerToken');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...options.headers,
    };
    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
  };

  const fetchMonthlyCost = useCallback(async () => {
    const res = await fetchWithAuth('/api/metrics/monthly-cost');
    if (res.ok) {
      const d = await res.json();
      setMonthlyCost(d.total);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    const res = await fetchWithAuth('/api/subscriptions');
    if (res.ok) setSubscriptions(await res.json());
  }, []);

  const fetchSystems = useCallback(async () => {
    const res = await fetchWithAuth('/api/systems');
    if (res.ok) setSystems(await res.json());
  }, []);

  const fetchRecommendations = useCallback(async () => {
    const res = await fetchWithAuth('/api/recommendations');
    if (res.ok) setRecommendations(await res.json());
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetchWithAuth('/api/settings');
    if (res.ok) {
      const d = await res.json();
      setBudget(parseFloat(d.monthly_budget));
    }
  }, []);

  const fetchConnectors = useCallback(async () => {
    const res = await fetchWithAuth('/api/connectors');
    if (res.ok) setConnectors(await res.json());
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetchWithAuth('/api/users');
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchTrends = useCallback(async () => {
    const res = await fetchWithAuth('/api/metrics/trends');
    if (res.ok) setTrends(await res.json());
  }, []);

  const fetchAuditData = useCallback(async (currentRole: AppRole) => {
    if (['SuperAdmin', 'EA', 'DepartmentHead'].includes(currentRole)) {
      const deptRes = await fetchWithAuth('/api/metrics/departmental-spend');
      if (deptRes.ok) setDeptSpend(await deptRes.json());
    }
    if (['SuperAdmin', 'EA'].includes(currentRole)) {
      const dupRes = await fetchWithAuth('/api/audit/duplication');
      if (dupRes.ok) setDuplications(await dupRes.json());
    }
  }, []);

  const refreshAllData = useCallback(async () => {
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
        fetchAuditData(role),
        fetchTrends()
      ]);
    } catch (error) {
      console.error("Failed to sync engine:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, role, fetchMonthlyCost, fetchSubscriptions, fetchSystems, fetchRecommendations, fetchSettings, fetchConnectors, fetchUsers, fetchAuditData, fetchTrends]);

  const handleUpdateBudget = useCallback(async (nb: number) => {
    await fetchWithAuth('/api/settings', { method: 'PUT', body: JSON.stringify({ monthly_budget: nb }) });
    setBudget(nb);
  }, []);

  const handleReclaim = useCallback(async (id: number) => {
    if (role === 'StandardUser') return;
    const res = await fetchWithAuth(`/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) refreshAllData();
  }, [role, refreshAllData]);

  const handleDepartmentClick = useCallback(async (id: number) => {
    const res = await fetchWithAuth(`/api/departments/${id}/details`);
    if (res.ok) {
      const details = await res.json();
      setDeptDetails(details);
      setSelectedDeptId(id);
    }
  }, []);

  const handleAddConnector = useCallback(async (connectorData: unknown) => {
    try {
      await fetchWithAuth('/api/connectors', { method: 'POST', body: JSON.stringify(connectorData) });
      refreshAllData();
    } catch (err) {
      console.error("Failed to save connector:", err);
    }
  }, [refreshAllData]);

  const handleSaveReportToArchive = useCallback((filename: string, content: string) => {
    const newReport: SavedReport = {
      id: Date.now(),
      filename,
      date: new Date().toLocaleString(),
      content
    };
    const updatedReports = [newReport, ...savedReports].slice(0, 50);
    setSavedReports(updatedReports);
    localStorage.setItem('ea_saved_reports', JSON.stringify(updatedReports));
  }, [savedReports]);

  const handleReDownload = useCallback((filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleClearArchive = useCallback(() => {
    setSavedReports([]);
    localStorage.removeItem('ea_saved_reports');
  }, []);

  const toggleWidgetVisibility = (id: string) => {
    setVisibleWidgets(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id];
      localStorage.setItem('ea_dashboard_widgets', JSON.stringify(next));
      return next;
    });
  };

  // ----------------------------------------------------------------
  // 8. EXPORT
  // ----------------------------------------------------------------
  const handleExportData = useCallback(() => {
    const dateStamp = new Date().toISOString().split('T')[0];
    let csvContent = "";
    let filename = "";

    if (activeTab === 'systems') {
      const headers = ['System ID', 'System Name', 'Category', 'Date Added', 'Deployed Departments'];
      const rows = systems.map(app => [
        app.id,
        app.name,
        app.category,
        app.created_at ?? '',
        app.departments?.join(', ') ?? 'None'
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n');
      filename = `eThekwini_IT_Catalog_${dateStamp}.csv`;
    } else {
      const headers = ['System Name', 'Category', 'Monthly Cost (ZAR)', 'Assigned Project', 'Status'];
      const rows = filteredSubscriptions.map(sub => [
        sub.name,
        sub.category,
        sub.price,
        sub.project_name || 'Operational (No Project)',
        'Active'
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n');
      filename = `Municipal_SaaS_Audit_${dateStamp}.csv`;
    }

    handleSaveReportToArchive(filename, csvContent);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeTab, systems, filteredSubscriptions, handleSaveReportToArchive]);

  // ----------------------------------------------------------------
  // 9. FILTER EVENT HANDLERS
  // ----------------------------------------------------------------
  const handleSystemChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBiSystemFilter(val);
    if (val !== "All") {
      if (biUnitFilter !== "All" && !users.some(u => getUnitForDept(u.department) === biUnitFilter && u.assigned_systems?.some(s => s.name === val))) {
        setBiUnitFilter("All");
      }
      if (biDeptFilter !== "All" && !users.some(u => u.department === biDeptFilter && u.assigned_systems?.some(s => s.name === val))) {
        setBiDeptFilter("All");
      }
    }
  }, [biUnitFilter, biDeptFilter, users]);

  const handleUnitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBiUnitFilter(val);
    if (val !== "All") {
      if (biDeptFilter !== "All" && getUnitForDept(biDeptFilter) !== val) setBiDeptFilter("All");
      if (biSystemFilter !== "All" && !users.some(u => getUnitForDept(u.department) === val && u.assigned_systems?.some(s => s.name === biSystemFilter))) {
        setBiSystemFilter("All");
      }
    }
  }, [biDeptFilter, biSystemFilter, users]);

  const handleDeptChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBiDeptFilter(val);
    if (val !== "All") {
      const parentUnit = getUnitForDept(val);
      if (biUnitFilter !== parentUnit) setBiUnitFilter(parentUnit);
      if (biSystemFilter !== "All" && !users.some(u => u.department === val && u.assigned_systems?.some(s => s.name === biSystemFilter))) {
        setBiSystemFilter("All");
      }
    }
  }, [biUnitFilter, biSystemFilter, users]);

  // ----------------------------------------------------------------
  // 10. EFFECTS
  // ----------------------------------------------------------------
  useEffect(() => {
    if (token) refreshAllData();
  }, [token, refreshAllData]);

  useEffect(() => {
    if (visibleNavItems.length > 0 && !visibleNavItems.find(item => item.id === activeTab)) {
      setActiveTab(visibleNavItems[0].id);
      setSelectedDeptId(null);
    }
  }, [activeTab, visibleNavItems]);

  // ----------------------------------------------------------------
  // 11. RENDER HELPERS
  // ----------------------------------------------------------------
  if (!token) return <Login onLoginSuccess={handleLoginSuccess} />;

  const UnauthorizedView = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
      <Lock className="h-12 w-12 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
      <p className="text-sm text-gray-500 mt-2">Your current clearance level ({role}) does not permit access to this module.</p>
    </div>
  );

  const renderDashboardContent = () => {
    switch (role) {
      case 'SuperAdmin':
      case 'EA':
      case 'CIO':
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
            visibleWidgets={visibleWidgets}
          />
        );

        case 'DepartmentHead':
          return <DepartmentDashboard />;
  
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
          return <StaffDashboard />;
      }
    };

  const renderTabContent = () => {
    if (selectedDeptId && deptDetails) {
      if (role === 'StandardUser') return <UnauthorizedView />;
      return <DepartmentDetailTab details={deptDetails} onBack={() => { setSelectedDeptId(null); setDeptDetails(null); }} />;
    }

    switch (activeTab) {
      case "admin":
        return role === 'SuperAdmin' ? (
          <AdminTab
            onRefresh={refreshAllData}
            onExport={handleExportData}
            budget={budget}
            onUpdateBudget={handleUpdateBudget}
            connectors={connectors}
            onAddConnector={handleAddConnector}
            stats={{ totalApps: systems.length, activeSubscriptions: subscriptions.length, recommendations: recommendations.length, monthlyCost }}
          />
        ) : <UnauthorizedView />;

      case "systems":
        return <AppsTab apps={systems} onAddApp={refreshAllData} />;

      case "subscriptions":
        return SUBSCRIPTION_ROLES.includes(role) ? (
          <SubscriptionsTab subscriptions={subscriptions} onAddSubscription={refreshAllData} />
        ) : <UnauthorizedView />;

      case "audit":
        return AUDIT_ROLES.includes(role) ? (
          <AuditTab
            duplications={duplications}
            deptSpend={deptSpend}
            onDepartmentClick={handleDepartmentClick}
            systems={systems}
          />
        ) : <UnauthorizedView />;

      case "recommendations":
        return RECOMMENDATION_ROLES.includes(role) ? (
          <RecommendationsTab
            recommendations={recommendations}
            onReclaim={handleReclaim}
            onInvestigate={(sysName: string) => {
              setActiveTab('users');
              setBiSystemFilter(sysName);
              setBiUnitFilter('All');
              setBiDeptFilter('All');
            }}
          />
        ) : <UnauthorizedView />;

      case "users":
        return USER_ROLES.includes(role) ? (
          <UsersTab
            users={users}
            onRefresh={refreshAllData}
            investigationQuery={biSystemFilter !== "All" ? biSystemFilter : undefined}
          />
        ) : <UnauthorizedView />;

      case "ea-strategy":
        return EA_STRATEGY_ROLES.includes(role) ? <EAStrategyTab /> : <UnauthorizedView />;

      default:
        return renderDashboardContent();
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
        {availableSystems.map(name => <option key={name} value={name}>{name}</option>)}
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
        {availableDepts.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
  );

  // ----------------------------------------------------------------
  // 12. LIVE MODE
  // ----------------------------------------------------------------
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

          <div className="flex items-center ml-auto space-x-3">
            {['SuperAdmin', 'DepartmentHead', 'EA'].includes(role) && (
              <Button
                onClick={() => setIsCustomizeOpen(true)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold shadow-sm h-9 px-4 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Customize View
              </Button>
            )}
            <button onClick={() => setIsLiveMode(false)} className="flex items-center px-4 py-2 bg-white/10 text-white rounded-md text-sm font-medium hover:bg-white/20 transition-colors border border-white/20 shadow-sm">
              <X className="h-4 w-4 mr-2" /> Exit
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[1600px] mx-auto pb-4">
            {renderDashboardContent()}
          </div>
        </div>

        <Footer />

        {/* Live Mode Archive/Customize modals if needed */}
      </div>
    );
  }

  // ----------------------------------------------------------------
  // 13. MAIN LAYOUT
  // ----------------------------------------------------------------
  return (
    <div className="flex h-screen overflow-hidden relative bg-gray-50">

      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-900 to-blue-800 border-r border-blue-950 flex flex-col shrink-0 shadow-sm z-20 transition-all duration-300 ease-in-out relative`}>

        <div className="h-20 flex items-center justify-center px-4 border-b border-blue-800 bg-[#00a9e0] shrink-0">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 w-full'}`}>
            <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Monitor className="h-5 w-5 text-blue-900" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-xl font-bold text-white tracking-tight">SEAM</h1>
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
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
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

      {/* Main */}
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
            <div className="flex items-center space-x-2">{
            
            activeTab === 'dashboard' && (
                <Button
                  onClick={() => setIsLiveMode(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold shadow-sm h-9 px-4 mr-2"
                >
                  <Monitor className="h-4 w-4 mr-2" /> Live Dashboard
                </Button>
              )}
              {activeTab === 'dashboard' && ['SuperAdmin', 'DepartmentHead', 'EA'].includes(role) && (
                <Button
                  onClick={() => setIsCustomizeOpen(true)}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-blue-900 border-gray-200 font-bold shadow-sm h-9 px-4 mr-3"
                >
                  <SlidersHorizontal/> 
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

      {/* Customize Dashboard Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-900">
              <div className="flex items-center text-white">
                <SlidersHorizontal className="h-5 w-5 mr-2 text-yellow-400" />
                <h2 className="text-lg font-bold">Customize Dashboard</h2>
              </div>
              <button onClick={() => setIsCustomizeOpen(false)} className="text-blue-200 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 bg-gray-50 flex-1 space-y-3 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-4 font-medium">Select which modules to display on your dashboard viewport. Changes are saved automatically.</p>
              
              {DASHBOARD_WIDGETS.map(widget => (
                <label key={widget.id} className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${visibleWidgets.includes(widget.id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 opacity-70 hover:opacity-100'}`}>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{widget.label}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{widget.description}</p>
                  </div>
                  <div className="ml-4 flex items-center h-full pt-1">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={visibleWidgets.includes(widget.id)}
                      onChange={() => toggleWidgetVisibility(widget.id)}
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end">
              <Button onClick={() => setIsCustomizeOpen(false)} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 shadow-sm">Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
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