import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Lock } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@organization.com');
  const [password, setPassword] = useState('Admin2026!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user.role);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Ensure server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white border border-border shadow-xl rounded-2xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <Monitor className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AppManager OS</h1>
          <p className="text-sm text-gray-500">Secure Enterprise Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              required 
            />
          </div>
          
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium shadow-sm transition-all" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : <><Lock className="w-4 h-4 mr-2" /> Secure Sign In</>}
          </Button>
        </form>
      </Card>
    </div>
  );
};