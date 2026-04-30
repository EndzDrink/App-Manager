import React, { useState, useEffect } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { 
  Network, Wifi, Activity, AlertTriangle, 
  ArrowDownUp, Server, ShieldCheck, RefreshCw, Zap
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NetworksDashboardProps {
  systems: any[];
}

export const NetworksDashboard: React.FC<NetworksDashboardProps> = ({ systems }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkData, setNetworkData] = useState<any[]>([]);

  // Simulate Network Telemetry Data
  const fetchNetworkStats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const enrichedData = systems.map(sys => {
        const randomSeed = Math.random();
        
        // Base metrics
        let bandwidth = Math.floor(Math.random() * 800) + 50; // Mbps
        let latency = Math.floor(Math.random() * 40) + 5; // ms (internal usually fast)
        let endpoints = Math.floor(Math.random() * 5000) + 100;
        let status = 'Nominal';

        // Adjust for external SaaS vs Internal
        if (sys.deployment_type === 'External SaaS' || !sys.deployment_type) {
          latency += Math.floor(Math.random() * 60) + 20; // higher latency for cloud
          bandwidth = Math.floor(Math.random() * 1500) + 200; // higher bandwidth
        }

        // Create anomalies
        if (randomSeed > 0.90) {
          status = 'High Load';
          bandwidth *= 3; // Spike
          latency += 150;
        } else if (randomSeed > 0.97) {
          status = 'Critical Bottleneck';
          bandwidth *= 5;
          latency += 400;
        }

        return { ...sys, bandwidth, latency, endpoints, status };
      }).sort((a, b) => b.bandwidth - a.bandwidth); // Sort by highest bandwidth usage

      setNetworkData(enrichedData);
      setIsRefreshing(false);
    }, 700);
  };

  useEffect(() => {
    if (systems.length > 0) fetchNetworkStats();
  }, [systems]);

  const totalBandwidth = networkData.reduce((acc, curr) => acc + curr.bandwidth, 0) / 1000; // Convert to Gbps
  const criticalNodes = networkData.filter(s => s.status === 'Critical Bottleneck').length;
  const highLoadNodes = networkData.filter(s => s.status === 'High Load').length;
  const totalEndpoints = networkData.reduce((acc, curr) => acc + curr.endpoints, 0);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Nominal': return <span className="bg-green-100 text-green-700 border-green-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><ShieldCheck className="h-3 w-3 mr-1"/> Stable</span>;
      case 'High Load': return <span className="bg-orange-100 text-orange-700 border-orange-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max"><Activity className="h-3 w-3 mr-1"/> High Load</span>;
      case 'Critical Bottleneck': return <span className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-max animate-pulse"><AlertTriangle className="h-3 w-3 mr-1"/> Bottleneck</span>;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
            <Network className="h-6 w-6 mr-2 text-blue-600" />
            Network Topology & Impact
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Real-time bandwidth utilization and infrastructure health</p>
        </div>
        <Button 
          onClick={fetchNetworkStats} 
          disabled={isRefreshing}
          variant="outline" 
          className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Scanning...' : 'Refresh Topology'}
        </Button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          icon={<ArrowDownUp className="h-5 w-5 text-blue-500" />} 
          title="Total Throughput" 
          value={`${totalBandwidth.toFixed(2)} Gbps`} 
          subtitle="Combined system payload" 
        />
        <MetricCard 
          icon={<AlertTriangle className={`h-5 w-5 ${criticalNodes > 0 ? 'text-red-500' : 'text-orange-500'}`} />} 
          title="Congestion Alerts" 
          value={(criticalNodes + highLoadNodes).toString()} 
          subtitle={
            <div className="flex gap-2 text-[10px] font-bold mt-1.5">
              <span className={criticalNodes > 0 ? "text-red-600" : "text-gray-400"}>{criticalNodes} Critical</span>|
              <span className={highLoadNodes > 0 ? "text-orange-600" : "text-gray-400"}>{highLoadNodes} High</span>
            </div>
          } 
        />
        <MetricCard 
          icon={<Wifi className="h-5 w-5 text-green-500" />} 
          title="Active Endpoints" 
          value={(totalEndpoints / 1000).toFixed(1) + "k"} 
          subtitle={<span className="text-gray-500 font-bold text-[10px]">Connected municipal devices</span>} 
        />
        <MetricCard 
          icon={<Zap className="h-5 w-5 text-yellow-500" />} 
          title="Avg Edge Latency" 
          value="42ms" 
          subtitle={<span className="text-green-600 font-bold text-[10px]">Within strict SLA</span>} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* MAIN BANDWIDTH TABLE */}
        <Card className="xl:col-span-2 p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-800" />
              Bandwidth Utilization Matrix
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-bold">System Name</th>
                  <th className="pb-3 font-bold">Topology Node</th>
                  <th className="pb-3 font-bold">Health Status</th>
                  <th className="pb-3 font-bold">Payload (Mbps)</th>
                  <th className="pb-3 font-bold text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {networkData.map((sys) => (
                  <tr key={sys.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-sm text-gray-900">{sys.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase flex items-center mt-0.5">
                         {sys.deployment_type === 'Internal Build' ? <Server className="h-3 w-3 mr-1"/> : <Wifi className="h-3 w-3 mr-1"/>}
                         {sys.vendor}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${sys.deployment_type === 'Internal Build' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {sys.deployment_type || 'External Cloud'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {getStatusBadge(sys.status)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${sys.bandwidth > 1500 ? 'text-red-600' : sys.bandwidth > 800 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {sys.bandwidth.toLocaleString()} Mbps
                        </span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${sys.bandwidth > 1500 ? 'bg-red-500' : sys.bandwidth > 800 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min((sys.bandwidth / 3000) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-bold ${sys.latency > 200 ? 'text-red-600' : 'text-gray-900'}`}>
                        {sys.latency}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {networkData.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">No network data available. Add systems to the catalog.</div>
            )}
          </div>
        </Card>

        {/* SIDEBAR: TOP CONSUMERS */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex items-center">
              <ArrowDownUp className="h-4 w-4 mr-2 text-blue-500" />
              Top Bandwidth Hogs
            </h3>
            
            <div className="space-y-3 flex-1">
              {networkData.slice(0, 4).map((sys, idx) => (
                <div key={`hog-${sys.id}`} className="bg-gray-50 border border-gray-100 p-3 rounded-lg relative overflow-hidden">
                  {/* Subtle progress bar background based on rank */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-blue-50 z-0" 
                    style={{ width: `${100 - (idx * 20)}%` }}
                  ></div>
                  
                  <div className="relative z-10 flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate pr-2">{idx + 1}. {sys.name}</p>
                    <p className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded shrink-0">
                      {(sys.bandwidth / 1000).toFixed(2)} Gbps
                    </p>
                  </div>
                  <p className="relative z-10 text-[10px] text-gray-500 flex items-center font-medium mt-1">
                     {sys.endpoints.toLocaleString()} Connected Endpoints
                  </p>
                </div>
              ))}
            </div>
            
            <Button className="w-full mt-4 bg-white border border-gray-200 text-blue-900 hover:bg-gray-50 text-xs font-bold shadow-sm">
              Throttle External Traffic
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
};