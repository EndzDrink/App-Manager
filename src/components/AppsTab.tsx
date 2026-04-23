import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Server, Filter } from "lucide-react";

interface AppsTabProps {
  apps: any[]; // These are the Enterprise Systems fed from the backend
  onAddApp: () => void;
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, onAddApp }) => {
  const [filterDept, setFilterDept] = useState<string>("All");

  // Extract unique departments from all systems to populate the dropdown dynamically
  const allDepts = Array.from(new Set(apps.flatMap(app => app.departments || []))).filter(Boolean);

  const filteredSystems = filterDept === "All"
    ? apps
    : apps.filter(app => app.departments && app.departments.includes(filterDept));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Enterprise Systems Directory</h2>
          <p className="text-sm text-metric-label">Central IT registry of all approved organizational platforms.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Department Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-white border border-border rounded-lg px-3 py-2 shadow-sm flex-1 sm:flex-none">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              className="bg-transparent text-sm text-metric-value outline-none w-full cursor-pointer"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="All">All Departments</option>
              {allDepts.map(dept => (
                <option key={dept as string} value={dept as string}>{dept as string}</option>
              ))}
            </select>
          </div>

          <Button onClick={onAddApp} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add System
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSystems.map((app, i) => (
          <Card key={i} className="p-5 bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Server className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{app.name}</h3>
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded mt-1">
                    {app.category}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-metric-label mb-2 uppercase font-semibold">Active In Departments:</p>
              <div className="flex flex-wrap gap-1.5">
                {app.departments && app.departments.length > 0 ? (
                  app.departments.map((dept: string, idx: number) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-xs font-medium">
                      {dept}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No active subscriptions</span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filteredSystems.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-500 font-medium">No systems found actively deployed in {filterDept}.</p>
          </div>
        )}
      </div>
    </div>
  );
};