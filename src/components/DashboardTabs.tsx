import { cn } from "@/lib/utils";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "apps", label: "Apps" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "users", label: "Users" },
    { id: "recommendations", label: "Recommendations" },
    { id: "audit", label: "Audit" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <div className="flex space-x-1 mb-8 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
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