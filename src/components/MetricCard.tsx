import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export const MetricCard = ({ icon, title, value, subtitle, className }: MetricCardProps) => {
  return (
    <Card className={`p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 ${className || ''}`}>
      <div className="flex items-center space-x-3 mb-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gray-50 text-gray-400 border border-gray-100">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-500">{title}</span>
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      {subtitle && (
        <div className="text-sm text-gray-400">{subtitle}</div>
      )}
    </Card>
  );
};
