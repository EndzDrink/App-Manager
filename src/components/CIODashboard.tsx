import React, { useState, useMemo, useEffect } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { WeeklyUsageChart } from "@/components/WeeklyUsageChart";
import { CategoryUsageChart } from "@/components/CategoryUsageChart";
import { 
  Server, CreditCard, Coins, Lightbulb, TrendingUp, ChevronRight ,
  TrendingDown, ArrowLeftRight, DollarSign, ShieldCheck, XCircle, Search, AlertTriangle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  visibleWidgets?: string[];
  onSaveReport: (filename: string, content: string) => void;
  onNavigateToRecommendations: () => void;
}

export const CIODashboard: React.FC<CIODashboardProps> = ({
  systems, subscriptions, monthlyCost, percentUsed, costColor, trends, 
  recommendations, biSystemFilter, biUnitFilter, biDeptFilter, 
  visibleWidgets = ['financial', 'portfolio', 'usage', 'category'],
  onSaveReport, onNavigateToRecommendations
}) => {
  
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
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

    const fetchEscalations = async () => {
      try {
        const token = localStorage.getItem('appManagerToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/audit/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const logs = await res.json();
          // Filter ONLY for items physically tagged as ESCALATION in the backend
          const activeEscalations = logs.filter((log: any) => log.action.includes('ESCALATION:'));
          setEscalations(activeEscalations);
        }
      } catch (err) {
        console.error("Failed to fetch executive escalations:", err);
      }
    };

    fetchPipeline();
    fetchEscalations();
  }, []);

  // ------------------------------------------------------------------
  // DATA COMPUTATIONS
  // ------------------------------------------------------------------
  const internalCount = systems.filter(s => s.deployment_type?.includes('Internal')).length;
  const externalCount = systems.filter(s => !s.deployment_type || s.deployment_type.includes('External')).length;
  const hybridCount = systems.filter(s => s.deployment_type?.includes('Hybrid')).length;

  const deflectedRequests = useMemo(() => pipelineData.filter(d => d.crm_status === 'deflected'), [pipelineData]);
  const opexSaved = useMemo(() => deflectedRequests.reduce((sum, d) => sum + (parseFloat(String(d.estimated_cost_annual)) || 0), 0), [deflectedRequests]);
  
  const eaApproved = useMemo(() => pipelineData.filter(d => d.ea_status === 'Approved'), [pipelineData]);
  const eaRejected = useMemo(() => pipelineData.filter(d => d.ea_status === 'Rejected' || d.ea_status === 'Vetoed'), [pipelineData]);
  
  const potentialOpexReclaim = useMemo(() => recommendations.reduce((sum, rec) => {
    const match = rec.description.match(/ZAR (\d+\.?\d*)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0), [recommendations]);

  // ----------------------------------------------------------------
  // FILTERING LOGIC FOR DRILL-DOWN REPORTING
  // ----------------------------------------------------------------
  const handleFilterToggle = (filterType: string) => {
    setActiveFilter(prev => prev === filterType ? null : filterType);
  };

  const getFilteredData = () => {
    switch(activeFilter) {
      case 'deflected': return deflectedRequests;
      case 'ea_approved': return eaApproved;
      case 'ea_rejected': return eaRejected;
      case 'portfolio': return systems;
      case 'subscriptions': return subscriptions;
      case 'escalations': return escalations;
      default: return [];
    }
  };

  const filteredData = getFilteredData();

  const InteractiveMetricCard = ({ title, value, subtitle, icon, filterKey }: any) => {
    const isActive = activeFilter === filterKey;
    return (
      <div 
        onClick={() => filterKey && handleFilterToggle(filterKey)}
        className={`cursor-pointer transition-all duration-200 h-full ${
          isActive 
            ? 'ring-2 ring-blue-500 scale-[1.02] shadow-md z-10 relative rounded-xl' 
            : 'hover:scale-[1.01] hover:shadow-sm'
        }`}
      >
        <MetricCard icon={icon} title={title} value={value} subtitle={subtitle} />
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
            Active Filter <XCircle className="h-3 w-3 ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveFilter(null); }} />
          </div>
        )}
      </div>
    );
  };

  const showUsage = visibleWidgets?.includes('usage');
  const showCategory = visibleWidgets?.includes('category');
  const chartsGridCols = (showUsage && showCategory) ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-[1600px] mx-auto relative">
      
      {/* 0. EXECUTIVE BLOCKER ALERT (Conditional) */}
      {escalations.length > 0 && (
        <div className="mb-6 animate-in slide-in-from-top-4">
          <Card className="bg-red-50 border border-red-200 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-900 uppercase tracking-widest">Critical Blockers Detected</h3>
                <p className="text-xs text-red-700 font-medium mt-0.5">The PMO has escalated {escalations.length} project(s) requiring executive unblocking.</p>
              </div>
            </div>
            <Button 
              onClick={() => handleFilterToggle('escalations')} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 shadow-sm"
            >
              Review Escalations
            </Button>
          </Card>
        </div>
      )}

      {/* 1. EXECUTIVE FINANCIAL SUMMARY */}
      {visibleWidgets?.includes('financial') && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Executive Financial Governance</h3>
            {activeFilter && (
              <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)} className="text-gray-500 text-xs font-bold hover:bg-gray-100 h-8">
                Clear Active Filter
              </Button>
            )}
          </div>

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

            <InteractiveMetricCard 
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />} 
              title="CAPEX Deflected" 
              value={`ZAR ${(opexSaved / 1000).toFixed(1)}k`} 
              subtitle={<span className="text-emerald-600 font-bold text-[10px]">{deflectedRequests.length} redundant requests blocked</span>} 
              filterKey="deflected"
            />

            <div 
              onClick={onNavigateToRecommendations}
              className="cursor-pointer hover:scale-[1.01] hover:shadow-sm transition-all duration-200 h-full"
            >
              <MetricCard 
                icon={<Lightbulb className="h-5 w-5 text-amber-500" />} 
                title="OPEX Reclaim Target" 
                value={`ZAR ${(potentialOpexReclaim / 1000).toFixed(1)}k`} 
                subtitle={<span className="text-amber-600 font-bold text-[10px] flex items-center">Click to view {recommendations.length} optimizations <ChevronRight className="h-3 w-3 ml-0.5"/></span>} 
              />
            </div>

            <MetricCard 
              icon={<ShieldCheck className="h-5 w-5 text-blue-500" />} 
              title="MFMA Compliance" 
              value="100%" 
              subtitle={<span className="text-blue-600 font-bold text-[10px]">All active IT spend architecturally vetted</span>} 
            />
          </div>
        </div>
      )}

      {/* 2. PORTFOLIO & OPERATIONAL METRICS */}
      {visibleWidgets?.includes('portfolio') && (
        <div className="animate-in fade-in duration-300">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 mt-8 border-t border-gray-200 pt-6">Portfolio Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <InteractiveMetricCard 
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
              filterKey="portfolio"
            />
            
            <InteractiveMetricCard 
              icon={<CreditCard className="h-5 w-5" />} 
              title="Active Licenses" 
              value={subscriptions.length.toString()} 
              subtitle={biSystemFilter === "All" ? "Provisioned enterprise seats" : `Seats for ${biSystemFilter}`} 
              filterKey="subscriptions"
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
                 <div 
                   onClick={() => handleFilterToggle('ea_approved')}
                   className={`flex-1 rounded-lg p-2 border text-center cursor-pointer transition-all duration-200 ${activeFilter === 'ea_approved' ? 'bg-green-100 border-green-400 ring-2 ring-green-500 scale-105' : 'bg-green-50 border-green-100 hover:bg-green-100'}`}
                 >
                   <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-0.5">Approved</p>
                   <p className="text-xl font-black text-green-800">{eaApproved.length}</p>
                 </div>
                 <div 
                   onClick={() => handleFilterToggle('ea_rejected')}
                   className={`flex-1 rounded-lg p-2 border text-center cursor-pointer transition-all duration-200 ${activeFilter === 'ea_rejected' ? 'bg-red-100 border-red-400 ring-2 ring-red-500 scale-105' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}
                 >
                   <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-0.5">Vetoed</p>
                   <p className="text-xl font-black text-red-800">{eaRejected.length}</p>
                 </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* DRILL-DOWN REPORTING TABLE (Renders conditionally if a filter is active) */}
      {activeFilter && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
          <Card className="bg-white border border-blue-200 shadow-lg flex flex-col overflow-hidden ring-1 ring-blue-100">
            <div className={`p-4 border-b flex justify-between items-center ${activeFilter === 'escalations' ? 'bg-red-50/80 border-red-200' : 'bg-blue-50/80 border-blue-100'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center ${activeFilter === 'escalations' ? 'text-red-900' : 'text-blue-900'}`}>
                {activeFilter === 'escalations' ? <AlertTriangle className="h-4 w-4 mr-2 text-red-600" /> : <Search className="h-4 w-4 mr-2 text-blue-600" />}
                Drill-Down Report: <span className={`ml-2 ${activeFilter === 'escalations' ? 'text-red-700' : 'text-blue-700'}`}>{
                  activeFilter === 'deflected' ? 'Deflected CAPEX Requests' :
                  activeFilter === 'ea_approved' ? 'Architecturally Approved Spend' :
                  activeFilter === 'ea_rejected' ? 'Architecturally Vetoed Spend' :
                  activeFilter === 'portfolio' ? 'Enterprise IT Catalog' :
                  activeFilter === 'subscriptions' ? 'Active Enterprise Licenses' : 
                  activeFilter === 'escalations' ? 'Executive Project Escalations' : ''
                }</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveFilter(null)} className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-200 hover:text-gray-900">
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-auto custom-scrollbar p-0">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                    {/* Dynamic Headers based on data type */}
                    {(activeFilter === 'deflected' || activeFilter.startsWith('ea_')) && (
                      <>
                        <th className="py-3 px-6 font-bold">Request Ref</th>
                        <th className="py-3 px-4 font-bold">Target System</th>
                        <th className="py-3 px-4 font-bold">Requesting Dept</th>
                        <th className="py-3 px-4 font-bold text-right">Financial Impact</th>
                      </>
                    )}
                    {activeFilter === 'portfolio' && (
                      <>
                        <th className="py-3 px-6 font-bold">System Name</th>
                        <th className="py-3 px-4 font-bold">Vendor</th>
                        <th className="py-3 px-4 font-bold">Category</th>
                        <th className="py-3 px-4 font-bold">Deployment</th>
                      </>
                    )}
                    {activeFilter === 'subscriptions' && (
                      <>
                        <th className="py-3 px-6 font-bold">System</th>
                        <th className="py-3 px-4 font-bold">Assigned User</th>
                        <th className="py-3 px-4 font-bold">Department</th>
                        <th className="py-3 px-4 font-bold text-right">Monthly Cost</th>
                      </>
                    )}
                    {activeFilter === 'escalations' && (
                      <>
                        <th className="py-3 px-6 font-bold">Timestamp</th>
                        <th className="py-3 px-4 font-bold">Escalating Officer</th>
                        <th className="py-3 px-6 font-bold">Escalation Detail</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.map((row: any, i: number) => (
                    <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                      {/* Dynamic Row Rendering */}
                      {(activeFilter === 'deflected' || activeFilter.startsWith('ea_')) && (
                        <>
                          <td className="py-3 px-6 font-bold text-sm text-gray-900">{row.id}</td>
                          <td className="py-3 px-4 font-medium text-gray-700">{row.system || row.system_name}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {row.dept || row.department || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-800">
                            ZAR {parseFloat(row.estimated_cost_annual || 0).toLocaleString()}
                          </td>
                        </>
                      )}
                      {activeFilter === 'portfolio' && (
                        <>
                          <td className="py-3 px-6 font-bold text-sm text-gray-900">{row.name}</td>
                          <td className="py-3 px-4 font-medium text-gray-700">{row.vendor}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">{row.deployment_type || 'Unknown'}</td>
                        </>
                      )}
                      {activeFilter === 'subscriptions' && (
                        <>
                          <td className="py-3 px-6 font-bold text-sm text-gray-900">{row.name}</td>
                          <td className="py-3 px-4 font-medium text-gray-700">{row.user?.email || 'Unassigned'}</td>
                          <td className="py-3 px-4 text-xs font-medium text-gray-600">{row.owningDept || row.owning_dept || 'Unknown'}</td>
                          <td className="py-3 px-4 text-right font-black text-gray-800">
                            ZAR {parseFloat(row.price || row.monthly_cost || 0).toLocaleString()}
                          </td>
                        </>
                      )}
                      {activeFilter === 'escalations' && (
                        <>
                          <td className="py-3 px-6 text-xs font-bold text-gray-500">{row.timestamp}</td>
                          <td className="py-3 px-4 font-bold text-sm text-blue-600">{row.operator}</td>
                          <td className="py-3 px-6 text-sm font-medium text-gray-800">{row.action}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-bold text-sm">
                        No data available for this metric.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      
      {/* 3. ANALYTICS CHARTS */}
      {(showUsage || showCategory) && (
        <div className={`grid grid-cols-1 ${chartsGridCols} gap-6 items-stretch ${activeFilter ? 'opacity-50 pointer-events-none filter blur-[1px] transition-all' : 'transition-all'}`}>
          {showUsage && (
            <div className="flex flex-col h-full min-h-[450px] w-full animate-in fade-in duration-300">
              <WeeklyUsageChart systemFilter={biSystemFilter} deptFilter={biDeptFilter} onSaveReport={onSaveReport} />
            </div>
          )}
          {showCategory && (
            <div className="flex flex-col h-full min-h-[450px] w-full animate-in fade-in duration-300">
              <CategoryUsageChart systemFilter={biSystemFilter} deptFilter={biDeptFilter} onNavigateToRecommendations={onNavigateToRecommendations} />
            </div>
          )}
        </div>
      )}

    </div>
  );
};