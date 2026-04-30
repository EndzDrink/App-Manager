import React, { useState, useEffect } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Users, Activity, CheckCircle2, Clock, XCircle, 
  BarChart3, TrendingUp, RefreshCw, ChevronRight, Fingerprint
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const CRMDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [demandData, setDemandData] = useState<any[]>([]);

  // REAL DATA PIPELINE: Fetching city-wide requests from Neon DB
  const fetchDemand = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDemandData(data);
      }
    } catch (err) {
      console.error("Failed to fetch CRM Demand data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDemand();
  }, []);

  const totalRequests = demandData.length;
  const pendingEA = demandData.filter(d => d.status === 'Awaiting EA Vetting').length;
  const pendingPMO = demandData.filter(d => d.status === 'Awaiting PMO Funding').length;
  const approvedCount = demandData.filter(d => ['Awaiting PMO Funding', 'Funded & Active'].includes(d.status)).length;
  
  const approvalRate = totalRequests > 0 ? Math.round((approvedCount / (totalRequests - pendingEA)) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Approved': 
      case 'Funded & Active': return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><CheckCircle2 className="h-3 w-3 mr-1"/> Approved</span>;
      case 'Awaiting PMO Funding': return <span className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Activity className="h-3 w-3 mr-1"/> Pending PMO</span>;
      case 'Awaiting EA Vetting': return <span className="bg-yellow-100 text-yellow-700 border-yellow-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Clock className="h-3 w-3 mr-1"/> Pending EA</span>;
      case 'Vetoed': 
      case 'Rejected': return <span className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><XCircle className="h-3 w-3 mr-1"/> Vetoed</span>;
      default: return <span className="bg-gray-100 text-gray-700 border-gray-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max">{status}</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            CRM Demand Hub
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">City-wide system request velocity and bottleneck tracking</p>
        </div>
        <Button 
          onClick={fetchDemand} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Syncing DB...' : 'Refresh Velocity'}
        </Button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          icon={<BarChart3 className="h-5 w-5" />} 
          title="Total Demand" 
          value={totalRequests.toString()} 
          subtitle="Requests logged to date" 
        />
        <MetricCard 
          icon={<Clock className="h-5 w-5 text-yellow-500" />} 
          title="Vetting Queue" 
          value={pendingEA.toString()} 
          subtitle={<span className="text-yellow-600 font-bold text-[10px]">Awaiting EA Architecture check</span>} 
        />
        <MetricCard 
          icon={<Activity className="h-5 w-5 text-blue-500" />} 
          title="Funding Queue" 
          value={pendingPMO.toString()} 
          subtitle={<span className="text-blue-600 font-bold text-[10px]">Approved by EA, stalled in PMO</span>} 
        />
        <MetricCard 
          icon={<TrendingUp className="h-5 w-5 text-green-500" />} 
          title="EA Approval Rate" 
          value={`${approvalRate || 0}%`} 
          subtitle={<span className="text-green-600 font-bold text-[10px]">Alignment with Municipal OS</span>} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* MAIN DEMAND TABLE */}
        <Card className="xl:col-span-2 p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              City-Wide Request Pipeline
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-bold">Request Details</th>
                  <th className="pb-3 font-bold">Department</th>
                  <th className="pb-3 font-bold">Current Status</th>
                  <th className="pb-3 font-bold">Time in Stage</th>
                  <th className="pb-3 font-bold text-right">Alignment Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demandData.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 pr-4">
                      <p className="text-[9px] text-gray-400 font-bold mb-0.5">REQ-{req.id}</p>
                      <p className="font-bold text-sm text-blue-900">{req.system}</p>
                      <p className="text-[10px] text-gray-500 flex items-center mt-1">
                        <Users className="h-3 w-3 mr-1" /> CRM: {req.requester}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {req.dept}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold ${req.timeInStage && req.timeInStage.includes('14') ? 'text-red-600 flex items-center' : 'text-gray-600'}`}>
                        {req.timeInStage && req.timeInStage.includes('14') && <XCircle className="h-3 w-3 mr-1" />}
                        {req.timeInStage || 'Just now'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {req.score > 0 ? (
                        <div className="inline-flex flex-col items-end">
                          <span className={`text-sm font-bold ${req.score > 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {req.score}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-medium">Pending Vetting</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {demandData.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">No requests have been logged yet.</div>
            )}
          </div>
        </Card>

        {/* SIDEBAR: STALLED REQUESTS */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-red-500" />
              SLA Warnings (Stalled)
            </h3>
            
            <div className="space-y-3 flex-1">
              {demandData.filter(d => d.timeInStage && d.timeInStage.includes('14')).length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <p className="text-xs font-bold text-gray-500">Service Levels Maintained</p>
                </div>
              ) : (
                demandData.filter(d => d.timeInStage && (d.timeInStage.includes('14') || d.timeInStage.includes('5'))).map(req => (
                  <div key={`stalled-${req.id}`} className="bg-red-50 border border-red-100 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-red-900 truncate pr-2">{req.system}</p>
                    </div>
                    <p className="text-[10px] text-red-700 flex items-center mt-1 font-medium">
                      <Fingerprint className="h-3 w-3 mr-1" /> CRM: {req.requester}
                    </p>
                    <p className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded w-max mt-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> Stalled for {req.timeInStage} in {req.status === 'Awaiting PMO Funding' ? 'PMO' : 'EA'}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <Button className="w-full mt-4 bg-white border border-gray-200 text-blue-900 hover:bg-gray-50 text-xs font-bold shadow-sm disabled:opacity-50">
              Notify Department Head
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
};