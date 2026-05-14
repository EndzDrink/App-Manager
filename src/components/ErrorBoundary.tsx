import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 Enterprise UI Crash Intercepted:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-blue-900 mb-2 tracking-tight">Module Offline</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              The Smart Analytics Manager encountered an unexpected UI error. Your data is perfectly safe, but this specific interface crashed.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-lg text-left overflow-auto mb-8 max-h-32 text-[10px] font-mono text-red-800 border border-red-100 shadow-inner">
              {this.state.error?.message || "Unknown rendering error"}
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-[#00a9e0] hover:bg-[#008bc6] text-white font-bold shadow-md"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Reload Engine
              </Button>
              <Button 
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} 
                variant="outline" 
                className="border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
              >
                <Home className="h-4 w-4 mr-2" /> Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}