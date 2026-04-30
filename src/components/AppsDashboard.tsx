import React, { useState, useEffect } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Activity, Server, AlertTriangle, CheckCircle2, 
  Zap, Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AppsDashboardProps {
  systems: any[];
}

export const AppsDashboard: React.FC<AppsDashboardProps> = ({ systems }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<any[]>([]);

  // Simulate fetching live telemetry data for the systems
  const fetchTelemetry = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const enrichedData = systems.map(sys => {
        // Simulating realistic health metrics
        const randomSeed = Math.random();
        let status = 'Operational';
        let latency = Math.floor(Math.random() * 150) + 20; // 20ms to 170ms
        let uptime = 99.9;

        if (randomSeed > 0.85 && randomSeed <= 0.95) {
          status = 'Degraded';
          latency = Math.floor(Math.random() * 800) + 300; // 300ms to 1100ms
          uptime = 98.4;
        } else if (randomSeed > 0.95) {
          status = 'Down';
          latency = 0;
          uptime = 92.1;
        }

        return { ...sys, status, latency, uptime, requests: Math.floor(Math.random() * 50000) + 1000 };
      }).sort((a, b) => {
        // Sort to put Down/Degraded at the top
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

  const downSystems = healthData.filter(s => s.status === 'Down').length;
  const degradedSystems = healthData.filter(s => s.status === 'Degraded').length;
  const avgLatency = healthData.length ? Math.floor(healthData.reduce((acc, curr) => acc + curr.latency, 0) / healthData.filter(s => s.status !== 'Down').length) : 0;
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Operational': return <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Operational</span>;
      case 'Degraded': return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> Degraded</span>;
      case 'Down': return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center shadow-sm animate-pulse"><ShieldAlert className="h-3 w-3 mr-1"/> Down</span>;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Performance & Uptime Telemetry
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Live application health monitoring for IMU Operations</p>
        </div>
        <Button 
          onClick={fetchTelemetry} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Pinging APIs...' : 'Refresh Telemetry'}
        </Button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          icon={<Server className="h-5 w-5" />} 
          title="Monitored Apps" 
          value={healthData.length.toString()} 
          subtitle="Registered in Catalog" 
        />
        <MetricCard 
          icon={<AlertTriangle className={`h-5 w-5 ${downSystems > 0 ? 'text-red-500' : 'text-gray-400'}`} />} 
          title="Active Incidents" 
          value={downSystems > 0 || degradedSystems > 0 ? (downSystems + degradedSystems).toString() : "0"} 
          subtitle={
            <div className="flex gap-2 text-[10px] font-bold mt-1.5">
              <span className={downSystems > 0 ? "text-red-600" : "text-gray-400"}>{downSystems} Down</span>|
              <span className={degradedSystems > 0 ? "text-orange-600" : "text-gray-400"}>{degradedSystems} Degraded</span>
            </div>
          } 
        />
        <MetricCard 
          icon={<Zap className={`h-5 w-5 ${avgLatency > 500 ? 'text-red-500' : 'text-yellow-500'}`} />} 
          title="Avg API Latency" 
          value={`${avgLatency}ms`} 
          subtitle={<span className={avgLatency > 500 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{avgLatency > 500 ? 'Poor Performance' : 'Optimal'}</span>} 
        />
        <MetricCard 
          icon={<Activity className="h-5 w-5" />} 
          title="Traffic (24h)" 
          value="1.4M" 
          subtitle={<span className="flex items-center text-green-600 font-bold text-[10px]"><ArrowUpRight className="h-3 w-3 mr-1"/> 12% vs Yesterday</span>} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: System Health Matrix */}
        <Card className="lg:col-span-2 p-6 bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center">
            <Server className="h-4 w-4 mr-2 text-blue-800" />
            System Health Matrix
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-bold">System Name</th>
                  <th className="pb-3 font-bold">Architecture</th>
                  <th className="pb-3 font-bold">Current Status</th>
                  <th className="pb-3 font-bold">Response Time</th>
                  <th className="pb-3 font-bold text-right">Uptime (30d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {healthData.map((sys) => (
                  <tr key={sys.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-sm text-gray-900">{sys.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{sys.category}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs font-medium text-gray-600">
                      {sys.deployment_type || 'External SaaS'}
                    </td>
                    <td className="py-3 pr-4">
                      {getStatusBadge(sys.status)}
                    </td>
                    <td className="py-3 pr-4">
                      {sys.status === 'Down' ? (
                        <span className="text-xs text-red-500 font-bold">Timeout</span>
                      ) : (
                        <div className="flex items-center">
                          <span className={`text-xs font-bold w-10 ${sys.latency > 500 ? 'text-orange-600' : 'text-gray-700'}`}>{sys.latency}ms</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full ml-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sys.latency > 500 ? 'bg-orange-500' : 'bg-green-500'}`} 
                              style={{ width: `${Math.min((sys.latency / 1000) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-xs font-bold ${sys.uptime < 99.0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {sys.uptime}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {healthData.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">No telemetry data available. Add systems to the catalog.</div>
            )}
          </div>
        </Card>

        {/* RIGHT COLUMN: Active Alerts */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
            Active Alerts Log
          </h3>
          
          <div className="flex-1 space-y-4">
            {downSystems === 0 && degradedSystems === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
                <CheckCircle2 className="h-10 w-10 text-green-200 mb-2" />
                <p className="text-sm font-bold text-gray-500">All Systems Nominal</p>
                <p className="text-xs">No active alerts at this time.</p>
              </div>
            ) : (
              healthData.filter(s => s.status !== 'Operational').map(sys => (
                <div key={`alert-${sys.id}`} className={`p-3 rounded-lg border text-sm ${sys.status === 'Down' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold ${sys.status === 'Down' ? 'text-red-800' : 'text-orange-800'}`}>
                      {sys.name}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center uppercase font-bold">
                      <Clock className="h-3 w-3 mr-1" /> Just now
                    </span>
                  </div>
                  <p className={`text-xs ${sys.status === 'Down' ? 'text-red-600' : 'text-orange-600'}`}>
                    {sys.status === 'Down' ? 'API connection timeout. Attempting to restart service.' : `High latency detected (${sys.latency}ms). Scaling resources.`}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button className="w-full bg-gray-50 text-blue-900 hover:bg-gray-100 border border-gray-200 font-bold text-xs shadow-sm">
              View Full Incident History
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};