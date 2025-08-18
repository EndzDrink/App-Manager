import React from 'react';
import { Plus } from 'lucide-react'; // Assuming lucide-react is installed
import { Card } from "@/components/ui/card"; // Import the Card component

// Define the props for the AddAppCard component
interface AddAppCardProps {
  onClick: () => void;
}

// The AddAppCard component is a button-like card for adding new applications.
const AddAppCard: React.FC<AddAppCardProps> = ({ onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="p-6 flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
    >
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        <Plus className="h-6 w-6" />
      </div>
      <p className="text-gray-500 font-semibold">Add New App</p>
    </Card>
  );
};

export default AddAppCard;
