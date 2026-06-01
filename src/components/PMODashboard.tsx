import React, { useState, useEffect, useMemo } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  FileText, CheckCircle2, Clock, AlertCircle, 
  DollarSign, Briefcase, Activity, GitBranch, RefreshCw, ChevronRight, Loader2, XCircle
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PMODashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  
  // NEW: State to track which metric filter is active
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // REAL DATA PIPELINE: Fetching from PMO Projects Table
  const fetchPipeline = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/projects/pipeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPipelineData(data);
      }
    } catch (err) {
      console.error("Failed to fetch PMO Pipeline data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  // ----------------------------------------------------------------
  // MEMOIZED COMPUTATIONS & FILTERING
  // ----------------------------------------------------------------
  
  // 1. Calculate raw numbers for the cards
  const fundedProjects = useMemo(() => pipelineData.filter(p => p.status === 'Funded'), [pipelineData]);
  const awaitingFunding = useMemo(() => pipelineData.filter(p => p.status === 'Awaiting Funding'), [pipelineData]);
  const initiatives = useMemo(() => pipelineData.filter(p => p.status === 'Initiative'), [pipelineData]);
  
  const totalAllocated = useMemo(() => fundedProjects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0), [fundedProjects]);

  // 2. Filter the data table based on the activeFilter state
  const displayedPipeline = useMemo(() => {
    if (!activeFilter) return pipelineData;
    return pipelineData.filter(p => p.status === activeFilter);
  }, [pipelineData, activeFilter]);

  // ----------------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------------

  // Toggles the active filter state when a metric card is clicked
  const handleFilterToggle = (filterType: string) => {
    setActiveFilter(prev => prev === filterType ? null : filterType);
  };

  // TARGETED ESCALATION LOGIC: Sends a specific project alert to the CIO via usage_logs
  const handleEscalate = async (projectId: string, projectName: string) => {
    setEscalatingId(projectId);
    const token = localStorage.getItem('appManagerToken');
    try {
      const res = await fetch(`${API_URL}/api/pmo/escalate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          project_id: projectId, 
          reason: `Funding Bottleneck for ${projectName}. Requires executive unblocking.` 
        })
      });
      
      if (res.ok) {
        alert(`⚠️ Project ${projectId} escalated to CIO. It is now logged for Executive Review.`);
      } else {
        const err = await res.json();
        alert(`Escalation failed: ${err.error}`);
      }
    } catch (err) {
      console.error("Escalation failed", err);
    } finally {
      setEscalatingId(null);
    }
  };

  // ----------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Funded': return 'bg-green-100 text-green-700 border-green-200';
      case 'Awaiting Funding': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Initiative': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Helper function to render a clickable metric card with conditional active styling
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

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4 max-w-[1600px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Briefcase className="h-6 w-6 mr-2 text-blue-600" />
            PMO Project Register
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Tracking IMU initiatives from demand to execution</p>
        </div>
        <div className="flex gap-3">
          {activeFilter && (
            <Button variant="ghost" onClick={() => setActiveFilter(null)} className="text-gray-500 text-xs font-bold hover:bg-gray-100">
              Clear Filters
            </Button>
          )}
          <Button 
            onClick={fetchPipeline} 
            disabled={isRefreshing}
            variant="outline" 
            className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Syncing Register...' : 'Refresh Pipeline'}
          </Button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
        <InteractiveMetricCard 
          icon={<FileText className="h-5 w-5" />} 
          title="Active Register" 
          value={pipelineData.length.toString()} 
          subtitle="Total projects in pipeline" 
          filterKey={null}
        />
        <InteractiveMetricCard 
          icon={<GitBranch className="h-5 w-5 text-blue-500" />} 
          title="New Initiatives" 
          value={initiatives.length.toString()} 
          subtitle={<span className="text-blue-600 font-bold text-[10px]">Awaiting EA & Scoping</span>} 
          filterKey="Initiative"
        />
        <InteractiveMetricCard 
          icon={<Clock className="h-5 w-5 text-orange-500" />} 
          title="Awaiting Funding" 
          value={awaitingFunding.length.toString()} 
          subtitle={<span className="text-orange-600 font-bold text-[10px]">Blocked by Budget</span>} 
          filterKey="Awaiting Funding"
        />
        <div className="h-full">
          {/* We don't filter by cost, so we don't wrap this one in the interactive component */}
          <MetricCard 
            icon={<DollarSign className="h-5 w-5 text-green-500" />} 
            title="Capital Allocated" 
            value={`ZAR ${(totalAllocated / 1000000).toFixed(1)}M`} 
            subtitle={<span className="text-green-600 font-bold text-[10px]">For {fundedProjects.length} Execution Projects</span>} 
          />
        </div>
      </div>

      {/* SPLIT PANE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* MAIN PIPELINE TABLE */}
        <Card className="xl:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Project Pipeline Status {activeFilter && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Filtered View</span>}
            </h3>
            <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">FY 2026</span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                  <th className="py-3 px-4 font-bold">Project Ref / Name</th>
                  <th className="py-3 px-4 font-bold">Requesting Dept</th>
                  <th className="py-3 px-4 font-bold">Gate Status</th>
                  <th className="py-3 px-4 font-bold">Current Stage</th>
                  <th className="py-3 px-4 font-bold text-right">Est. Capex (ZAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedPipeline.map((proj) => (
                  <tr key={proj.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <td className="py-3 px-4">
                      <p className="text-[9px] text-gray-400 font-bold mb-0.5 uppercase tracking-widest">{proj.id}</p>
                      <p className="font-bold text-sm text-blue-900 group-hover:text-blue-700">{proj.project_name || 'Unnamed Project'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 shadow-sm whitespace-nowrap">
                        {proj.department || 'Unassigned Dept'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`border px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${getStatusColor(proj.status)}`}>
                        {proj.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-xs font-bold text-gray-600 whitespace-nowrap">
                        {proj.status === 'Funded' && <CheckCircle2 className="h-3 w-3 text-green-500 mr-1.5" />}
                        {proj.status === 'Awaiting Funding' && <AlertCircle className="h-3 w-3 text-orange-500 mr-1.5" />}
                        {proj.status === 'Initiative' && <Clock className="h-3 w-3 text-blue-500 mr-1.5" />}
                        {proj.stage || 'Initial Review'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-black text-gray-800 whitespace-nowrap">
                        {parseFloat(proj.budget) > 0 ? parseFloat(proj.budget).toLocaleString() : 'TBD'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedPipeline.length === 0 && (
              <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                <Briefcase className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-bold text-gray-500">No projects match this filter.</p>
              </div>
            )}
          </div>
        </Card>

        {/* SIDEBAR: FUNDING BOTTLENECKS */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-orange-50/50 shrink-0">
            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
              Funding Bottlenecks
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/30">
            {awaitingFunding.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-70">
                <CheckCircle2 className="h-10 w-10 mb-3 text-green-300" />
                <p className="text-sm font-bold text-gray-500">No Execution Blockers</p>
                <p className="text-[10px] mt-1 max-w-[200px]">All registered projects are either fully funded or in the initial scoping phase.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {awaitingFunding.map(proj => (
                  <div key={`alert-${proj.id}`} className="bg-white border border-orange-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm font-bold text-gray-900 pr-2 leading-tight">{proj.project_name || 'Unnamed Project'}</p>
                      <p className="text-[10px] font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-200 whitespace-nowrap shadow-inner">
                        ZAR {parseFloat(proj.budget || 0).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Blocked Department</span>
                        <p className="text-[10px] text-gray-700 flex items-center font-bold">
                          <ChevronRight className="h-3 w-3 mr-0.5 text-orange-500" /> {proj.department || 'Unassigned'}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => handleEscalate(proj.id, proj.project_name || 'Unnamed Project')}
                        disabled={escalatingId === proj.id}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold h-8 px-4 shadow-sm transition-transform active:scale-95"
                      >
                        {escalatingId === proj.id ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin"/> ESCALATING</> : 'ESCALATE'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};