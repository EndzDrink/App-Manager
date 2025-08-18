import { Card } from "@/components/ui/card";
import { PieChart } from "lucide-react";

interface CategoryData {
  category: string;
  time: string;
  percentage: number;
}

const categoryData: CategoryData[] = [
  { category: "Entertainment", time: "14h 0m", percentage: 65 },
  { category: "Productivity", time: "5h 15m", percentage: 25 },
  { category: "Games", time: "35m", percentage: 3 },
  { category: "Communication", time: "21h 0m", percentage: 95 },
  { category: "Utilities", time: "0m", percentage: 0 },
];

export const CategoryUsageChart = () => {
  return (
    <Card className="p-6 bg-metric-card border border-border shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <PieChart className="h-5 w-5 text-metric-label" />
        <h3 className="text-lg font-semibold text-metric-value">Usage by Category</h3>
      </div>
      <p className="text-sm text-metric-label mb-6">Weekly minutes by app category</p>
      
      <div className="space-y-4">
        {categoryData.map((data) => (
          <div key={data.category} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-metric-value mb-1">
                {data.category}
              </div>
              <div className="w-full bg-progress-bg rounded-full h-2">
                <div 
                  className="bg-progress-fill h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-sm text-metric-label text-right ml-4">
              {data.time}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
