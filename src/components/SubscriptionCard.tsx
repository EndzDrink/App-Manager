import React from 'react';
import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface SubscriptionCardProps {
  subscriptionName: string;
  cost: number;
  renewalDate: string;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscriptionName,
  cost,
  renewalDate,
}) => {
  return (
    <Card className="p-6 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">{subscriptionName}</h3>
        </div>
        <span className="text-2xl font-bold text-indigo-600">${cost.toFixed(2)}</span>
      </div>
      <p className="text-gray-600 flex-grow">
        Renews on: <span className="font-medium text-gray-800">{renewalDate}</span>
      </p>
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
          View Details
        </button>
      </div>
    </Card>
  );
};

export default SubscriptionCard;
