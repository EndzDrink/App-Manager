import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Users, RefreshCw, UserCheck, Search, Filter, 
  Briefcase, Network, ShieldCheck, AlertTriangle, 
  TrendingUp, Building2, Server, PieChart
} from "lucide-react";

interface UsersTabProps {
  users: any[];
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- STRICT TOP-DOWN CASCADING FILTERS ---
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

  // --- STRICT HIERARCHY ENGINE ---
  const municipalUnits = ["Information Management Unit (IMU)", "Water & Sanitation Unit", "Metro Police Unit", "Parks & Recreation Unit"];
  
  const imuDepartments = [
    "Enterprise Architecture", 
    "Applications/Dev", 
    "Networks", 
    "PMO", 
    "Security", 
    "GIS", 
    "Admin", 
    "Customer Service"
  ];
  
  const getUnitForDept = (deptName: string) => {
    if (!deptName || deptName === 'Unassigned') return "Other";
    if (imuDepartments.includes(deptName)) return "Information Management Unit (IMU)";
    const lower = deptName.toLowerCase();
    if (lower.includes("water") || lower.includes("sanitation")) return "Water & Sanitation Unit";
    if (lower.includes("police")) return "Metro Police Unit";
    if (lower.includes("park") || lower.includes("recreation")) return "Parks & Recreation Unit";
    return "Other";
  };

  // 1. Master Lists
  const allSystems = Array.from(new Set(users.flatMap(u => u.assigned_systems?.map((s:any) => s.name) || []))).sort();
  const allDepts = Array.from(new Set(users.map(u => u.department).filter(d => d && d !== 'Unassigned'))).sort();

  // 2. Available Units
  const availableUnits = municipalUnits.filter(unit => {
    if (systemFilter === "All") return true;
    return users.some(u => 
      getUnitForDept(u.department) === unit && 
      u.assigned_systems?.some((s:any) => s.name === systemFilter)
    );
  });

  // 3. Available Departments
  const availableDepts = allDepts.filter(dept => {
    if (unitFilter !== "All" && getUnitForDept(dept as string) !== unitFilter) return false;
    if (systemFilter !== "All") {
      const usersInThisDept = users.filter(u => u.department === dept);
      const deptUsesSystem = usersInThisDept.some(u => u.assigned_systems?.some((s:any) => s.name === systemFilter));
      if (!deptUsesSystem) return false;
    }
    return true;
  });

