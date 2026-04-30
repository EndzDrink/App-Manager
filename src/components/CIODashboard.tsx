import React from 'react';
import { MetricCard } from "@/components/MetricCard";
import { WeeklyUsageChart } from "@/components/WeeklyUsageChart";
import { CategoryUsageChart } from "@/components/CategoryUsageChart";
import { Server, CreditCard, Coins, Lightbulb, TrendingUp, TrendingDown } from "lucide-react";

interface CIODashboardProps {
  systems: any[];
  subscriptions: any[];
  monthlyCost: number;
  percentUsed: number;
  costColor: string;
  trends: any;
  recommendations: any[];
  biSystemFilter: string;
  biUnitFilter: string;
  biDeptFilter: string;
  onSaveReport: (filename: string, content: string) => void;
  onNavigateToRecommendations: () => void;
}

export const CIODashboard: React.FC<CIODashboardProps> = ({
  systems, subscriptions, monthlyCost, percentUsed, costColor, trends, 
  recommendations, biSystemFilter, biUnitFilter, biDeptFilter, 
  onSaveReport, onNavigateToRecommendations
}) => {
  
  // Natively calculate the Portfolio breakdown just for the CIO
  const internalCount = systems.filter(s => s.deployment_type === 'Internal Build').length;
  const externalCount = systems.filter(s => s.deployment_type === 'External SaaS' || !s.deployment_type).length;
  const hybridCount = systems.filter(s => s.deployment_type === 'Hybrid Architecture').length;

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          icon={<Server className="h-5 w-5" />} 
          title="IT Portfolio" 
          value={biSystemFilter === "All" ? systems.length.toString() : "1"} 
          subtitle={
            biSystemFilter === "All"
              ? <div className="flex gap-2 text-[10px] font-bold mt-1.5 bg-gray-100 p-1 rounded"><span className="text-green-600">INT: {internalCount}</span>|<span className="text-blue-600">EXT: {externalCount}</span>|<span className="text-purple-600">HYB: {hybridCount}</span></div>
              : "Isolated View"
          } 
        />
        
        <MetricCard 
          icon={<CreditCard className="h-5 w-5" />} 
          title="Active Licenses" 
          value={subscriptions.length.toString()} 
          subtitle={biSystemFilter === "All" ? "Procured seats" : `Seats for ${biSystemFilter}`} 
        />
        
        <MetricCard 
          icon={<Coins className="h-5 w-5" />} 
          title={biSystemFilter === "All" && biUnitFilter === "All" ? "Total Burn" : "Filtered Burn"} 
          value={`ZAR ${monthlyCost.toFixed(2)}`} 
          subtitle={
            <div className="flex items-center space-x-2">
              <span className={costColor}>{biSystemFilter === "All" ? `${percentUsed.toFixed(0)}% of budget` : 'Direct Cost'}</span>
              {biSystemFilter === "All" && trends && (
                <span className={`flex items-center text-[10px] font-bold ${parseFloat(trends.momChange) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(trends.momChange) > 0 ? <TrendingUp className="h-2 w-2 mr-0.5"/> : <TrendingDown className="h-2 w-2 mr-0.5"/>}
                  {Math.abs(trends.momChange)}%
                </span>
              )}
            </div>
          } 
        />
        
        <MetricCard 
          icon={<Lightbulb className="h-5 w-5" />} 
          title="Saving Ops" 
          value={recommendations.length.toString()} 
          subtitle={biSystemFilter === "All" ? "Optimization identified" : `Flags for ${biSystemFilter}`} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col h-full min-h-[450px] w-full">
          <WeeklyUsageChart systemFilter={biSystemFilter} deptFilter={biDeptFilter} onSaveReport={onSaveReport} />
        </div>
        <div className="flex flex-col h-full min-h-[450px] w-full">
          <CategoryUsageChart systemFilter={biSystemFilter} deptFilter={biDeptFilter} onNavigateToRecommendations={onNavigateToRecommendations} />
        </div>
      </div>
    </div>
  );
};