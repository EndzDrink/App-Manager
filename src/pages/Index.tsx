import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardTabs } from "@/components/DashboardTabs";
import { MetricCard } from "@/components/MetricCard";
import { WeeklyUsageChart } from "@/components/WeeklyUsageChart";
import { CategoryUsageChart } from "@/components/CategoryUsageChart";
import { AdminTab } from "@/components/AdminTab";
import { AppsTab } from "@/components/AppsTab";
import { SubscriptionsTab } from "@/components/SubscriptionsTab";
import { RecommendationsTab } from "@/components/RecommendationsTab";
import { 
  Smartphone, 
  CreditCard, 
  DollarSign, 
  Lightbulb 
} from "lucide-react";

const initialApps = [
  { id: '1', name: 'Spotify', category: 'Music & Audio', dailyUsage: '2h 15m', size: '250 MB', lastUsed: 'Today', icon: '🎧', color: 'bg-green-500' },
  { id: '2', name: 'Google Docs', category: 'Productivity', dailyUsage: '30m', size: '100 MB', lastUsed: 'Yesterday', icon: '📄', color: 'bg-blue-500' },
  { id: '3', name: 'Unused App', category: 'Utility', dailyUsage: '0m', size: '50 MB', lastUsed: '3 months ago', icon: '📦', color: 'bg-gray-500' },
];

const initialSubscriptions = [
  { id: 'sub1', name: 'Netflix', category: 'Entertainment', price: '$15.99', billing: '2025-08-25', usage: 'High Usage', usageColor: 'bg-green-500', icon: '🎬', color: 'bg-red-600' },
  { id: 'sub2', name: 'Adobe Cloud', category: 'Productivity', price: '$52.99', billing: '2025-09-01', usage: 'Medium Usage', usageColor: 'bg-yellow-500', icon: '🎨', color: 'bg-red-500' },
  { id: 'sub3', name: 'Fitness+', category: 'Health & Fitness', price: '$9.99', billing: '2025-08-10', usage: 'Never Usage', usageColor: 'bg-red-500', icon: '🏋️', color: 'bg-blue-700' },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [apps, setApps] = useState(initialApps);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  const handleAddApp = () => {
    console.log("Add new app clicked");
  };

  const handleAddSubscription = () => {
    console.log("Add new subscription clicked");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "admin":
        return <AdminTab />;
      case "apps":
        return <AppsTab apps={apps} onAddApp={handleAddApp} />;
      case "subscriptions":
        return <SubscriptionsTab subscriptions={subscriptions} onAddSubscription={handleAddSubscription} />;
      case "recommendations":
        return <RecommendationsTab />;
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                icon={<Smartphone className="h-5 w-5" />}
                title="Total Apps"
                value="5"
                subtitle="4 active • 1 unused"
              />
              <MetricCard
                icon={<CreditCard className="h-5 w-5" />}
                title="Subscriptions"
                value="4"
                subtitle="3 actively used"
              />
              <MetricCard
                icon={<DollarSign className="h-5 w-5" />}
                title="Monthly Cost"
                value="ZAR 108.96"
                subtitle="ZAR 1307.52 yearly"
              />
              <MetricCard
                icon={<Lightbulb className="h-5 w-5" />}
                title="Recommendations"
                value="2"
                subtitle="Optimization suggestions"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyUsageChart />
              <CategoryUsageChart />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DashboardHeader />
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Index;
