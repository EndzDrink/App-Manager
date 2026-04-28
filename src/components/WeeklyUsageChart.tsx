import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon, Calendar, Download } from 'lucide-react'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WeeklyUsageChartProps {
  systemFilter: string;
  deptFilter: string;
  // NEW: Hook to send the report to the central Archive
  onSaveReport?: (filename: string, content: string) => void;
}

export const WeeklyUsageChart: React.FC<WeeklyUsageChartProps> = ({ systemFilter, deptFilter, onSaveReport }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('weekly');
  const [metricFocus, setMetricFocus] = useState<'both' | 'active' | 'idle'>('both');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('appManagerToken');
        const res = await fetch(`${API_URL}/api/metrics/usage/timeline?system=${systemFilter}&dept=${deptFilter}&timeframe=${timeframe}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const rawData = await res.json();
          
          let baselineCapacity = 480; 
          if (timeframe === 'monthly') baselineCapacity = 2400; 
          if (['quarterly', 'half_yearly', 'yearly'].includes(timeframe)) baselineCapacity = 9600; 

          const mappedData = rawData.map((item: any) => {
            const active = Number(item.total_minutes);
            const idle = active < baselineCapacity ? baselineCapacity - active : 0;
            
            return {
              period_label: item.period_label,
              "Active Usage": active,
              "Unused Capacity": idle,
              "Total Capacity": baselineCapacity
            };
          });
          
          setData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch timeline", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [systemFilter, deptFilter, timeframe]);

  const handleExportReport = () => {
    if (data.length === 0) return;
    const headers = ['Reporting Period', 'System Target', 'Department Target', 'Active Minutes', 'Idle Minutes', 'Total Capacity (Mins)', 'Utilization %'];
    const rows = data.map(row => {
      const utilPercent = row["Total Capacity"] > 0 ? Math.round((row["Active Usage"] / row["Total Capacity"]) * 100) : 0;
      return [
        `"${row.period_label}"`,
        `"${systemFilter}"`,
        `"${deptFilter}"`,
        row["Active Usage"],
        row["Unused Capacity"],
        row["Total Capacity"],
        `${utilPercent}%`
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `Capacity_Audit_${systemFilter}_${timeframe}_${dateStamp}.csv`;

    // Save to global archive
    if (onSaveReport) {
      onSaveReport(filename, csvContent);
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const activeUsage = payload.find((p: any) => p.dataKey === 'Active Usage')?.value || 0;
      const unused = payload.find((p: any) => p.dataKey === 'Unused Capacity')?.value || 0;
      const total = activeUsage + unused;
      const utilPercent = total > 0 ? Math.round((activeUsage / total) * 100) : 0;

      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl pointer-events-none min-w-[150px]">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{label}</p>
          <div className="space-y-1.5 text-xs">
            <p className="flex justify-between items-center text-indigo-700 font-semibold">
              <span>Active (mins):</span> <span className="ml-4">{activeUsage}</span>
            </p>
            <p className="flex justify-between items-center text-red-600 font-semibold">
              <span>Idle (mins):</span> <span className="ml-4">{unused}</span>
            </p>
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center font-bold text-gray-600">
              <span>Utilization:</span> <span>{utilPercent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getActiveColor = () => metricFocus === 'idle' ? '#e0e7ff' : '#4f46e5';
  const getIdleColor = () => metricFocus === 'active' ? '#fee2e2' : '#ef4444';

  return (
    <Card className="flex flex-col h-[450px] bg-white border border-border shadow-sm rounded-xl overflow-hidden relative">
      
      <div className="p-4 border-b border-gray-100 shrink-0 bg-white z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center tracking-wide">
            <BarChartIcon className="h-4 w-4 mr-2 text-indigo-600" />
            System Usage vs. Idle Time
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {systemFilter !== 'All' ? `Tracking capacity for ${systemFilter}` : 'Overall enterprise utilization footprint'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-inner transition-colors hover:border-indigo-300">
            <Calendar className="h-3.5 w-3.5 text-gray-500 mr-2" />
            <select 
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer hover:text-indigo-700 transition-colors"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="weekly">7-Day Trend (Daily)</option>
              <option value="monthly">30-Day Trend (Weekly)</option>
              <option value="quarterly">Quarterly (Monthly)</option>
              <option value="half_yearly">6-Month (Monthly)</option>
              <option value="yearly">Annual View (Monthly)</option>
            </select>
          </div>
          
          <button 
            onClick={handleExportReport}
            disabled={isLoading || data.length === 0}
            className="flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors disabled:opacity-50 text-xs font-semibold"
            title="Export Capacity Audit Report"
          >
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 pb-2 overflow-y-auto custom-scrollbar bg-gray-50/30">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="h-[280px] min-w-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="period_label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '15px' }} />
                <Bar dataKey="Active Usage" stackId="a" fill={getActiveColor()} radius={[0, 0, 4, 4]} barSize={40} animationDuration={800} />
                <Bar dataKey="Unused Capacity" stackId="a" fill={getIdleColor()} radius={[4, 4, 0, 0]} barSize={40} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0 flex justify-center">
        <div className="flex items-center bg-gray-100 p-1 rounded-lg w-full max-w-sm border border-gray-200">
           <button
            onClick={() => setMetricFocus('both')}
            className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-md transition-all ${metricFocus === 'both' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Combined
          </button>
          <button
            onClick={() => setMetricFocus('active')}
            className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-md transition-all ${metricFocus === 'active' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Active Usage
          </button>
          <button
            onClick={() => setMetricFocus('idle')}
            className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-md transition-all ${metricFocus === 'idle' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Unused Capacity
          </button>
        </div>
      </div>
    </Card>
  );
};