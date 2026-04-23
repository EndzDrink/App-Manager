import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, RefreshCw, UserCheck, Shield, Search, Server, 
  Columns, Table as TableIcon, LayoutGrid, List as ListIcon, Menu 
} from "lucide-react";

interface UsersTabProps {
  users: any[];
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // NEW: 5 Distinct View Modes
  type ViewMode = 'kanban-dept' | 'kanban-system' | 'table' | 'grid' | 'compact';
  const [viewMode, setViewMode] = useState<ViewMode>('kanban-dept');

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

  // 1. Filter users
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Grouping Logic (Used strictly for Kanban Views)
  const groupedData: Record<string, any[]> = {};
  if (viewMode === 'kanban-dept' || viewMode === 'kanban-system') {
    if (viewMode === 'kanban-dept') {
      filteredUsers.forEach(user => {
        const dept = user.department || 'Unassigned';
        if (!groupedData[dept]) groupedData[dept] = [];
        groupedData[dept].push(user);
      });
    } else {
      filteredUsers.forEach(user => {
        if (!user.assigned_systems || user.assigned_systems.length === 0) {
          if (!groupedData['No Licenses']) groupedData['No Licenses'] = [];
          groupedData['No Licenses'].push(user);
        } else {
          user.assigned_systems.forEach((sys: any) => {
            if (!groupedData[sys.name]) groupedData[sys.name] = [];
            if (!groupedData[sys.name].some(u => u.id === user.id)) {
              groupedData[sys.name].push(user);
            }
          });
        }
      });
    }
  }
  const sortedColumns = Object.keys(groupedData).sort();

  // --- RENDER FUNCTION: 1 & 2. KANBAN VIEWS (Horizontal Scroll) ---
  const renderKanban = () => (
    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
      <div className="flex space-x-6 h-full min-w-max pr-6">
        {sortedColumns.map((columnName) => (
          <div key={columnName} className="w-80 flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-200 shrink-0 shadow-sm">
            <div className="p-3 border-b border-gray-200 bg-white rounded-t-xl shrink-0 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center space-x-2">
                {viewMode === 'kanban-dept' ? <Shield className="h-4 w-4 text-indigo-600" /> : <Server className="h-4 w-4 text-indigo-600" />}
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide truncate max-w-[180px]">
                  {columnName}
                </h3>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                {groupedData[columnName].length} Users
              </span>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              {groupedData[columnName].map((user: any) => (
                <Card key={user.id} className="p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 cursor-default">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-8 w-8 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 shrink-0">
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-sm text-metric-value truncate">{user.email}</p>
                      <p className="text-[10px] text-metric-label mt-0.5 uppercase tracking-wider">
                        {viewMode === 'kanban-system' ? user.department : `Joined: ${user.onboarding_date || 'N/A'}`}
                      </p>
                    </div>
                  </div>
                  {viewMode === 'kanban-dept' && (
                    <div className="pt-3 border-t border-gray-50">
                      <div className="flex flex-wrap gap-1.5">
                        {user.assigned_systems.length > 0 ? (
                          user.assigned_systems.map((sys: any) => (
                            <span key={sys.id} className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-600">
                              {sys.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-red-500 font-medium italic bg-red-50 px-2 py-0.5 rounded border border-red-100">No active licenses</span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- RENDER FUNCTION: 3. ENTERPRISE TABLE VIEW ---
  const renderTable = () => (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-metric-label text-xs uppercase font-semibold border-b border-border sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Employee ID</th>
              <th className="px-6 py-4">Department / Unit</th>
              <th className="px-6 py-4">Onboarding Date</th>
              <th className="px-6 py-4">Active System Licenses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border overflow-y-auto">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-metric-value flex items-center">
                  <UserCheck className="h-4 w-4 text-indigo-500 mr-2" />
                  {user.email}
                </td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  {user.department}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                  {user.onboarding_date || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.assigned_systems.length > 0 ? (
                      user.assigned_systems.map((sys: any) => (
                        <span key={sys.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {sys.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">None</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- RENDER FUNCTION: 4. GRID CARD VIEW ---
  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-8 custom-scrollbar pr-2">
      {filteredUsers.map((user) => (
        <Card key={user.id} className="p-5 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
          <div className="flex items-start space-x-3 mb-4">
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-gray-600" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-gray-900 truncate" title={user.email}>{user.email}</h3>
              <p className="text-xs font-semibold text-indigo-600 mt-0.5 truncate bg-indigo-50 inline-block px-2 py-0.5 rounded-md">{user.department}</p>
            </div>
          </div>
          <div className="flex-1 border-t border-gray-100 pt-3 mt-auto">
             <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Assigned IT Tools</p>
             <div className="flex flex-wrap gap-1.5">
                {user.assigned_systems.length > 0 ? (
                  user.assigned_systems.map((sys: any) => (
                    <span key={sys.id} className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-medium text-gray-700">
                      {sys.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No tools allocated</span>
                )}
              </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- RENDER FUNCTION: 5. COMPACT DIRECTORY VIEW ---
  const renderCompact = () => (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-y-auto h-full p-2 custom-scrollbar">
      <div className="divide-y divide-gray-100">
        {filteredUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
              <p className="font-semibold text-sm text-gray-900 truncate w-48 lg:w-64">{user.email}</p>
              <p className="text-xs text-gray-500 hidden md:block">| Joined: {user.onboarding_date || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-xs font-semibold text-gray-600 text-right w-40 truncate hidden sm:block">{user.department}</p>
              <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded text-[10px] font-bold w-20 text-center">
                {user.assigned_systems.length} Tools
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full min-h-[600px]">
      
      {/* Top Control Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-border pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-metric-value flex items-center">
            <Users className="h-5 w-5 mr-2 text-indigo-600" />
            Identity Matrix
          </h2>
          <p className="text-sm text-metric-label mt-1">Search municipal staff and map software access.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* CIO Search Bar */}
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search user email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>

          {/* VIEW SWITCHER ENGINE (5 Modes) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
            <button 
              onClick={() => setViewMode('kanban-dept')}
              title="Kanban (By Unit)"
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'kanban-dept' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Columns className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('kanban-system')}
              title="Kanban (By System)"
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'kanban-system' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Server className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            <button 
              onClick={() => setViewMode('table')}
              title="Data Table"
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              title="Card Grid"
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('compact')}
              title="Compact Directory"
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'compact' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <Button 
            onClick={handleDirectorySync} 
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Entra ID</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>

      {/* Dynamic View Injection */}
      <div className="flex-1 relative">
        {filteredUsers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white/50 rounded-xl border border-dashed border-gray-200">
            <Search className="h-10 w-10 mb-4 opacity-50" />
            <p className="font-medium text-gray-500">No municipal staff match your search query.</p>
          </div>
        ) : (
          <>
            {(viewMode === 'kanban-dept' || viewMode === 'kanban-system') && renderKanban()}
            {viewMode === 'table' && renderTable()}
            {viewMode === 'grid' && renderGrid()}
            {viewMode === 'compact' && renderCompact()}
          </>
        )}
      </div>

    </div>
  );
};