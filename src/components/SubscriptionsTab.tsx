import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, CalendarX } from "lucide-react";

interface SubscriptionsTabProps {
  subscriptions: any[];
  onAddSubscription: () => void;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ subscriptions, onAddSubscription }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Active Licenses & Renewals</h2>
          <p className="text-sm text-metric-label">Track software costs, associated projects, and contract end dates.</p>
        </div>
        <Button onClick={onAddSubscription} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Procure License
        </Button>
      </div>

      <Card className="bg-white border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-metric-label text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Enterprise System</th>
                <th className="px-6 py-4">Associated PMO Project</th>
                <th className="px-6 py-4">Monthly Burn</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Contract End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((sub, i) => {
                // Warning logic: Is the end date within the next 30 days?
                const isExpiring = sub.end_date && new Date(sub.end_date).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={sub.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-semibold text-metric-value">{sub.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{sub.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sub.project_name ? (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium text-xs border border-indigo-100">
                          {sub.project_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Operational (Non-Project)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-metric-value">
                      ZAR {parseFloat(sub.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                      {sub.start_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {sub.end_date ? (
                        <div className={`flex items-center space-x-1.5 text-xs font-bold ${isExpiring ? 'text-red-600' : 'text-gray-600'}`}>
                          {isExpiring && <CalendarX className="h-4 w-4" />}
                          <span>{sub.end_date}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Auto-Renews / Ongoing</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic bg-gray-50/50">
                    No active licenses found matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};