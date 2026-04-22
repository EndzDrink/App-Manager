import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingDown, ShieldAlert, ChevronRight } from "lucide-react";

interface AuditTabProps {
  duplications: any[];
  deptSpend: any[];
  onDepartmentClick: (id: number) => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({ duplications, deptSpend, onDepartmentClick }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-metric-value mb-2">Efficiency & Compliance Audit</h2>
        <p className="text-sm text-metric-label mb-6">Automated identification of redundant systems and departmental overspending.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-orange-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-metric-value">Redundancy Alerts</h3>
          </div>
          
          <div className="space-y-4">
            {duplications.length === 0 ? (
              <p className="text-sm text-metric-label italic">No software duplication detected.</p>
            ) : (
              duplications.map((item, i) => (
                <div key={i} className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded">{item.category}</span>
                      <p className="text-sm font-semibold text-metric-value mt-2">{item.app_names.join(" • ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">ZAR {parseFloat(item.total_category_cost).toFixed(2)}</p>
                      <p className="text-[10px] text-metric-label uppercase">Monthly Waste</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 bg-white border-border shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-metric-value">Departmental Spend Control</h3>
          </div>
          
          <div className="space-y-2">
            {deptSpend.map((dept, i) => {
              const ratio = (dept.total_spend / dept.budget_limit) * 100;
              return (
                <div 
                  key={i} 
                  onClick={() => dept.id && onDepartmentClick(dept.id)}
                  className="p-3 -mx-3 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors group"
                >
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-metric-value group-hover:text-blue-600 transition-colors">{dept.department}</p>
                      <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </div>
                    <p className={`text-xs font-bold ${ratio > 100 ? 'text-red-600' : 'text-metric-value'}`}>{ratio.toFixed(1)}% Used</p>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${ratio > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(ratio, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};