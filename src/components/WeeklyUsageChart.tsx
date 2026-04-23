import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UsageData {
  label: string;
  totalMinutes: number;
  displayTime: string;
}

interface WeeklyUsageChartProps {
  systemFilter?: string;
  deptFilter?: string;
}

export const WeeklyUsageChart = ({ systemFilter = 'All', deptFilter = 'All' }: WeeklyUsageChartProps) => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State for the BI Timeframe toggle
  const [timeframe, setTimeframe] = useState<string>("weekly");

  useEffect(() => {
    const fetchTimelineUsage = async () => {
      setIsLoading(true);
      try {
        // Pointing to the new dynamic /timeline endpoint
        const response = await fetch(`${API_URL}/api/metrics/usage/timeline?system=${encodeURIComponent(systemFilter)}&dept=${encodeURIComponent(deptFilter)}&timeframe=${timeframe}`);
        
        if (response.ok) {
          const data = await response.json();
          
          const formattedData = data.map((d: any) => {
            const totalMins = parseInt(d.total_minutes, 10) || 0;
            const hours = Math.floor(totalMins / 60);
            const minutes = totalMins % 60;
            
            return {
              label: d.period_label, // Generates "Mon", "Wk of Apr 12", or "Jan" dynamically
              totalMinutes: totalMins,
              displayTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
            };
          });
          
          setUsageData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch timeline usage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimelineUsage();
  }, [systemFilter, deptFilter, timeframe]); // Re-runs instantly when any filter or toggle is clicked

  const maxUsage = usageData.length > 0 
    ? Math.max(...usageData.map(d => d.totalMinutes)) 
    : 1;

  return (
    <Card className="p-6 bg-metric-card border border-border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <BarChart className="h-5 w-5 text-metric-label" />
          <h3 className="text-lg font-semibold text-metric-value">System Usage Timeline</h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-metric-label" />}
        </div>
        
        {/* TIME SLICER TOGGLE BUTTONS */}
        <div className="flex items-center bg-background border border-border rounded-lg p-1">
          {[
            { id: 'weekly', label: '1W' },
            { id: 'monthly', label: '1M' },
            { id: 'quarterly', label: '3M' },
            { id: 'half_yearly', label: '6M' },
            { id: 'yearly', label: '1Y' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                timeframe === tf.id 
                  ? 'bg-metric-card text-blue-600 shadow-sm border border-border' 
                  : 'text-metric-label hover:text-metric-value hover:bg-gray-50/50'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-metric-label mb-6">Active minutes over selected period</p>
      
      {/* Scrollable area to handle up to 12 months without breaking UI */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {usageData.length === 0 && !isLoading ? (
          <p className="text-sm text-metric-label italic">No usage data found for these filters.</p>
        ) : (
          usageData.map((data, index) => {
            const percentage = (data.totalMinutes / maxUsage) * 100;
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="w-20 text-xs font-medium text-metric-value truncate">
                  {data.label}
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-progress-bg rounded-full h-2">
                    <div 
                      className="bg-progress-fill h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-metric-label text-right">
                  {data.displayTime}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};