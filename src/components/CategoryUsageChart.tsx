import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CategoryData {
  category: string;
  time: string;
  percentage: number;
}

interface CategoryUsageChartProps {
  systemFilter?: string;
  deptFilter?: string;
}

export const CategoryUsageChart = ({ systemFilter = 'All', deptFilter = 'All' }: CategoryUsageChartProps) => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryUsage = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/metrics/usage/category?system=${encodeURIComponent(systemFilter)}&dept=${encodeURIComponent(deptFilter)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Find the max category to scale the progress bars correctly
          const maxMinutes = data.length > 0 
            ? Math.max(...data.map((d: any) => parseInt(d.total_minutes, 10)))
            : 1;

          // Format the data
          const formattedData = data.map((d: any) => {
            const totalMins = parseInt(d.total_minutes, 10) || 0;
            const hours = Math.floor(totalMins / 60);
            const minutes = totalMins % 60;
            
            return {
              category: d.category,
              time: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
              percentage: (totalMins / maxMinutes) * 100
            };
          });

          setCategoryData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch category usage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryUsage();
  }, [systemFilter, deptFilter]);

  return (
    <Card className="p-6 bg-metric-card border border-border shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <PieChart className="h-5 w-5 text-metric-label" />
        <h3 className="text-lg font-semibold text-metric-value">Usage by Category</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-metric-label ml-auto" />}
      </div>
      <p className="text-sm text-metric-label mb-6">Weekly minutes by app category</p>
      
      <div className="space-y-4">
        {categoryData.length === 0 && !isLoading ? (
          <p className="text-sm text-metric-label italic">No category data found for these filters.</p>
        ) : (
          categoryData.map((data, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-metric-value mb-1">
                  {data.category}
                </div>
                <div className="w-full bg-progress-bg rounded-full h-2">
                  <div 
                    className="bg-progress-fill h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-sm text-metric-label text-right ml-4">
                {data.time}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};