import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardTabs } from "@/components/DashboardTabs";
import { MetricCard } from "@/components/MetricCard";
import { WeeklyUsageChart } from "@/components/WeeklyUsageChart";
import { CategoryUsageChart } from "@/components/CategoryUsageChart";
import { 
  Smartphone, 
  CreditCard, 
  DollarSign, 
  Lightbulb 
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DashboardHeader />
        <DashboardTabs />
        
        {/* Metrics Grid */}
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
            value="$108.96"
            subtitle="$1307.52 yearly"
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
      </div>
    </div>
  );
};

export default Index;
