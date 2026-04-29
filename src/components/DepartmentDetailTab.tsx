import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MonitorSmartphone, Building2 } from "lucide-react";

interface DepartmentDetailProps {
  details: any;
  onBack: () => void;
}

export const DepartmentDetailTab: React.FC<DepartmentDetailProps> = ({ details, onBack }) => {
  if (!details) return null;

  const { department, users, apps, totalSpend } = details;
  
  // Safely grab the budget using the correct backend property name ('allocated_budget')
  const budgetLimit = parseFloat(department.allocated_budget || department.budget_limit || "0");
  
  // Prevent NaN by ensuring we only calculate ratio if the budget is greater than 0
  const ratio = budgetLimit > 0 ? (totalSpend / budgetLimit) * 100 : 0;
  const isOver = ratio > 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      {/* Header Section styled with eThekwini Blue */}
      <div className="flex items-center space-x-4 mb-2 pb-3 border-b border-gray-200">
        <Button variant="ghost" onClick={onBack} className="p-2 h-auto text-blue-800 hover:text-blue-900 hover:bg-blue-50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-blue-900 flex items-center tracking-tight">
            <Building2 className="h-5 w-5 mr-2 text-blue-800" />
            {department.name || "Department"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Departmental Spend & Allocation Drill-Down</p>
        </div>
      </div>

      {/* Budget Overview Card */}
      <Card className="p-6 bg-white border border-sky-200 shadow-sm rounded-xl overflow-hidden">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Spend vs Budget</p>
            <p className="text-3xl font-bold text-blue-900">ZAR {(totalSpend || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500">Limit: <span className="text-blue-900">ZAR {budgetLimit.toLocaleString()}</span></p>
            <p className={`text-sm font-bold mt-1 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
              {ratio.toFixed(1)}% Allocated
            </p>
          </div>
        </div>
        {/* Progress bar using eThekwini Blue/Yellow Motif */}
        <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-blue-800'}`} 
            style={{ width: `${Math.min(ratio, 100)}%` }} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Users Roster */}
        <Card className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <div className="flex items-center">
              {/* eThekwini Gold/Blue Icon Styling */}
              <div className="bg-yellow-400 p-1.5 rounded-lg mr-3 shadow-sm">
                <Users className="h-4 w-4 text-blue-900" />
              </div>
              <h3 className="font-bold text-blue-900 text-base">Team Roster</h3>
            </div>
            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
              {users?.length || 0} Members
            </span>
          </div>
          
          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {users?.map((user: any, index: number) => (
              <div key={user.email || index} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900">{user.email}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Joined: {user.joined || "N/A"}</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-white border border-gray-200 rounded shadow-sm">
                  <p className="text-xs font-bold text-blue-800">{user.active_licenses || 1}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Licenses</p>
                </div>
              </div>
            ))}
            {(!users || users.length === 0) && (
              <div className="text-center py-8 text-gray-400 font-bold text-xs border-2 border-dashed border-gray-100 rounded-lg">
                No users currently assigned.
              </div>
            )}
          </div>
        </Card>

        {/* Software Stack */}
        <Card className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <div className="flex items-center">
              {/* eThekwini Gold/Blue Icon Styling */}
              <div className="bg-yellow-400 p-1.5 rounded-lg mr-3 shadow-sm">
                <MonitorSmartphone className="h-4 w-4 text-blue-900" />
              </div>
              <h3 className="font-bold text-blue-900 text-base">Software Stack</h3>
            </div>
            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
              {apps?.length || 0} Systems
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {apps?.map((app: any, i: number) => {
              const appCost = parseFloat(app.price || app.total_cost || "0");
              
              return (
                <div key={app.name || i} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{app.name}</p>
                    <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest bg-blue-50 border border-blue-100 inline-block px-1.5 py-0.5 rounded mt-1.5">
                      {app.category || "General"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-900">ZAR {appCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">{app.active_seats || 1} Active Seats</p>
                  </div>
                </div>
              );
            })}
            {(!apps || apps.length === 0) && (
              <div className="text-center py-8 text-gray-400 font-bold text-xs border-2 border-dashed border-gray-100 rounded-lg">
                No active applications licensed.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};