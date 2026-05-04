import React, { useState, useEffect } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  FileText, CheckCircle2, Clock, AlertCircle, 
  DollarSign, Briefcase, Activity, GitBranch, RefreshCw, ChevronRight
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PMODashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pipelineData, setPipelineData] = useState<any[]>([]);

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

  // ESCALATION LOGIC: Sends a targeted alert to the CIO via usage_logs
  const handleEscalate = async () => {
    const token = localStorage.getItem('appManagerToken');
    try {
      const res = await fetch(`${API_URL}/api/pmo/escalate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          project_id: 'GLOBAL-PIPELINE', 
          reason: 'Funding Bottleneck impacting multiple departments' 
        })
      });
      
      if (res.ok) {
        alert("⚠️ Escalated to CIO. This bottleneck is now logged for Executive Review on the CIO Dashboard.");
      } else {
        const err = await res.json();
        alert(`Escalation failed: ${err.error}`);
      }
    } catch (err) {
      console.error("Escalation failed", err);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fundedProjects = pipelineData.filter(p => p.status === 'Funded');
  const awaitingFunding = pipelineData.filter(p => p.status === 'Awaiting Funding');
  const initiatives = pipelineData.filter(p => p.status === 'Initiative');
  
  const totalAllocated = fundedProjects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Funded': return 'bg-green-100 text-green-700 border-green-200';
      case 'Awaiting Funding': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Initiative': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Briefcase className="h-6 w-6 mr-2 text-blue-600" />
            PMO Project Register
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Tracking IMU initiatives from demand to execution</p>
        </div>
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

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          icon={<FileText className="h-5 w-5" />} 
          title="Active Register" 
          value={pipelineData.length.toString()} 
          subtitle="Total projects in pipeline" 
        />
        <MetricCard 
          icon={<GitBranch className="h-5 w-5 text-blue-500" />} 
          title="New Initiatives" 
          value={initiatives.length.toString()} 
          subtitle={<span className="text-blue-600 font-bold text-[10px]">Awaiting EA & Scoping</span>} 
        />
        <MetricCard 
          icon={<Clock className="h-5 w-5 text-orange-500" />} 
          title="Awaiting Funding" 
          value={awaitingFunding.length.toString()} 
          subtitle={<span className="text-orange-600 font-bold text-[10px]">Blocked by Budget</span>} 
        />
        <MetricCard 
          icon={<DollarSign className="h-5 w-5 text-green-500" />} 
          title="Capital Allocated" 
          value={`ZAR ${(totalAllocated / 1000000).toFixed(1)}M`} 
          subtitle={<span className="text-green-600 font-bold text-[10px]">For {fundedProjects.length} Execution Projects</span>} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* MAIN PIPELINE TABLE */}
        <Card className="xl:col-span-2 p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Project Pipeline Status
            </h3>
            <span className="text-xs font-bold text-gray-400">FY 2026</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-bold">Project Ref / Name</th>
                  <th className="pb-3 font-bold">Requesting Dept</th>
                  <th className="pb-3 font-bold">Gate Status</th>
                  <th className="pb-3 font-bold">Current Stage</th>
                  <th className="pb-3 font-bold text-right">Est. Capex (ZAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pipelineData.map((proj) => (
                  <tr key={proj.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                    <td className="py-3 pr-4">
                      <p className="text-[9px] text-gray-400 font-bold mb-0.5">{proj.id}</p>
                      {/* INJECTED FALLBACK USING project_name */}
                      <p className="font-bold text-sm text-blue-900 group-hover:text-blue-700">{proj.project_name || 'Unnamed Project'}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {proj.department || 'Unassigned Dept'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`border px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(proj.status)}`}>
                        {proj.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center text-xs font-bold text-gray-600">
                        {proj.status === 'Funded' && <CheckCircle2 className="h-3 w-3 text-green-500 mr-1.5" />}
                        {proj.status === 'Awaiting Funding' && <AlertCircle className="h-3 w-3 text-orange-500 mr-1.5" />}
                        {proj.status === 'Initiative' && <Clock className="h-3 w-3 text-blue-500 mr-1.5" />}
                        {proj.stage || 'Initial Review'}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {parseFloat(proj.budget) > 0 ? parseFloat(proj.budget).toLocaleString() : 'TBD'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pipelineData.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">No projects currently in the pipeline.</div>
            )}
          </div>
        </Card>

        {/* SIDEBAR: FUNDING BOTTLENECKS */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
              Funding Bottlenecks
            </h3>
            
            <div className="space-y-3 flex-1">
              {awaitingFunding.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <p className="text-xs font-bold text-gray-500">No Funding Bottlenecks</p>
                </div>
              ) : (
                awaitingFunding.map(proj => (
                  <div key={`alert-${proj.id}`} className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-orange-900 truncate pr-2">{proj.project_name || 'Unnamed Project'}</p>
                      <p className="text-[10px] font-bold text-orange-700 bg-orange-200 px-1.5 py-0.5 rounded">ZAR {parseFloat(proj.budget || 0).toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-orange-700 flex items-center mt-2 font-medium">
                      <ChevronRight className="h-3 w-3 mr-0.5" /> Blocked at: {proj.department || 'Unassigned Dept'} Deputy Director
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <Button 
              onClick={handleEscalate}
              className="w-full mt-4 bg-red-600 text-white hover:bg-red-700 text-xs font-bold shadow-sm disabled:opacity-50"
            >
              Escalate to CIO
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
};