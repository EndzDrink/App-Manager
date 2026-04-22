import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Loader2 } from "lucide-react";

interface UsageData {
  day: string;
  totalMinutes: number;
  displayTime: string;
}

export const WeeklyUsageChart = () => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyUsage = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/metrics/usage/weekly');
        if (response.ok) {
          const data = await response.json();
          
          // Format the raw database data into UI-ready data
          const formattedData = data.map((d: any) => {
            const totalMins = parseInt(d.total_minutes, 10) || 0;
            const hours = Math.floor(totalMins / 60);
            const minutes = totalMins % 60;
            
            return {
              day: d.day_name.substring(0, 3), // Trims "Monday" to "Mon"
              totalMinutes: totalMins,
              displayTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
            };
          });
          
          setUsageData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch weekly usage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyUsage();
  }, []);

  // Find the day with the highest usage to set the 100% scale for the bars
  const maxUsage = usageData.length > 0 
    ? Math.max(...usageData.map(d => d.totalMinutes)) 
    : 1;

  return (
    <Card className="p-6 bg-metric-card border border-border shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart className="h-5 w-5 text-metric-label" />
        <h3 className="text-lg font-semibold text-metric-value">Weekly Usage</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-metric-label ml-auto" />}
      </div>
      <p className="text-sm text-metric-label mb-6">App usage throughout the week</p>
      
      <div className="space-y-4">
        {usageData.length === 0 && !isLoading ? (
          <p className="text-sm text-metric-label italic">No usage data found for the last 7 days.</p>
        ) : (
          usageData.map((data, index) => {
            const percentage = (data.totalMinutes / maxUsage) * 100;
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="w-12 text-sm font-medium text-metric-value">
                  {data.day}
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