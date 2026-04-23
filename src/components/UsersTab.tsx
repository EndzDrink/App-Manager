import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, UserCheck, Shield, Search, Server, Filter } from "lucide-react";

interface UsersTabProps {
  users: any[];
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState<'department' | 'system'>('department');

  // Trigger Identity Provider Sync
  const handleDirectorySync = async () => {
    setIsSyncing(true);
    try {
      await fetch('http://localhost:3000/api/users/sync', { method: 'POST' });
      onRefresh(); 
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Filter users based on CIO's search input
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Group the filtered users dynamically based on the selected toggle
  const groupedData: Record<string, any[]> = {};

  if (groupBy === 'department') {
    filteredUsers.forEach(user => {
      const dept = user.department || 'Unassigned';
      if (!groupedData[dept]) groupedData[dept] = [];
      groupedData[dept].push(user);
    });
  } else {
    // Grouping by System means a user might appear in multiple columns (e.g. Jira AND Slack)
    filteredUsers.forEach(user => {
      if (!user.assigned_systems || user.assigned_systems.length === 0) {
        if (!groupedData['No Assigned Systems']) groupedData['No Assigned Systems'] = [];
        groupedData['No Assigned Systems'].push(user);
      } else {
        user.assigned_systems.forEach((sys: any) => {
          if (!groupedData[sys.name]) groupedData[sys.name] = [];
          // Prevent duplicates if user somehow has two licenses for the same tool
          if (!groupedData[sys.name].some(u => u.id === user.id)) {
            groupedData[sys.name].push(user);
          }
        });
      }
    });
  }

  // Sort columns alphabetically for a cleaner UI
  const sortedColumns = Object.keys(groupedData).sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-12rem)]">
      
      {/* Top Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-metric-value flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Identity Matrix
          </h2>
          <p className="text-sm text-metric-label mt-1">Search staff and map organizational access.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* CIO Search Bar */}
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search user email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Grouping Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button 
              onClick={() => setGroupBy('department')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${groupBy === 'department' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Shield className="h-3.5 w-3.5 mr-1.5" /> Department
            </button>
            <button 
              onClick={() => setGroupBy('system')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${groupBy === 'system' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Server className="h-3.5 w-3.5 mr-1.5" /> System
            </button>
          </div>

          <Button 
            onClick={handleDirectorySync} 
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Entra ID
          </Button>
        </div>
      </div>

      {/* Horizontal Scrolling Kanban-style Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex space-x-6 h-full pb-4 min-w-max">
          
          {sortedColumns.map((columnName) => (
            <div key={columnName} className="w-80 flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-100 shrink-0">
              
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200 bg-white rounded-t-xl shrink-0 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {groupBy === 'department' ? <Shield className="h-4 w-4 text-blue-600" /> : <Server className="h-4 w-4 text-indigo-600" />}
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide truncate max-w-[180px]">
                    {columnName}
                  </h3>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {groupedData[columnName].length}
                </span>
              </div>

              {/* Column Body (Scrollable User Cards) */}
              <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {groupedData[columnName].map((user: any) => (
                  <Card key={user.id} className="p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-sm text-metric-value truncate">{user.email}</p>
                        {/* If grouped by System, show the user's Department. If grouped by Dept, show onboarding date */}
                        <p className="text-[10px] text-metric-label mt-0.5 uppercase tracking-wider">
                          {groupBy === 'system' ? user.department : `Joined: ${user.onboarding_date || 'N/A'}`}
                        </p>
                      </div>
                    </div>

                    {/* Allocated Systems Info (Only show if we are grouped by Department, to avoid clutter) */}
                    {groupBy === 'department' && (
                      <div className="pt-3 border-t border-gray-50">
                        <div className="flex flex-wrap gap-1.5">
                          {user.assigned_systems.length > 0 ? (
                            user.assigned_systems.map((sys: any) => (
                              <span key={sys.id} className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-600">
                                {sys.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No licenses</span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

            </div>
          ))}

          {sortedColumns.length === 0 && (
            <div className="w-full flex items-center justify-center py-20 text-gray-500 italic">
              No users match your search criteria.
            </div>
          )}

        </div>
      </div>
    </div>
  );
};