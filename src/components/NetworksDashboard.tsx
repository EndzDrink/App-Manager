import React, { useState, useEffect, useMemo } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Network, Wifi, Activity, AlertTriangle, 
  ArrowDownUp, Server, ShieldCheck, RefreshCw, Zap, XCircle, CheckCircle2, Lock
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface NetworksDashboardProps {
  systems: any[];
}

export const NetworksDashboard: React.FC<NetworksDashboardProps> = ({ systems }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // NEW: State for the Provisioning Queue
  const [pendingProvisioning, setPendingProvisioning] = useState<any[]>([]);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter for subscriptions that PMO just funded but Networks hasn't secured yet
        setPendingProvisioning(data.filter((sub: any) => sub.network_status === 'Pending'));
      }
    } catch (err) {
      console.error("Failed to fetch provisioning queue");
    }
  };

  const fetchNetworkStats = () => {
    setIsRefreshing(true);
    fetchSubscriptions(); // Fetch the queue alongside the telemetry
    setTimeout(() => {
      const enrichedData = systems.map(sys => {
        const randomSeed = Math.random();
        let bandwidth = Math.floor(Math.random() * 800) + 50; 
        let latency = Math.floor(Math.random() * 40) + 5; 
        let endpoints = Math.floor(Math.random() * 5000) + 100;
        let status = 'Nominal';

        if (sys.deployment_type === 'External SaaS' || !sys.deployment_type) {
          latency += Math.floor(Math.random() * 60) + 20; 
          bandwidth = Math.floor(Math.random() * 1500) + 200; 
        }

        if (randomSeed > 0.90) {
          status = 'High Load';
          bandwidth *= 3; 
          latency += 150;
        } else if (randomSeed > 0.97) {
          status = 'Critical Bottleneck';
          bandwidth *= 5;
          latency += 400;
        }

        return { ...sys, bandwidth, latency, endpoints, status };
      }).sort((a, b) => b.bandwidth - a.bandwidth); 

      setNetworkData(enrichedData);
      setIsRefreshing(false);
    }, 700);
  };

  useEffect(() => {
    if (systems.length > 0) fetchNetworkStats();
  }, [systems]);

  // --- NEW: ACTION HANDLER FOR NETWORKS PROVISIONING ---
  const handleNetworkClearance = async (id: number) => {
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/provisioning/network/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from local queue instantly for snappy UI
        setPendingProvisioning(prev => prev.filter(sub => sub.id !== id));
      }
    } catch (err) {
      console.error("Failed to provision network");
    }
  };

  // ----------------------------------------------------------------
  // MEMOIZED COMPUTATIONS & FILTERING
  // ----------------------------------------------------------------
  const totalBandwidth = useMemo(() => networkData.reduce((acc, curr) => acc + curr.bandwidth, 0) / 1000, [networkData]);
  const criticalNodes = useMemo(() => networkData.filter(s => s.status === 'Critical Bottleneck').length, [networkData]);
  const highLoadNodes = useMemo(() => networkData.filter(s => s.status === 'High Load').length, [networkData]);
  const totalEndpoints = useMemo(() => networkData.reduce((acc, curr) => acc + curr.endpoints, 0), [networkData]);
  
  const displayedNetworkData = useMemo(() => {
    if (!activeFilter) return networkData;
    if (activeFilter === 'anomalies') return networkData.filter(s => s.status === 'Critical Bottleneck' || s.status === 'High Load');
    return networkData;
  }, [networkData, activeFilter]);

  const handleFilterToggle = (filterType: string) => {
    setActiveFilter(prev => prev === filterType ? null : filterType);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Nominal': return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><ShieldCheck className="h-3 w-3 mr-1"/> Stable</span>;
      case 'High Load': return <span className="bg-orange-100 text-orange-700 border-orange-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Activity className="h-3 w-3 mr-1"/> High Load</span>;
      case 'Critical Bottleneck': return <span className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max animate-pulse"><AlertTriangle className="h-3 w-3 mr-1"/> Bottleneck</span>;
      default: return null;
    }
  };

  const InteractiveMetricCard = ({ title, value, subtitle, icon, filterKey }: any) => {
    const isActive = activeFilter === filterKey;
    return (
      <div 
        onClick={() => filterKey && handleFilterToggle(filterKey)}
        className={`cursor-pointer transition-all duration-200 h-full ${isActive ? 'ring-2 ring-blue-500 scale-[1.02] shadow-md z-10 relative rounded-xl' : 'hover:scale-[1.01] hover:shadow-sm'}`}
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
            <Network className="h-6 w-6 mr-2 text-blue-600" />
            Network Topology & Infrastructure
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Real-time bandwidth utilization, provisioning, and infrastructure health</p>
        </div>
        <div className="flex gap-3">
          {activeFilter && (
            <Button variant="ghost" onClick={() => setActiveFilter(null)} className="text-gray-500 text-xs font-bold hover:bg-gray-100">
              Clear Filters
            </Button>
          )}
          <Button onClick={fetchNetworkStats} disabled={isRefreshing} variant="outline" className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Scanning...' : 'Refresh Topology'}
          </Button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
        <InteractiveMetricCard icon={<ArrowDownUp className="h-5 w-5 text-blue-500" />} title="Total Throughput" value={`${totalBandwidth.toFixed(2)} Gbps`} subtitle="Combined system payload" filterKey={null} />
        <InteractiveMetricCard icon={<AlertTriangle className={`h-5 w-5 ${(criticalNodes > 0 || highLoadNodes > 0) ? 'text-red-500' : 'text-gray-400'}`} />} title="Congestion Alerts" value={(criticalNodes + highLoadNodes).toString()} subtitle={<div className="flex gap-2 text-[10px] font-bold mt-1.5"><span className={criticalNodes > 0 ? "text-red-600" : "text-gray-400"}>{criticalNodes} Critical</span>|<span className={highLoadNodes > 0 ? "text-orange-600" : "text-gray-400"}>{highLoadNodes} High</span></div>} filterKey="anomalies" />
        <div className="h-full"><MetricCard icon={<Wifi className="h-5 w-5 text-green-500" />} title="Active Endpoints" value={(totalEndpoints / 1000).toFixed(1) + "k"} subtitle={<span className="text-gray-500 font-bold text-[10px]">Connected municipal devices</span>} /></div>
        <div className="h-full"><MetricCard icon={<Zap className="h-5 w-5 text-yellow-500" />} title="Avg Edge Latency" value="42ms" subtitle={<span className="text-green-600 font-bold text-[10px]">Within strict SLA</span>} /></div>
      </div>

      {/* NEW: PENDING PROVISIONING QUEUE */}
      {pendingProvisioning.length > 0 && (
        <Card className="bg-white border border-blue-200 shadow-sm mb-6 shrink-0 overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-4 border-b border-blue-100 bg-blue-50/80 flex justify-between items-center">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
              Pending Infrastructure Provisioning
            </h3>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingProvisioning.length} Items</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingProvisioning.map(sub => (
              <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{sub.name} <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{sub.category}</span></h4>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Funded by PMO • Awaiting Network Security Clearance</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleNetworkClearance(sub.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-8 shadow-sm">
                    <Lock className="h-3 w-3 mr-2" /> Whitelist & Secure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* MAIN BANDWIDTH TABLE */}
        <Card className="xl:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Bandwidth Utilization Matrix {activeFilter && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Filtered View</span>}
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                  <th className="py-3 px-6 font-bold">System Name</th>
                  <th className="py-3 px-4 font-bold">Topology Node</th>
                  <th className="py-3 px-4 font-bold">Health Status</th>
                  <th className="py-3 px-4 font-bold">Payload (Mbps)</th>
                  <th className="py-3 px-6 font-bold text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedNetworkData.map((sys) => (
                  <tr key={sys.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-3 px-6">
                      <p className="font-bold text-sm text-gray-900 group-hover:text-blue-800">{sys.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase flex items-center mt-0.5">
                         {sys.deployment_type === 'Internal Build' ? <Server className="h-3 w-3 mr-1 text-sky-500"/> : <Wifi className="h-3 w-3 mr-1 text-sky-500"/>}
                         {sys.vendor}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap border ${sys.deployment_type === 'Internal Build' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {sys.deployment_type || 'External Cloud'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(sys.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black ${sys.bandwidth > 1500 ? 'text-red-600' : sys.bandwidth > 800 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {sys.bandwidth.toLocaleString()} Mbps
                        </span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden shadow-inner border border-gray-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${sys.bandwidth > 1500 ? 'bg-red-500' : sys.bandwidth > 800 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min((sys.bandwidth / 3000) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`text-sm font-black ${sys.latency > 200 ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200' : 'text-gray-800'}`}>{sys.latency}ms</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedNetworkData.length === 0 && (
              <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                <ShieldCheck className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-bold text-gray-500">No anomalies detected.</p>
              </div>
            )}
          </div>
        </Card>

        {/* SIDEBAR: TOP CONSUMERS */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-blue-50/50 shrink-0">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center">
                <ArrowDownUp className="h-4 w-4 mr-2 text-blue-500" />
                Top Bandwidth Hogs
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/30">
              <div className="space-y-3">
                {networkData.slice(0, 4).map((sys, idx) => (
                  <div key={`hog-${sys.id}`} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-blue-50/50 z-0 border-r border-blue-100" style={{ width: `${100 - (idx * 20)}%` }}></div>
                    <div className="relative z-10 flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-gray-900 truncate pr-2">{idx + 1}. {sys.name}</p>
                      <p className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shadow-inner shrink-0">{(sys.bandwidth / 1000).toFixed(2)} Gbps</p>
                    </div>
                    <p className="relative z-10 text-[9px] text-gray-500 flex items-center font-bold uppercase tracking-widest mt-2">
                       <Wifi className="h-3 w-3 mr-1 text-gray-400" /> {sys.endpoints.toLocaleString()} Connected
                    </p>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-blue-800 hover:bg-blue-900 text-yellow-400 text-xs font-bold shadow-sm h-10 transition-transform active:scale-95">
                Throttle External Traffic
              </Button>
            </div>
        </Card>

      </div>
    </div>
  );
};