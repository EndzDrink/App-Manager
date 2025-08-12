import { Card } from "@/components/ui/card";
import { BarChart } from "lucide-react";

interface UsageData {
  day: string;
  hours: number;
  minutes: number;
  displayTime: string;
}

const usageData: UsageData[] = [
  { day: "Mon", hours: 7, minutes: 0, displayTime: "7h 0m" },
  { day: "Tue", hours: 6, minutes: 20, displayTime: "6h 20m" },
  { day: "Wed", hours: 7, minutes: 30, displayTime: "7h 30m" },
  { day: "Thu", hours: 6, minutes: 30, displayTime: "6h 30m" },
  { day: "Fri", hours: 5, minutes: 20, displayTime: "5h 20m" },
  { day: "Sat", hours: 4, minutes: 40, displayTime: "4h 40m" },
  { day: "Sun", hours: 5, minutes: 10, displayTime: "5h 10m" },
];

export const WeeklyUsageChart = () => {
  const maxUsage = Math.max(...usageData.map(d => d.hours + d.minutes / 60));
  
  return (
    <Card className="p-6 bg-metric-card border border-border shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart className="h-5 w-5 text-metric-label" />
        <h3 className="text-lg font-semibold text-metric-value">Weekly Usage</h3>
      </div>
      <p className="text-sm text-metric-label mb-6">App usage throughout the week</p>
      
      <div className="space-y-4">
        {usageData.map((data) => {
          const percentage = ((data.hours + data.minutes / 60) / maxUsage) * 100;
          
          return (
            <div key={data.day} className="flex items-center justify-between">
              <div className="w-12 text-sm font-medium text-metric-value">
                {data.day}
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-progress-bg rounded-full h-2">
                  <div 
                    className="bg-progress-fill h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-sm text-metric-label text-right">
                {data.displayTime}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};