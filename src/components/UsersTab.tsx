import React from 'react';
import { Card } from "@/components/ui/card";
import { User, Briefcase, ChevronRight } from "lucide-react";

interface UsersTabProps {
  users: any[];
}

export const UsersTab: React.FC<UsersTabProps> = ({ users }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-metric-value">Users & Access</h2>
        <p className="text-sm text-metric-label">Directory of synced employees and assigned software seats.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.length === 0 ? (
          <p className="text-sm text-metric-label italic py-8 border-2 border-dashed rounded-lg text-center">No users synced yet. Run a Connector sync from Admin.</p>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="p-4 bg-white border border-border hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-metric-label">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-metric-value">{user.email}</h3>
                    <div className="flex items-center space-x-3 text-xs text-metric-label mt-1">
                      <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {user.department || 'General'}</span>
                      <span>•</span>
                      <span>Joined {new Date(user.onboarding_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{user.active_licenses}</div>
                    <div className="text-[10px] text-metric-label uppercase font-medium">Licenses</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-metric-label" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};