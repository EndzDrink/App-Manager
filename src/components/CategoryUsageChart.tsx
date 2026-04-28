import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Clock, AlertCircle, Activity, PieChart as PieIcon, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CategoryUsageChartProps {
  systemFilter: string;
  deptFilter: string;
  onNavigateToRecommendations?: () => void; 
}

// --- NEW: Custom Active Shape for the Pie Chart ---
// This draws the pop-out slice, the connecting line, and the data labels.
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 25) * cos;
  const my = cy + (outerRadius + 25) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      {/* Category Name in the center hole */}
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#1e3a8a" className="font-bold text-xs uppercase tracking-wider">
        {payload.category.length > 12 ? payload.category.substring(0, 10) + '...' : payload.category}
      </text>
      
      {/* The popped-out slice */}
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} fill={fill} />
      
      {/* The connecting line */}
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      
      {/* Data Labels (Minutes and Percentage) */}
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#1e3a8a" className="font-bold text-xs">
        {`${value} mins`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={16} textAnchor={textAnchor} fill="#64748b" className="text-[11px] font-semibold">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};


export const CategoryUsageChart: React.FC<CategoryUsageChartProps> = ({ systemFilter, deptFilter, onNavigateToRecommendations }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'list' | 'pie'>('list');
  
  // NEW: State to track which slice is currently hovered/active
  const [activeIndex, setActiveIndex] = useState<number>(0);

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
          setActiveIndex(0); // Reset hover state on fresh data
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

  // BRANDING: eThekwini Palette
  const pieColorsActive = ['#1e3a8a', '#0ea5e9', '#facc15', '#1d4ed8', '#7dd3fc', '#eab308'];

  const handleEAFlagClick = () => {
    if (onNavigateToRecommendations) onNavigateToRecommendations();
  };

  const toggleChartType = () => {
    setChartType(prev => prev === 'list' ? 'pie' : 'list');
  };

  return (
    <Card className="flex flex-col h-[450px] bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      
      <div className="p-4 border-b border-gray-100 shrink-0 bg-white z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center">
          <button 
            onClick={toggleChartType} 
            className="mr-3 p-2 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 shadow-sm text-blue-800 transition-all group" 
            title="Click to change chart style"
          >
            {chartType === 'list' && <Activity className="h-4 w-4 group-hover:scale-110 transition-transform" />}
            {chartType === 'pie' && <PieIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />}
          </button>
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Category Utilization</h3>
            <p className="text-xs text-gray-500 mt-0.5">Audit of active usage vs inactive capacity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No usage data recorded for this selection.</p>
          </div>
        ) : chartType === 'pie' ? (
          
          <div className="h-full w-full flex flex-col pb-2">
            {/* The Pie Chart Area */}
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={processedData}
                    dataKey="active"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    animationDuration={800}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColorsActive[index % pieColorsActive.length]} className="cursor-pointer outline-none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* NEW: Interactive Custom Legend at the bottom */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-center gap-2">
              {processedData.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center px-3 py-1.5 rounded-full cursor-pointer transition-all duration-300 border ${
                    activeIndex === index 
                      ? 'bg-blue-50 border-blue-200 shadow-sm scale-105' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 opacity-70'
                  }`}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" 
                    style={{ backgroundColor: pieColorsActive[index % pieColorsActive.length] }}
                  ></div>
                  <span className={`text-[10px] uppercase tracking-wider ${activeIndex === index ? 'font-bold text-blue-900' : 'font-semibold text-gray-600'}`}>
                    {entry.category}
                  </span>
                </div>
              ))}
            </div>
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
                    <span className={`text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100`}>
                      {displayValue} mins used
                    </span>
                  </div>
                  
                  <div className={`w-full rounded-full h-2 mb-2 overflow-hidden flex bg-gray-100`}>
                    <div 
                      className={`h-2 rounded-full bg-blue-800 transition-all duration-1000 ease-out`} 
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