import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Register } from "./pages/Register";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary"; 

const queryClient = new QueryClient();

const App = () => {
  
  // --- THE ENTERPRISE 401 INTERCEPTOR ---
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // If the backend rejects the token (expired or tampered with)
      if (response.status === 401) {
        const currentToken = localStorage.getItem('appManagerToken');
        
        // Only trigger the logout sequence if they actually had a token
        if (currentToken) {
          console.warn("🔐 Security Protocol: Session Expired. Intercepted 401 Unauthorized.");
          
          // 1. Purge the dead credentials immediately
          localStorage.removeItem('appManagerToken');
          localStorage.removeItem('appManagerRole');
          localStorage.removeItem('appManagerDeptId');

          // 2. Fire a high-visibility security toast
          toast.error("Session Expired", {
            description: "For your security, you have been logged out. Please sign in again.",
            duration: 5000,
          });

          // 3. Force route back to the login screen after a brief delay
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
      }

      return response;
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Wrap the entire application in the blast shield */}
        <ErrorBoundary>
          <Toaster />
          {/* Configured Sonner for enterprise-grade alerts */}
          <Sonner position="top-center" richColors theme="light" />
          
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;