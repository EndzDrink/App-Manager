import { useState } from "react";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "apps", label: "Apps" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "recommendations", label: "Recommendations" },
  { id: "admin", label: "Admin" },
];

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  return (
    // The container no longer has a bottom border
    <div className="mb-8">
      <nav className="flex space-x-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            // Conditional classes for active and inactive tabs
            className={`
              py-2 px-6 rounded-full font-medium text-sm transition-colors duration-200
              ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 border border-gray-300 shadow-sm" // Active state styling
                  : "text-gray-500 hover:text-gray-900" // Inactive state styling
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
export default DashboardTabs;
