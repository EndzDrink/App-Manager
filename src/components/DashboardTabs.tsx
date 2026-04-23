import { cn } from "@/lib/utils";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: string;
}

export const DashboardTabs = ({ activeTab, onTabChange, role }: DashboardTabsProps) => {
  const allTabs = [
    { id: "dashboard", label: "Dashboard", allowedRoles: ['SuperAdmin', 'DepartmentHead', 'StandardUser'] },
    { id: "systems", label: "Enterprise Systems", allowedRoles: ['SuperAdmin', 'DepartmentHead', 'StandardUser'] }, 
    { id: "subscriptions", label: "Subscriptions", allowedRoles: ['SuperAdmin', 'DepartmentHead'] },
    { id: "users", label: "Users", allowedRoles: ['SuperAdmin', 'DepartmentHead'] },
    { id: "recommendations", label: "Recommendations", allowedRoles: ['SuperAdmin', 'DepartmentHead'] },
    { id: "audit", label: "Audit", allowedRoles: ['SuperAdmin', 'DepartmentHead'] },
    { id: "admin", label: "Admin", allowedRoles: ['SuperAdmin'] },
  ];

  const visibleTabs = allTabs.filter(tab => tab.allowedRoles.includes(role));

  return (
    <div className="flex space-x-1 mb-8 border-b border-gray-200 overflow-x-auto pb-px">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
            activeTab === tab.id
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};