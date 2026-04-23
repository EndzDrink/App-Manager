import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Users, RefreshCw, UserCheck, Search, Filter, 
  Briefcase, Network, ShieldCheck
} from "lucide-react";

interface UsersTabProps {
  users: any[];
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- SMART CASCADING FILTERS ---
  const [systemFilter, setSystemFilter] = useState<string>("All");
  const [unitFilter, setUnitFilter] = useState<string>("All"); 
  const [deptFilter, setDeptFilter] = useState<string>("All"); 

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

  // --- HIERARCHY ENGINE ---
  const municipalUnits = ["Information Management Unit (IMU)", "Water & Sanitation Unit", "Metro Police Unit", "Parks & Recreation Unit"];
  
  const getUnitForDept = (deptName: string) => {
    if (!deptName || deptName === 'Unassigned') return "Other";
    const lower = deptName.toLowerCase();
    if (lower.includes("it") || lower.includes("architecture")) return "Information Management Unit (IMU)";
    if (lower.includes("water") || lower.includes("sanitation")) return "Water & Sanitation Unit";
    if (lower.includes("police")) return "Metro Police Unit";
    if (lower.includes("park") || lower.includes("recreation")) return "Parks & Recreation Unit";
    return "Other";
  };

  // Extract global lists for filters
  const allSystems = Array.from(new Set(users.flatMap(u => u.assigned_systems?.map((s:any) => s.name) || [])));
  const allDepts = Array.from(new Set(users.map(u => u.department).filter(d => d && d !== 'Unassigned')));

  // 1. Cascading Options
  const availableUnits = municipalUnits.filter(unit => {
    if (systemFilter === "All") return true;
    const usersWithSystem = users.filter(u => u.assigned_systems?.some((s:any) => s.name === systemFilter));
    const validUnits = new Set<string>(usersWithSystem.map(u => getUnitForDept(u.department)));
    return validUnits.has(unit);
  });

  const availableDepts = allDepts.filter(dept => {
    if (systemFilter !== "All") {
      const usersWithSystem = users.filter(u => u.assigned_systems?.some((s:any) => s.name === systemFilter));
      if (!usersWithSystem.some(u => u.department === dept)) return false;
    }
    if (unitFilter !== "All" && getUnitForDept(dept) !== unitFilter) return false;
    return true;
  });

  // 2. Filter Handlers (Resetting children on parent change)
  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemFilter(e.target.value);
    setUnitFilter("All");
    setDeptFilter("All");
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnitFilter(e.target.value);
    setDeptFilter("All");
  };

  // 3. Final Master Data Filter
  const filteredUsers = users.filter(user => {
    if (searchTerm && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (systemFilter !== "All" && !user.assigned_systems?.some((s:any) => s.name === systemFilter)) return false;
    if (unitFilter !== "All" && getUnitForDept(user.department) !== unitFilter) return false;
    if (deptFilter !== "All" && user.department !== deptFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full min-h-[600px]">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-border pb-4 shrink-0">
        
        {/* LEFT: TITLE */}
        <div>
          <h2 className="text-xl font-semibold text-metric-value flex items-center">
            <Users className="h-5 w-5 mr-2 text-indigo-600" />
            Master Identity Matrix
          </h2>
          <p className="text-sm text-metric-label mt-1">Single source of truth for municipal staff access and structure.</p>
        </div>

        {/* RIGHT: ALL CONTROLS (Filters + Search + Sync) */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          
          {/* SMART CASCADING FILTERS */}
          <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-3 text-gray-400 border-r border-gray-100 flex items-center bg-gray-50/50 rounded-l-lg h-9">
              <Filter className="h-4 w-4" />
            </div>
            <select 
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-r border-gray-100 px-3 h-9 hover:bg-gray-50 transition-colors max-w-[140px] truncate" 
              value={systemFilter} onChange={handleSystemChange}
            >
              <option value="All">All Systems</option>
              {allSystems.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
            </select>
            <select 
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-r border-gray-100 px-3 h-9 hover:bg-gray-50 transition-colors max-w-[140px] truncate" 
              value={unitFilter} onChange={handleUnitChange}
            >
              <option value="All">All Units</option>
              {availableUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
            <select 
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer px-3 h-9 hover:bg-gray-50 transition-colors rounded-r-lg max-w-[140px] truncate" 
              value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {availableDepts.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
            </select>
          </div>
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search staff email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm h-9"
            />
          </div>

          <Button 
            onClick={handleDirectorySync} 
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Entra ID</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>

      {/* DENSE ENTERPRISE DATA TABLE */}
      <div className="flex-1 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        
        {/* Results Counter */}
        <div className="bg-gray-50/50 px-6 py-2.5 border-b border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>Displaying {filteredUsers.length} authorized personnel</span>
          {systemFilter !== 'All' && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Filtered by: {systemFilter}</span>}
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-metric-label text-[10px] uppercase tracking-widest font-bold border-b border-border sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Employee Identity</th>
                <th className="px-6 py-4">Organizational Path</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Enterprise Systems (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 overflow-y-auto">
              
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No personnel records found matching your exact filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const unit = getUnitForDept(user.department);
                  return (
                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                      
                      {/* Column 1: Identity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center transition-colors">
                            <UserCheck className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.email}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">ID: ETH-{user.id.toString().padStart(5, '0')}</p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Structural Tracking */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-800 flex items-center">
                            <Network className="h-3 w-3 mr-1.5 text-gray-400" /> {unit}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 flex items-center mt-1 bg-indigo-50 w-fit px-1.5 py-0.5 rounded">
                            <Briefcase className="h-2.5 w-2.5 mr-1" /> {user.department}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Status / Onboarding */}
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col space-y-1">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 w-fit">
                             <ShieldCheck className="w-3 h-3 mr-1" /> Active
                           </span>
                           <span className="text-[10px] text-gray-500 font-medium">Since: {user.onboarding_date || 'N/A'}</span>
                         </div>
                      </td>

                      {/* Column 4: Dense Tags for Systems with Status Indicators */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2 max-w-md">
                          {user.assigned_systems?.length > 0 ? (
                            user.assigned_systems.map((sys: any) => {
                              
                              // --- DEMO STATUS ENGINE ---
                              const mockDaysAgo = (user.id + sys.id * 7) % 45; 
                              const isAbandoned = mockDaysAgo > 30; 
                              
                              const dotColor = isAbandoned ? 'bg-red-500 animate-pulse' : 'bg-green-500';
                              const borderColor = isAbandoned ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white';
                              const textColor = isAbandoned ? 'text-red-700' : 'text-gray-700';
                              
                              const hoverText = isAbandoned 
                                ? `⚠️ INACTIVE: Last logged in ${mockDaysAgo} days ago` 
                                : `✅ ACTIVE: Last logged in ${mockDaysAgo === 0 ? 'Today' : mockDaysAgo + ' days ago'}`;

                              return (
                                <span 
                                  key={sys.id} 
                                  title={hoverText}
                                  className={`${borderColor} ${textColor} px-2 py-1 rounded text-[10px] font-semibold shadow-sm flex items-center cursor-help transition-all hover:shadow-md`}
                                >
                                  <span className={`h-2 w-2 rounded-full mr-1.5 ${dotColor} shadow-sm border border-white`}></span>
                                  {sys.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium italic px-2 py-0.5 border border-dashed border-gray-300 rounded">
                              No provisioned licenses
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};