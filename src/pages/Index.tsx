import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardTabs } from "@/components/DashboardTabs";
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
import { Smartphone, CreditCard, DollarSign, Lightbulb, TrendingUp, TrendingDown } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [apps, setApps] = useState<any[]>([]);
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
  
  // Drill-Down States
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [deptDetails, setDeptDetails] = useState<any>(null);

  const refreshAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchMonthlyCost(), fetchSubscriptions(), fetchApps(), fetchRecommendations(), fetchSettings(), fetchConnectors(), fetchUsers(), fetchAuditData(), fetchTrends()]);
    setIsLoading(false);
  };

  const handleReclaim = async (id: number) => {
    const res = await fetch(`http://localhost:3000/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) refreshAllData();
  };

  const handleDepartmentClick = async (id: number) => {
    const res = await fetch(`http://localhost:3000/api/departments/${id}/details`);
    if (res.ok) {
      setDeptDetails(await res.json());
      setSelectedDeptId(id);
    }
  };

  const fetchTrends = async () => {
    const res = await fetch('http://localhost:3000/api/metrics/trends');
    if (res.ok) setTrends(await res.json());
  };

  const fetchAuditData = async () => {
    const [dupRes, deptRes] = await Promise.all([fetch('http://localhost:3000/api/audit/duplication'), fetch('http://localhost:3000/api/metrics/departmental-spend')]);
    if (dupRes.ok) setDuplications(await dupRes.json());
    if (deptRes.ok) setDeptSpend(await deptRes.json());
  };

  const fetchUsers = async () => {
    const res = await fetch('http://localhost:3000/api/users');
    if (res.ok) setUsers(await res.json());
  };

  const fetchConnectors = async () => {
    const res = await fetch('http://localhost:3000/api/connectors');
    if (res.ok) setConnectors(await res.json());
  };

  const fetchSettings = async () => {
    const res = await fetch('http://localhost:3000/api/settings');
    if (res.ok) { const d = await res.json(); setBudget(parseFloat(d.monthly_budget)); }
  };

  const fetchMonthlyCost = async () => {
    const res = await fetch('http://localhost:3000/api/metrics/monthly-cost');
    if (res.ok) { const d = await res.json(); setMonthlyCost(d.total); }
  };

  const fetchSubscriptions = async () => {
    const res = await fetch('http://localhost:3000/api/subscriptions');
    if (res.ok) setSubscriptions(await res.json());
  };

  const fetchApps = async () => {
    const res = await fetch('http://localhost:3000/api/apps');
    if (res.ok) setApps(await res.json());
  };

  const fetchRecommendations = async () => {
    const res = await fetch('http://localhost:3000/api/recommendations');
    if (res.ok) setRecommendations(await res.json());
  };

  useEffect(() => { refreshAllData(); }, []);

  const percentUsed = budget > 0 ? (monthlyCost / budget) * 100 : 0;
  const costColor = percentUsed >= 100 ? "text-red-600" : percentUsed >= 80 ? "text-orange-500" : "text-green-600";

  const renderTabContent = () => {
    // Intercept standard tabs if a department is selected for drill-down
    if (selectedDeptId && deptDetails) {
      return <DepartmentDetailTab details={deptDetails} onBack={() => { setSelectedDeptId(null); setDeptDetails(null); }} />;
    }

    switch (activeTab) {
      case "admin": return <AdminTab onRefresh={refreshAllData} onExport={() => {}} budget={budget} onUpdateBudget={async () => {}} connectors={connectors} onAddConnector={async () => {}} stats={{ totalApps: apps.length, activeSubscriptions: subscriptions.length, recommendations: recommendations.length, monthlyCost }} />;
      case "apps": return <AppsTab apps={apps} onAddApp={refreshAllData} />;
      case "subscriptions": return <SubscriptionsTab subscriptions={subscriptions} onAddSubscription={refreshAllData} />;
      case "users": return <UsersTab users={users} />;
      case "recommendations": return <RecommendationsTab recommendations={recommendations} onReclaim={handleReclaim} />;
      case "audit": return <AuditTab duplications={duplications} deptSpend={deptSpend} onDepartmentClick={handleDepartmentClick} />;
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard icon={<Smartphone className="h-5 w-5" />} title="Total Apps" value={apps.length.toString()} subtitle="Org-wide" />
              <MetricCard icon={<CreditCard className="h-5 w-5" />} title="Licenses" value={subscriptions.length.toString()} subtitle="Active seats" />
              <MetricCard icon={<DollarSign className="h-5 w-5" />} title="Monthly Burn" value={`ZAR ${monthlyCost.toFixed(2)}`} subtitle={<div className="flex items-center space-x-2"><span className={costColor}>{percentUsed.toFixed(0)}% of budget</span>{trends && <span className={`flex items-center text-[10px] font-bold ${parseFloat(trends.momChange) > 0 ? 'text-red-500' : 'text-green-500'}`}>{parseFloat(trends.momChange) > 0 ? <TrendingUp className="h-2 w-2 mr-0.5"/> : <TrendingDown className="h-2 w-2 mr-0.5"/>}{Math.abs(trends.momChange)}%</span>}</div>} />
              <MetricCard icon={<Lightbulb className="h-5 w-5" />} title="Saving Ops" value={recommendations.length.toString()} subtitle="Optimization identified" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><WeeklyUsageChart /><CategoryUsageChart /></div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DashboardHeader onRefresh={refreshAllData} onExport={() => {}} />
        <DashboardTabs activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedDeptId(null); }} />
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Index;