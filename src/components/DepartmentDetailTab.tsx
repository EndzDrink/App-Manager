import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MonitorSmartphone } from "lucide-react";

interface DepartmentDetailProps {
  details: any;
  onBack: () => void;
}

export const DepartmentDetailTab: React.FC<DepartmentDetailProps> = ({ details, onBack }) => {
  if (!details) return null;

  const { department, users, apps, totalSpend } = details;
  const ratio = (totalSpend / parseFloat(department.budget_limit)) * 100;
  const isOver = ratio > 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="p-2 h-auto text-metric-label hover:text-metric-value">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-metric-value">{department.name}</h2>
          <p className="text-sm text-metric-label">Departmental Spend & Allocation Drill-Down</p>
        </div>
      </div>

      {/* Budget Overview Card */}
      <Card className="p-6 bg-white border border-border shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-xs font-semibold text-metric-label uppercase tracking-wider mb-1">Current Spend vs Budget</p>
            <p className="text-2xl font-bold text-metric-value">ZAR {totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-metric-label">Limit: ZAR {parseFloat(department.budget_limit).toLocaleString()}</p>
            <p className={`text-sm font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
              {ratio.toFixed(1)}% Allocated
            </p>
          </div>
        </div>
        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(ratio, 100)}%` }} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Roster */}
        <Card className="p-6 bg-white border border-border shadow-sm">
          <div className="flex items-center space-x-3 mb-6 border-b pb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-metric-value">Team Roster ({users.length})</h3>
          </div>
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-metric-value">{user.email}</p>
                  <p className="text-[10px] text-metric-label uppercase tracking-wider">Joined: {user.joined}</p>
                </div>
                <div className="text-center px-3 py-1 bg-white border rounded-md">
                  <p className="text-xs font-bold text-blue-600">{user.active_licenses}</p>
                  <p className="text-[9px] text-metric-label uppercase">Licenses</p>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-metric-label italic">No users assigned.</p>}
          </div>
        </Card>

        {/* Software Stack */}
        <Card className="p-6 bg-white border border-border shadow-sm">
          <div className="flex items-center space-x-3 mb-6 border-b pb-4">
            <MonitorSmartphone className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-metric-value">Software Stack ({apps.length})</h3>
          </div>
          <div className="space-y-4">
            {apps.map((app: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-metric-value">{app.name}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-1">{app.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-metric-value">ZAR {parseFloat(app.total_cost).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  <p className="text-[10px] text-metric-label uppercase">{app.active_seats} Active Seats</p>
                </div>
              </div>
            ))}
            {apps.length === 0 && <p className="text-sm text-metric-label italic">No applications licensed.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};