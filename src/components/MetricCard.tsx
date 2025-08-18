import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

// Define the props for the MetricCard component
interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

// The MetricCard component displays a single key metric with an icon, title, value, and optional subtitle.
// It uses the Card component from shadcn/ui and is styled with Tailwind CSS to match the dashboard's design.
export const MetricCard = ({ icon, title, value, subtitle, className }: MetricCardProps) => {
  return (
    // The main card container is styled with a light background, rounded corners, and a subtle shadow.
    // The className prop allows for additional custom styling. The hover effect is more subtle.
    <Card className={`p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 ${className || ''}`}>
      {/* Container for the icon and title, using flexbox for alignment */}
      <div className="flex items-center space-x-3 mb-2">
        {/* The icon container with a light background and a subtle border */}
        <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gray-50 text-gray-400 border border-gray-100">
          {icon}
        </div>
        {/* The title of the metric */}
        <span className="text-sm font-medium text-gray-500">{title}</span>
      </div>
      {/* The main value of the metric, styled for emphasis with a slightly lighter color */}
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      {/* The optional subtitle, displayed only if a value is provided */}
      {subtitle && (
        <div className="text-sm text-gray-400">{subtitle}</div>
      )}
    </Card>
  );
};