  // --- CASCADING RESET HANDLERS ---
  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemFilter(e.target.value);
    setUnitFilter("All"); 
    setDeptFilter("All"); 
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnitFilter(e.target.value);
    setDeptFilter("All"); 
  };

  // --- FINAL DATA FILTER FOR THE TABLE ---
  const filteredUsers = users.filter(user => {
    if (searchTerm && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (systemFilter !== "All" && !user.assigned_systems?.some((s:any) => s.name === systemFilter)) return false;
    if (unitFilter !== "All" && getUnitForDept(user.department) !== unitFilter) return false;
    if (deptFilter !== "All" && user.department !== deptFilter) return false;
    return true;
  });

  // --- NEW: ADOPTION ANALYTICS ENGINE (Runs only when a system is selected) ---
  let adoptionMetrics = null;
  if (systemFilter !== "All") {
    let totalProvisioned = 0;
    let activeCount = 0;
    const deptCounts: Record<string, number> = {};

    filteredUsers.forEach(user => {
      const sysData = user.assigned_systems?.find((s:any) => s.name === systemFilter);
      if (sysData) {
        totalProvisioned++;
        // Reusing your mock logic: > 30 days is abandoned/idle
        const mockDaysAgo = (user.id + sysData.id * 7) % 45; 
        const isActive = mockDaysAgo <= 30;
        
        if (isActive) {
          activeCount++;
          deptCounts[user.department] = (deptCounts[user.department] || 0) + 1;
        }
      }
    });

    const idleCount = totalProvisioned - activeCount;
    const adoptionRate = totalProvisioned > 0 ? Math.round((activeCount / totalProvisioned) * 100) : 0;
    
    let topDept = "None";
    let maxUsers = 0;
    Object.entries(deptCounts).forEach(([dept, count]) => {
      if (count > maxUsers) {
        maxUsers = count;
        topDept = dept;
      }
    });

    adoptionMetrics = { totalProvisioned, activeCount, idleCount, adoptionRate, topDept, maxUsers };
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full min-h-[600px] max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-gray-200 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-blue-900 flex items-center tracking-tight">
            <Users className="h-5 w-5 mr-2 text-blue-800" />
            Identity & Adoption Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Manage access and track software adoption across the municipality.</p>
        </div>
        <Button 
          onClick={handleDirectorySync} 
          disabled={isSyncing}
          className="bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold shadow-sm shrink-0 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin text-sky-400' : 'text-yellow-400'}`} />
          Sync Entra ID
        </Button>
      </div>

      {/* PACKAGED COMMAND TOOLBAR */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex flex-col xl:flex-row gap-4 items-center justify-between transition-colors hover:border-sky-200 shrink-0">
        
        <div className="relative w-full xl:max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-sky-500" />
          </div>
          <input
            type="text"
            placeholder="Search staff email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-blue-900 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          
          <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-sky-300 transition-colors flex-1 md:flex-none">
            <Server className="h-4 w-4 mr-2 text-blue-800 shrink-0" />
            <select
              className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer w-full truncate max-w-[150px]"
              value={systemFilter}
              onChange={handleSystemChange}
            >
              <option value="All">All Systems</option>
              {allSystems.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
            </select>
          </div>

          <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-sky-300 transition-colors flex-1 md:flex-none">
            <Network className="h-4 w-4 mr-2 text-blue-800 shrink-0" />
            <select
              className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer w-full truncate max-w-[150px]"
              value={unitFilter}
              onChange={handleUnitChange}
            >
              <option value="All">All Units</option>
              {availableUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </div>

          <div className="flex items-center shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-sky-300 transition-colors flex-1 md:flex-none">
            <Briefcase className="h-4 w-4 mr-2 text-blue-800 shrink-0" />
            <select
              className="bg-transparent text-xs font-bold text-blue-900 outline-none cursor-pointer w-full truncate max-w-[150px]"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {availableDepts.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* NEW: DYNAMIC ADOPTION ANALYTICS PANELS */}
      {adoptionMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0 animate-in slide-in-from-top-4 duration-300">
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center">
            <div className="bg-blue-50 p-3 rounded-lg mr-4">
              <PieChart className="h-6 w-6 text-blue-800" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Overall Adoption</p>
              <div className="flex items-baseline">
                <h3 className="text-xl font-black text-gray-900">{adoptionMetrics.adoptionRate}%</h3>
                <span className="text-xs font-bold text-gray-500 ml-2">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center">
            <div className="bg-sky-50 p-3 rounded-lg mr-4">
              <Building2 className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Primary Consumer</p>
              <h3 className="text-sm font-bold text-blue-900 truncate max-w-[150px]">{adoptionMetrics.topDept}</h3>
              <p className="text-xs font-bold text-gray-500">{adoptionMetrics.maxUsers} Active Seats</p>
            </div>
          </div>

          <div className={`bg-white border rounded-xl p-4 shadow-sm flex items-center ${adoptionMetrics.idleCount > 0 ? 'border-orange-200' : 'border-gray-200'}`}>
            <div className={`${adoptionMetrics.idleCount > 0 ? 'bg-orange-50' : 'bg-green-50'} p-3 rounded-lg mr-4`}>
              <AlertTriangle className={`h-6 w-6 ${adoptionMetrics.idleCount > 0 ? 'text-orange-500' : 'text-green-500'}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Optimization Opportunity</p>
              <h3 className={`text-xl font-black ${adoptionMetrics.idleCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {adoptionMetrics.idleCount} <span className="text-sm font-bold">Idle Licenses</span>
              </h3>
              {adoptionMetrics.idleCount > 0 && (
                <p className="text-[10px] font-bold text-orange-600/80">Available for reallocation</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* DENSE ENTERPRISE DATA TABLE */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        
        <div className="bg-blue-900 px-6 py-3 border-b border-blue-950 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-white">Displaying {filteredUsers.length} authorized personnel</span>
          {systemFilter !== 'All' && (
            <span className="text-[10px] font-bold text-blue-900 bg-yellow-400 px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
              Filtered View: {systemFilter}
            </span>
          )}
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar bg-gray-50">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-blue-900 text-[10px] uppercase tracking-widest font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
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
                  <td colSpan={4} className="px-6 py-24 text-center bg-white">
                    <Search className="h-10 w-10 text-sky-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-blue-900">No personnel records found.</p>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your active filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const unit = getUnitForDept(user.department);
                  return (
                    <tr key={user.id} className="hover:bg-sky-50/50 bg-white transition-colors group">
                      
                      {/* Column 1: Identity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors shadow-inner">
                            <UserCheck className="h-4 w-4 text-gray-500 group-hover:text-blue-800" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{user.email}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 font-bold">ID: ETH-{user.id.toString().padStart(5, '0')}</p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Structural Tracking */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 flex items-center">
                            <Network className="h-3 w-3 mr-1.5 text-sky-500" /> {unit}
                          </span>
                          <span className="text-[10px] font-bold text-blue-800 flex items-center mt-1.5 bg-blue-50 w-fit px-2 py-0.5 rounded shadow-sm border border-blue-100">
                            <Building2 className="h-2.5 w-2.5 mr-1 text-blue-600" /> {user.department}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Status / Onboarding */}
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col space-y-1.5">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 w-fit shadow-sm">
                             <ShieldCheck className="w-3 h-3 mr-1" /> Active
                           </span>
                           <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Since: {user.onboarding_date || 'N/A'}</span>
                         </div>
                      </td>

                      {/* Column 4: Dense Tags for Systems with Status Indicators */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2 max-w-md">
                          {user.assigned_systems?.length > 0 ? (
                            user.assigned_systems.map((sys: any) => {
                              
                              const mockDaysAgo = (user.id + sys.id * 7) % 45; 
                              const isAbandoned = mockDaysAgo > 30; 
                              
                              const dotColor = isAbandoned ? 'bg-red-500' : 'bg-green-500';
                              const borderColor = isAbandoned ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white';
                              const textColor = isAbandoned ? 'text-red-800 font-bold' : 'text-gray-700 font-semibold';
                              
                              const hoverText = isAbandoned 
                                ? `⚠️ INACTIVE: Last logged in ${mockDaysAgo} days ago` 
                                : `✅ ACTIVE: Last logged in ${mockDaysAgo === 0 ? 'Today' : mockDaysAgo + ' days ago'}`;

                              return (
                                <span 
                                  key={sys.id} 
                                  title={hoverText}
                                  className={`${borderColor} ${textColor} px-2 py-1 rounded-md text-[10px] shadow-sm flex items-center cursor-help transition-all hover:shadow-md hover:border-sky-300`}
                                >
                                  <span className={`h-2 w-2 rounded-full mr-1.5 ${dotColor} shadow-sm border border-white ${isAbandoned ? 'animate-pulse' : ''}`}></span>
                                  {sys.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold italic px-2 py-1 border border-dashed border-gray-300 rounded bg-gray-50">
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