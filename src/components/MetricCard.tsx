import React from 'react';
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <Card className="p-5 border border-sky-200 shadow-sm rounded-xl bg-white hover:border-blue-400 hover:shadow-md transition-all group overflow-hidden relative flex flex-col h-full">
      {/* eThekwini Sky Blue Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-sky-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
          <p className="text-2xl font-black text-blue-900">{value}</p>
        </div>
        
        {/* Navy and Yellow eThekwini Hover Effect */}
        <div className="p-2.5 bg-gray-50 border border-gray-100 group-hover:bg-blue-900 group-hover:border-blue-800 rounded-lg transition-colors shadow-sm shrink-0">
          <div className="text-sky-600 group-hover:text-yellow-400 transition-colors flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
      
      <div className="text-xs font-bold text-gray-500 mt-auto border-t border-gray-100 pt-3">
        {subtitle}
      </div>
    </Card>
  );
};