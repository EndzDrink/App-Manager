import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';

export const OnboardingForm = ({ onUserAdded }: { onUserAdded: () => void }) => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'StandardUser', department_id: '1' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('appManagerToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert("User Onboarded Successfully");
      onUserAdded();
    }
  };

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-sm max-w-md">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center"><UserPlus className="h-4 w-4 mr-2"/> Onboard New User</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-2 rounded text-sm" placeholder="Work Email" onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input className="w-full border p-2 rounded text-sm" type="password" placeholder="Temporary Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
        <select className="w-full border p-2 rounded text-sm" onChange={e => setFormData({...formData, role: e.target.value})}>
          <option value="StandardUser">Standard User</option>
          <option value="DepartmentHead">Department Head</option>
          <option value="PMOLead">PMO Lead</option>
          <option value="EA">Enterprise Architect</option>
        </select>
        <Button className="w-full bg-blue-800 text-white font-bold h-9 text-xs">Create Identity</Button>
      </form>
    </Card>
  );
};