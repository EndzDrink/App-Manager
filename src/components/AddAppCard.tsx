import React from 'react';
import { Plus } from 'lucide-react'; 
import { Card } from "@/components/ui/card"; 

interface AddAppCardProps {
  onClick: () => void;
}

const AddAppCard: React.FC<AddAppCardProps> = ({ onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] h-full bg-gray-50/50 border-2 border-dashed border-gray-300 hover:bg-indigo-50/30 hover:border-indigo-400 hover:shadow-md transition-all duration-300 group rounded-xl"
    >
      <div className="w-12 h-12 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 group-hover:scale-110 transition-all duration-300 mb-3">
        <Plus className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-gray-700 group-hover:text-indigo-800 transition-colors text-base">
        Register System
      </h3>
      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 group-hover:text-indigo-400 mt-1">
        Add to IT Catalog
      </p>
    </Card>
  );
};

export default AddAppCard;