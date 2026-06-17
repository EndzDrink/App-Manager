import React, { useState, useEffect, useMemo } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Activity, Server, AlertTriangle, CheckCircle2, 
  Zap, Clock, ShieldAlert, ArrowUpRight, RefreshCw, XCircle, KeyRound, PlayCircle
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AppsDashboardProps {
  systems: any[];
}

export const AppsDashboard: React.FC<AppsDashboardProps> = ({ systems }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // NEW: State for the Provisioning Queue
  const [pendingIntegration, setPendingIntegration] = useState<any[]>([]);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter for subscriptions that Networks has secured, but Apps hasn't integrated yet
        setPendingIntegration(data.filter((sub: any) => sub.network_status === 'Secured' && sub.integration_status === 'Pending'));
      }
    } catch (err) {
      console.error("Failed to fetch integration queue");
    }
  };

  const fetchTelemetry = () => {
    setIsRefreshing(true);
    fetchSubscriptions(); // Fetch the queue alongside the telemetry
    setTimeout(() => {
      const enrichedData = systems.map(sys => {
        const randomSeed = Math.random();
        let status = 'Operational';
        let latency = Math.floor(Math.random() * 150) + 20; 
        let uptime = 99.9;

        if (randomSeed > 0.85 && randomSeed <= 0.95) {
          status = 'Degraded';
          latency = Math.floor(Math.random() * 800) + 300; 
          uptime = 98.4;
        } else if (randomSeed > 0.95) {
          status = 'Down';
          latency = 0;
          uptime = 92.1;
        }

        return { ...sys, status, latency, uptime, requests: Math.floor(Math.random() * 50000) + 1000 };
      }).sort((a, b) => {
        if (a.status === 'Down') return -1;
        if (b.status === 'Down') return 1;
        if (a.status === 'Degraded') return -1;
        if (b.status === 'Degraded') return 1;
        return 0;
      });

      setHealthData(enrichedData);
      setIsRefreshing(false);
    }, 800);
  };

  useEffect(() => {
    if (systems.length > 0) fetchTelemetry();
  }, [systems]);

  // --- NEW: ACTION HANDLER FOR APPS PROVISIONING ---
  const handleIntegrationClearance = async (id: number) => {
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/provisioning/integration/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from local queue instantly for snappy UI
        setPendingIntegration(prev => prev.filter(sub => sub.id !== id));
      }
    } catch (err) {
      console.error("Failed to process integration");
    }
  };

  // ----------------------------------------------------------------
  // MEMOIZED COMPUTATIONS & FILTERING
  // ----------------------------------------------------------------
  const downSystems = useMemo(() => healthData.filter(s => s.status === 'Down').length, [healthData]);
  const degradedSystems = useMemo(() => healthData.filter(s => s.status === 'Degraded').length, [healthData]);
  const avgLatency = useMemo(() => healthData.length ? Math.floor(healthData.reduce((acc, curr) => acc + curr.latency, 0) / healthData.filter(s => s.status !== 'Down').length) : 0, [healthData]);
  
  const displayedHealthData = useMemo(() => {
    if (!activeFilter) return healthData;
    if (activeFilter === 'incidents') return healthData.filter(s => s.status === 'Down' || s.status === 'Degraded');
    return healthData;
  }, [healthData, activeFilter]);

  const handleFilterToggle = (filterType: string) => {
    setActiveFilter(prev => prev === filterType ? null : filterType);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Operational': return <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Operational</span>;
      case 'Degraded': return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> Degraded</span>;
      case 'Down': return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center shadow-sm animate-pulse"><ShieldAlert className="h-3 w-3 mr-1"/> Down</span>;
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
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Performance & Integration Telemetry
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Live application health monitoring and integration provisioning</p>
        </div>
        <div className="flex gap-3">
          {activeFilter && (
            <Button variant="ghost" onClick={() => setActiveFilter(null)} className="text-gray-500 text-xs font-bold hover:bg-gray-100">
              Clear Filters
            </Button>
          )}
          <Button onClick={fetchTelemetry} disabled={isRefreshing} variant="outline" className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Pinging APIs...' : 'Refresh Telemetry'}
          </Button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
        <InteractiveMetricCard icon={<Server className="h-5 w-5" />} title="Monitored Apps" value={healthData.length.toString()} subtitle="Registered in Catalog" filterKey={null} />
        <InteractiveMetricCard icon={<AlertTriangle className={`h-5 w-5 ${(downSystems > 0 || degradedSystems > 0) ? 'text-red-500' : 'text-gray-400'}`} />} title="Active Incidents" value={downSystems > 0 || degradedSystems > 0 ? (downSystems + degradedSystems).toString() : "0"} subtitle={<div className="flex gap-2 text-[10px] font-bold mt-1.5"><span className={downSystems > 0 ? "text-red-600" : "text-gray-400"}>{downSystems} Down</span>|<span className={degradedSystems > 0 ? "text-orange-600" : "text-gray-400"}>{degradedSystems} Degraded</span></div>} filterKey="incidents" />
        <div className="h-full"><MetricCard icon={<Zap className={`h-5 w-5 ${avgLatency > 500 ? 'text-red-500' : 'text-yellow-500'}`} />} title="Avg API Latency" value={`${avgLatency}ms`} subtitle={<span className={avgLatency > 500 ? 'text-red-500 font-bold text-[10px]' : 'text-green-600 font-bold text-[10px]'}>{avgLatency > 500 ? 'Poor Performance' : 'Optimal'}</span>} /></div>
        <div className="h-full"><MetricCard icon={<Activity className="h-5 w-5 text-blue-500" />} title="Traffic (24h)" value="1.4M" subtitle={<span className="flex items-center text-green-600 font-bold text-[10px]"><ArrowUpRight className="h-3 w-3 mr-1"/> 12% vs Yesterday</span>} /></div>
      </div>

      {/* NEW: PENDING INTEGRATION QUEUE */}
      {pendingIntegration.length > 0 && (
        <Card className="bg-white border border-purple-200 shadow-sm mb-6 shrink-0 overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-4 border-b border-purple-100 bg-purple-50/80 flex justify-between items-center">
            <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider flex items-center">
              <Server className="h-4 w-4 mr-2 text-purple-600" />
              Pending Integration & Rollout
            </h3>
            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingIntegration.length} Items</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingIntegration.map(sub => (
              <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{sub.name} <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{sub.category}</span></h4>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Network Secured • Awaiting SSO Federation & UAT</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleIntegrationClearance(sub.id)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 shadow-sm">
                    <KeyRound className="h-3 w-3 mr-2" /> Federate SSO
                  </Button>
                  <Button onClick={() => handleIntegrationClearance(sub.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-8 shadow-sm">
                    <PlayCircle className="h-3 w-3 mr-2" /> Sign-off Go-Live
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* LEFT COLUMN: System Health Matrix */}
        <Card className="xl:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Server className="h-4 w-4 mr-2 text-blue-800" />
              System Health Matrix {activeFilter && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Filtered View</span>}
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                  <th className="py-3 px-6 font-bold">System Name</th>
                  <th className="py-3 px-4 font-bold">Architecture</th>
                  <th className="py-3 px-4 font-bold">Current Status</th>
                  <th className="py-3 px-4 font-bold">Response Time</th>
                  <th className="py-3 px-6 font-bold text-right">Uptime (30d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedHealthData.map((sys) => (
                  <tr key={sys.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-3 px-6">
                      <p className="font-bold text-sm text-gray-900 group-hover:text-blue-800">{sys.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase flex items-center mt-0.5">{sys.category}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 shadow-sm whitespace-nowrap">
                        {sys.deployment_type || 'External SaaS'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(sys.status)}</td>
                    <td className="py-3 px-4">
                      {sys.status === 'Down' ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Timeout</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black ${sys.latency > 500 ? 'text-orange-600' : 'text-gray-700'}`}>{sys.latency}ms</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden shadow-inner border border-gray-200">
                            <div className={`h-full rounded-full transition-all duration-1000 ${sys.latency > 500 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min((sys.latency / 1000) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`text-sm font-black ${sys.uptime < 99.0 ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200' : 'text-gray-800'}`}>{sys.uptime}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedHealthData.length === 0 && (
              <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-20 text-green-500" />
                <p className="text-sm font-bold text-gray-500">All systems operational.</p>
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT COLUMN: Active Alerts */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-red-50/50 shrink-0">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Active Alerts Log
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/30 flex flex-col">
            <div className="flex-1 space-y-3">
              {downSystems === 0 && degradedSystems === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10 opacity-70">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
                  <p className="text-sm font-bold text-gray-500">All Systems Nominal</p>
                  <p className="text-[10px] mt-1 max-w-[200px]">No active incidents or degradation detected at this time.</p>
                </div>
              ) : (
                healthData.filter(s => s.status !== 'Operational').map(sys => (
                  <div key={`alert-${sys.id}`} className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${sys.status === 'Down' ? 'bg-white border-red-200' : 'bg-white border-orange-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-bold text-sm ${sys.status === 'Down' ? 'text-red-900' : 'text-orange-900'}`}>{sys.name}</span>
                      <span className="text-[9px] text-gray-400 flex items-center uppercase font-black tracking-widest bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        <Clock className="h-3 w-3 mr-1" /> Just now
                      </span>
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${sys.status === 'Down' ? 'text-red-700' : 'text-orange-700'}`}>
                      {sys.status === 'Down' ? 'API connection timeout. Attempting to restart service and reroute traffic.' : `High latency detected (${sys.latency}ms). Scaling up edge resources.`}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 shrink-0">
              <Button className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-sm h-10 transition-transform active:scale-95">
                View Full Incident History
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};