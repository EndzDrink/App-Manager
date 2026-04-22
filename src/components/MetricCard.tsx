import React from 'react';
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: React.ReactNode; 
  className?: string;
}

export const MetricCard = ({ icon, title, value, subtitle, className }: MetricCardProps) => {
  return (
    <Card className={`p-6 bg-metric-card border border-border shadow-sm transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-metric-label uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-metric-value tracking-tight">{value}</h3>
          <div className="text-xs text-metric-label flex items-center">
            {subtitle}
          </div>
        </div>
        <div className="p-2 bg-secondary/50 rounded-lg text-metric-label">
          {icon}
        </div>
      </div>
    </Card>
  );
};