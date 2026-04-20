import React from 'react';
import { Card } from "@/components/ui/card";
import { Monitor } from "lucide-react";

// Define the props for the AppCard component
interface AppCardProps {
  appName: string;
  description: string;
  status: 'active' | 'inactive';
}

const AppCard: React.FC<AppCardProps> = ({ appName, description, status }) => {
  return (
    <Card className="p-6 flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
          <Monitor className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold">{appName}</h3>
      </div>
      <p className="text-gray-600 flex-grow">{description}</p>
      <div className="flex items-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </div>
    </Card>
  );
};

export default AppCard;
