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
    <Card className={`p-6 bg-metric-card border border-border shadow-sm ${className || ''}`}>
      <div className="flex items-center space-x-3 mb-2">
        <div className="text-metric-label">{icon}</div>
        <span className="text-sm font-medium text-metric-label">{title}</span>
      </div>
      <div className="text-3xl font-bold text-metric-value mb-1">{value}</div>
      {subtitle && (
        <div className="text-sm text-metric-label">{subtitle}</div>
      )}
    </Card>
  );
};