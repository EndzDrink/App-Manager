import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Clock, AlertCircle, Activity, PieChart as PieIcon, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CategoryUsageChartProps {
  systemFilter: string;
  deptFilter: string;
  // NEW: The function that will tell the main dashboard to switch tabs
  onNavigateToRecommendations?: () => void; 
}

export const CategoryUsageChart: React.FC<CategoryUsageChartProps> = ({ systemFilter, deptFilter, onNavigateToRecommendations }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [chartType, setChartType] = useState<'list' | 'pie'>('list');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('appManagerToken');
        const res = await fetch(`${API_URL}/api/metrics/usage/category?system=${systemFilter}&dept=${deptFilter}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const rawData = await res.json();
          setData(rawData);
        }
      } catch (err) {
        console.error("Failed to fetch category data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [systemFilter, deptFilter]);

  const baselineCapacity = 3000; 
  
  const processedData = data.map(item => {
    const active = Number(item.total_minutes);
    const idle = active < baselineCapacity ? baselineCapacity - active : 0;
    const activePercent = Math.min(100, Math.round((active / baselineCapacity) * 100));
    return {
      category: item.category,
      active,
      idle,
      activePercent,
      isHighWaste: activePercent < 30
    };
  }).sort((a, b) => b.active - a.active); 

  const pieColorsActive = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  // --- THE REAL NAVIGATION TRIGGER ---
  const handleEAFlagClick = () => {
    if (onNavigateToRecommendations) {
      onNavigateToRecommendations();
    }
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl pointer-events-none">
          <p className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-2">{data.category}</p>
          <p className="text-xs text-indigo-700 font-semibold">{data.active} minutes actively used</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-[450px] bg-white border border-border shadow-sm rounded-xl overflow-hidden">
      
      <div className="p-4 border-b border-gray-100 shrink-0 bg-white z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center tracking-wide">
            {chartType === 'list' ? <Activity className="h-4 w-4 mr-2 text-indigo-600" /> : <PieIcon className="h-4 w-4 mr-2 text-indigo-600" />}
            Category Utilization
          </h3>
          <p className="text-xs text-gray-500 mt-1">Audit of active usage vs inactive capacity</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 shadow-inner">
            <button 
              onClick={() => setChartType('list')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="View as List"
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="View as Pie Chart"
            >
              <PieIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button 
            onClick={handleEAFlagClick}
            className="bg-red-50 hover:bg-red-100 hover:shadow-sm text-red-600 border border-red-200 text-[10px] font-bold px-2.5 py-1.5 rounded-md flex items-center transition-all group cursor-pointer"
            title="Drill down into Waste Recommendations"
          >
            <AlertCircle className="w-3 h-3 mr-1.5 group-hover:animate-pulse" /> 
            EA Flag
            <ExternalLink className="w-3 h-3 ml-1.5 opacity-50 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50/30">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No usage data recorded for this selection.</p>
          </div>
        ) : chartType === 'pie' ? (
          
          <div className="h-full w-full min-h-[250px] pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  dataKey="active"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  animationDuration={800}
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColorsActive[index % pieColorsActive.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

        ) : (
          
          <div className="space-y-4 pr-2 pb-4">
            {processedData.map((item, index) => {
              const displayValue = item.active;
              const displayPercent = item.activePercent;

              return (
                <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-sm font-bold text-gray-900">{item.category}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700`}>
                      {displayValue} mins used
                    </span>
                  </div>
                  
                  <div className={`w-full rounded-full h-2 mb-2 overflow-hidden flex bg-gray-100`}>
                    <div 
                      className={`h-2 rounded-full bg-indigo-500 transition-all duration-1000 ease-out`} 
                      style={{ width: `${displayPercent}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    <span>0 Mins</span>
                    <span>{baselineCapacity} Mins Capacity</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};