import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users as UsersIcon, Search, Shield, Building2, Calendar, 
  Database, AlertCircle, ChevronDown, RefreshCw, Server, 
  CheckCircle2, LayoutDashboard
} from "lucide-react";

interface UsersTabProps {
  users: any[];
  onRefresh: () => Promise<void> | void;
  investigationQuery?: string; 
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh, investigationQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(investigationQuery);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    setSearchQuery(investigationQuery);
  }, [investigationQuery]);

  // ARMORED FILTER LOGIC: Safely parses strings and handles nulls
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    const matchesEmail = user.email?.toLowerCase().includes(query);
    const matchesDept = (user.department || '').toLowerCase().includes(query);
    
    let safeSystems = [];
    try {
      safeSystems = Array.isArray(user.assigned_systems) 
        ? user.assigned_systems 
        : (typeof user.assigned_systems === 'string' ? JSON.parse(user.assigned_systems) : []);
    } catch (e) {
      safeSystems = [];
    }

    const matchesSystem = safeSystems.some((sys: any) => (sys.name || '').toLowerCase().includes(query));
    
    return matchesEmail || matchesDept || matchesSystem;
  });

  return (
    // Locked viewport height for the native app feel (prevents window scrolling)
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 transition-all font-medium text-blue-900 shadow-sm outline-none"
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
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center text-sm shadow-sm animate-in slide-in-from-top-2 shrink-0">
          <AlertCircle className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
          <p className="text-blue-900 font-medium">
            <strong>Investigation Mode:</strong> Viewing all users assigned to <span className="font-bold underline decoration-blue-300">{investigationQuery}</span> based on AI recommendations.
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

      {/* FIXED HEIGHT MATRIX TABLE */}
      <Card className="bg-white border border-gray-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full bg-gray-50/50">
            <Shield className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-bold text-gray-500">No identities match your parameters.</p>
          </div>
        ) : (
          <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 relative bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-md z-20 border-b border-gray-200 shadow-sm">
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <th className="p-4 whitespace-nowrap">Identity / Email</th>
                  <th className="p-4 whitespace-nowrap">Department Unit</th>
                  <th className="p-4 whitespace-nowrap">Onboarding Date</th>
                  <th className="p-4 whitespace-nowrap">Active Entitlements</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const isExpanded = expandedUser === user.id;
                  
                  let assignedSystems = [];
                  try {
                    assignedSystems = Array.isArray(user.assigned_systems) 
                      ? user.assigned_systems 
                      : (typeof user.assigned_systems === 'string' ? JSON.parse(user.assigned_systems) : []);
                  } catch (e) {
                    assignedSystems = [];
                  }

                  const totalCost = assignedSystems.reduce((sum: number, sys: any) => sum + parseFloat(sys.price || 0), 0);

                  return (
                    <React.Fragment key={user.id}>
                      <tr className={`transition-colors group ${isExpanded ? 'bg-sky-50' : 'bg-white hover:bg-gray-50'}`}>
                        <td className="p-4">
                          <p className="font-bold text-sm text-blue-900 group-hover:text-sky-700 transition-colors">{user.email}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">UID-{user.id}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-gray-700 flex items-center">
                            <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {user.department || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-gray-500 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {user.onboarding_date || 'Legacy'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                              {assignedSystems.length} Apps
                            </span>
                            <span className="text-xs font-bold text-gray-600">
                              ZAR {totalCost.toLocaleString()} / mo
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant={isExpanded ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                            className={`text-xs font-bold h-8 transition-all ${
                              isExpanded 
                                ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-sm border-transparent' 
                                : 'text-blue-700 hover:bg-blue-50 border-blue-200'
                            }`}
                          >
                            Inspect <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </td>
                      </tr>

                      {/* USER ENTITLEMENT DASHBOARD WIDGET */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50 border-b border-gray-200 relative">
                          <td colSpan={5} className="p-0">
                            <div className="p-4 md:p-6 border-l-4 border-l-blue-600 animate-in slide-in-from-top-2 duration-200">
                              
                              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl">
                                
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white flex-wrap gap-4">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center mr-3">
                                      <LayoutDashboard className="h-4 w-4 text-blue-700" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Identity Entitlement Ledger</h4>
                                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">Assigned Software & Cost Allocation</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-6 text-right pr-2">
                                    <div>
                                      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-0.5">Monthly Burn</p>
                                      <p className="text-sm font-black text-gray-800">ZAR {totalCost.toLocaleString()}</p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200"></div>
                                    <div>
                                      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-0.5">Active Seats</p>
                                      <p className="text-sm font-black text-blue-600">{assignedSystems.length}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-0">
                                  {assignedSystems.length === 0 ? (
                                    <div className="py-8 text-center bg-gray-50/50">
                                      <Database className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                      <p className="text-xs font-bold text-gray-500">No active licenses assigned to this identity.</p>
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                          <th className="py-2.5 px-6">System Capability</th>
                                          <th className="py-2.5 px-6 text-center">License Status</th>
                                          <th className="py-2.5 px-6 text-right">Monthly Cost</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {assignedSystems.map((sys: any, idx: number) => {
                                          const isTarget = investigationQuery && (sys.name || '').toLowerCase().includes(investigationQuery.toLowerCase());
                                          
                                          return (
                                            <tr key={idx} className={isTarget ? 'bg-red-50/30' : 'bg-white hover:bg-gray-50/50 transition-colors'}>
                                              <td className="py-3 px-6">
                                                <div className="flex items-center">
                                                  <Server className={`h-4 w-4 mr-2.5 ${isTarget ? 'text-red-500' : 'text-sky-500'}`} />
                                                  <span className={`font-bold text-xs ${isTarget ? 'text-red-900' : 'text-gray-800'}`}>
                                                    {sys.name || 'Unlinked System'}
                                                  </span>
                                                  {isTarget && (
                                                    <span className="ml-3 bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                                                      Target
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="py-3 px-6 text-center">
                                                <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                                                </span>
                                              </td>
                                              <td className="py-3 px-6 text-right font-black text-gray-600 text-xs">
                                                <span className="text-gray-400 font-medium mr-1">ZAR</span>
                                                {parseFloat(sys.price || 0).toLocaleString()}
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>

                              </div>
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