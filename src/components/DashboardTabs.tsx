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
    <div className="border-b border-border mb-8">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "border-nav-active text-nav-active"
                : "border-transparent text-nav-inactive hover:text-nav-active"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};