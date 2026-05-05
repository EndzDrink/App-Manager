import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users as UsersIcon, Search, Shield, Building2, Calendar, 
  Database, AlertCircle, ChevronDown, RefreshCw
} from "lucide-react";

interface UsersTabProps {
  users: any[];
  onRefresh: () => Promise<void> | void;
  // This captures the system name passed from the Recommendations tab
  investigationQuery?: string; 
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh, investigationQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(investigationQuery);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    // If the prop changes (e.g., user clicked "Review Logs" on a different recommendation), update the search bar
    setSearchQuery(investigationQuery);
  }, [investigationQuery]);

  // Filter logic: Searches by email, department, or assigned systems
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    const matchesEmail = user.email?.toLowerCase().includes(query);
    const matchesDept = (user.department || '').toLowerCase().includes(query);
    const matchesSystem = user.assigned_systems?.some((sys: any) => sys.name.toLowerCase().includes(query));
    
    return matchesEmail || matchesDept || matchesSystem;
  });

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-xl font-black text-blue-900 flex items-center tracking-tight">
            <UsersIcon className="h-6 w-6 mr-2 text-blue-800" />
            Identity & Access Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Enterprise mapping of personnel to software entitlements.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-sky-500" />
            </div>
            <input
              type="text"
              placeholder="Search by email, department, or system name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 transition-all font-medium text-blue-900 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-[9px] font-bold uppercase bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">
                  Filtered
                </span>
              </div>
            )}
          </div>

          <Button 
            onClick={onRefresh} 
            variant="outline" 
            className="bg-white text-blue-900 border-gray-200 hover:bg-gray-50 font-bold shadow-sm px-3"
            title="Refresh Directory"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {investigationQuery && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center text-sm shadow-sm animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
          <p className="text-blue-900 font-medium">
            <strong>Investigation Mode:</strong> You are currently viewing all users assigned to <span className="font-bold underline decoration-blue-300">{investigationQuery}</span> based on AI recommendations.
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-blue-700 hover:bg-blue-100 h-7 text-xs font-bold"
            onClick={() => setSearchQuery('')}
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* MATRIX TABLE */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Shield className="h-10 w-10 mb-3 text-gray-200" />
            <p className="text-sm font-bold text-gray-500">No identities match your parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <th className="p-4">Identity / Email</th>
                  <th className="p-4">Department Unit</th>
                  <th className="p-4">Onboarding Date</th>
                  <th className="p-4">Active Entitlements</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const isExpanded = expandedUser === user.id;
                  const assignedSystems = user.assigned_systems || [];
                  const totalCost = assignedSystems.reduce((sum: number, sys: any) => sum + parseFloat(sys.price || 0), 0);

                  return (
                    <React.Fragment key={user.id}>
                      <tr className={`hover:bg-sky-50/50 transition-colors ${isExpanded ? 'bg-sky-50/50' : 'bg-white'}`}>
                        <td className="p-4">
                          <p className="font-bold text-sm text-blue-900">{user.email}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">UID-{user.id}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-gray-700 flex items-center">
                            <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {user.department || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-gray-600 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {user.onboarding_date || 'Legacy'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                              {assignedSystems.length} Apps
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                              ZAR {totalCost.toLocaleString()} / mo
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                            className="text-xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            Inspect <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </td>
                      </tr>

                      {/* EXPANDED VIEW: Shows exactly what licenses this user holds */}
                      {isExpanded && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={5} className="p-0">
                            <div className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center">
                                <Database className="h-3 w-3 mr-1.5" /> Assigned Capabilities
                              </h4>
                              
                              {assignedSystems.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No active licenses assigned to this identity.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {assignedSystems.map((sys: any, idx: number) => {
                                    // If we are investigating a specific system, highlight it in red to show it's a target
                                    const isTarget = investigationQuery && sys.name.toLowerCase().includes(investigationQuery.toLowerCase());
                                    
                                    return (
                                      <div key={idx} className={`p-3 rounded-lg border ${isTarget ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                          <p className={`text-xs font-bold ${isTarget ? 'text-red-900' : 'text-gray-900'}`}>{sys.name}</p>
                                          {isTarget && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500">ZAR {parseFloat(sys.price || 0).toLocaleString()} / mo</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};