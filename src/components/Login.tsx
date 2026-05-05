import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Lock, ShieldCheck, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LoginProps {
  onLoginSuccess: (token: string, role: string, deptId?: number) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // TIP: Clear these defaults once you move to production
  const [email, setEmail] = useState('admin@organization.com');
  const [password, setPassword] = useState('Admin2026!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user.role, data.user.deptId);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Ensure server is running.');
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none"></div>

      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-500 relative z-10">
        
        {/* BRANDING HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-yellow-400/20 transform hover:scale-105 transition-transform">
            <Monitor className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-blue-500 tracking-tight">SAM</h1>
          <div className="flex items-center mt-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-500 mr-1.5" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Enterprise Architecture</p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center shadow-sm animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-wider mb-1.5">Work Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-inner" 
              placeholder="name@organization.com"
              required 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-inner" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-900 text-yellow-400 h-12 rounded-lg font-black shadow-lg transition-all border border-blue-800 hover:border-blue-700 mt-2" 
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin text-sky-300" /> Authenticating...</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" /> Secure Sign In</>
            )}
          </Button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Protected by Municipal Gov-Tech Framework
          </p>
        </div>
      </Card>
    </div>
  );
};

// Internal icon fallback just in case it's not imported at the top
function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}