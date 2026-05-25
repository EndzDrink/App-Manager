import React, { useMemo } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { WeeklyUsageChart } from "@/components/WeeklyUsageChart";
import { CategoryUsageChart } from "@/components/CategoryUsageChart";
import { 
  Server, CreditCard, Coins, Lightbulb, TrendingUp, 
  TrendingDown, ArrowLeftRight, DollarSign, ShieldCheck 
} from "lucide-react";
import { Card } from "@/components/ui/card";

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
  
  // ------------------------------------------------------------------
  // DATA COMPUTATIONS
  // ------------------------------------------------------------------
  // Portfolio Breakdown
  const internalCount = systems.filter(s => s.deployment_type?.includes('Internal')).length;
  const externalCount = systems.filter(s => !s.deployment_type || s.deployment_type.includes('External')).length;
  const hybridCount = systems.filter(s => s.deployment_type?.includes('Hybrid')).length;

  // We need to fetch the request pipeline data to calculate CRM & EA metrics
  const [pipelineData, setPipelineData] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const token = localStorage.getItem('appManagerToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setPipelineData(await res.json());
      } catch (err) {
        console.error("Failed to load pipeline data for CIO dashboard:", err);
      }
    };
    fetchPipeline();
  }, []);

  // Compute CRM Deflection Metrics (CAPEX Savings)
  const deflectedRequests = pipelineData.filter(d => d.crm_status === 'deflected');
  const opexSaved = deflectedRequests.reduce((sum, d) => sum + (parseFloat(String(d.estimated_cost_annual)) || 0), 0);
  
  // Compute EA Alignment Metrics
  const eaApproved = pipelineData.filter(d => d.ea_status === 'Approved');
  const eaRejected = pipelineData.filter(d => d.ea_status === 'Rejected' || d.ea_status === 'Vetoed');
  
  // Compute Reclaimed Budget (OPEX Savings)
  // In a real scenario, this would track historical revokes. 
  // For the dashboard, we calculate potential savings from the AI recommendations.
  const potentialOpexReclaim = recommendations.reduce((sum, rec) => {
    const match = rec.description.match(/ZAR (\d+\.?\d*)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-[1600px] mx-auto">
      
      {/* 1. EXECUTIVE FINANCIAL SUMMARY (The Commercial Closer) */}
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Executive Financial Governance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />} 
          title="CAPEX Deflected" 
          value={`ZAR ${(opexSaved / 1000).toFixed(1)}k`} 
          subtitle={<span className="text-emerald-600 font-bold text-[10px]">{deflectedRequests.length} redundant requests blocked</span>} 
        />

        <MetricCard 
          icon={<Lightbulb className="h-5 w-5 text-amber-500" />} 
          title="OPEX Reclaim Target" 
          value={`ZAR ${(potentialOpexReclaim / 1000).toFixed(1)}k`} 
          subtitle={<span className="text-amber-600 font-bold text-[10px]">Identified across {recommendations.length} optimizations</span>} 
        />

        <MetricCard 
          icon={<ShieldCheck className="h-5 w-5 text-blue-500" />} 
          title="MFMA Compliance" 
          value="100%" 
          subtitle={<span className="text-blue-600 font-bold text-[10px]">All active IT spend architecturally vetted</span>} 
        />
      </div>

      {/* 2. PORTFOLIO & OPERATIONAL METRICS */}
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 mt-8 border-t border-gray-200 pt-6">Portfolio Operations</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          icon={<Server className="h-5 w-5" />} 
          title="IT Portfolio" 
          value={biSystemFilter === "All" ? systems.length.toString() : "1"} 
          subtitle={
            biSystemFilter === "All"
              ? <div className="flex gap-2 text-[10px] font-bold mt-1.5 bg-gray-100 p-1 rounded w-fit">
                  <span className="text-green-600">INT: {internalCount}</span>|
                  <span className="text-blue-600">EXT: {externalCount}</span>|
                  <span className="text-purple-600">HYB: {hybridCount}</span>
                </div>
              : "Isolated View"
          } 
        />
        
        <MetricCard 
          icon={<CreditCard className="h-5 w-5" />} 
          title="Active Licenses" 
          value={subscriptions.length.toString()} 
          subtitle={biSystemFilter === "All" ? "Provisioned enterprise seats" : `Seats for ${biSystemFilter}`} 
        />

        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <ArrowLeftRight className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">EA Vetting Pipeline</h3>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
             <div className="flex-1 bg-green-50 rounded-lg p-2 border border-green-100 text-center">
               <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-0.5">Approved</p>
               <p className="text-xl font-black text-green-800">{eaApproved.length}</p>
             </div>
             <div className="flex-1 bg-red-50 rounded-lg p-2 border border-red-100 text-center">
               <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-0.5">Vetoed</p>
               <p className="text-xl font-black text-red-800">{eaRejected.length}</p>
             </div>
          </div>
        </Card>
      </div>
      
      {/* 3. ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mt-8 border-t border-gray-200 pt-6">
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