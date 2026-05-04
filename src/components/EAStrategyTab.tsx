import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, AlertTriangle, CheckCircle, XCircle, 
  BarChart3, Info, Fingerprint 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EARequest {
  id: number;
  system: string;
  requester: string;
  dept: string;
  score: number;
  status: string;
  timeInStage: string;
}

export const EAStrategyTab = () => {
  const [requests, setRequests] = useState<EARequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EARequest | null>(null);
  const [score, setScore] = useState(50);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REAL DATA PIPELINE: Fetching requests from the DB that specifically need EA vetting
  const fetchPendingVetting = async () => {
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter specifically for EA status
        if (Array.isArray(data)) {
          setRequests(data.filter((r: EARequest) => r.status === 'Awaiting EA Vetting'));
        }
      }
    } catch (err) {
      console.error("Failed to fetch pending EA requests:", err);
    }
  };

  useEffect(() => { 
    fetchPendingVetting(); 
  }, []);

  // Ensure state resets when clicking a different request in the queue
  const handleSelectRequest = (req: EARequest) => {
    setSelectedRequest(req);
    setScore(50);
    setComments("");
  };

  const handleVetting = async (status: 'Approved' | 'Vetoed') => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('appManagerToken');
      const res = await fetch(`${API_URL}/api/requests/${selectedRequest.id}/vetting`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alignment_score: score,
          ea_status: status,
          ea_comments: comments
        })
      });
      
      if (res.ok) {
        // Clear selection and refresh queue
        setSelectedRequest(null);
        setScore(50);
        setComments("");
        fetchPendingVetting();
      } else {
        const errorData = await res.json();
        alert(`Vetting failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Vetting failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. EA Portfolio Health Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-blue-600 bg-white">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Strategic Alignment</p>
              <h3 className="text-xl font-bold text-gray-900">84.2% Average</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-yellow-500 bg-white">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Legacy Debt</p>
              <h3 className="text-xl font-bold text-gray-900">12 Sunset Systems</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-green-500 bg-white">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Architecture Vetting</p>
              <h3 className="text-xl font-bold text-gray-900">100% Compliant</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 2. Pending Requests List */}
        <Card className="p-6 bg-white border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-blue-900 flex items-center">
              <Fingerprint className="h-5 w-5 mr-2" /> Pending Strategic Reviews
            </h2>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {requests.length} in Queue
            </span>
          </div>
          
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="py-10 text-center">
                <ShieldCheck className="h-10 w-10 text-green-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-500">Zero Pending Requests</p>
                <p className="text-xs text-gray-400 mt-1">All CRM demand has been successfully aligned.</p>
              </div>
            ) : (
              requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => handleSelectRequest(req)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 bg-white shadow-sm hover:shadow'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">REQ-{req.id}</p>
                      <p className="font-bold text-blue-900 text-sm">{req.system || "New System Request"}</p>
                      <p className="text-xs text-gray-500 mt-1">Requested by: <span className="font-medium text-gray-700">{req.requester}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded uppercase border border-yellow-200">Pending EA</span>
                      <span className="text-[10px] text-gray-400 font-medium">{req.timeInStage || 'Just logged'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 3. Vetting Console */}
        <div className="sticky top-6">
          <Card className="p-6 bg-white border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-blue-900 mb-6 border-b border-gray-100 pb-3">Alignment Vetting Console</h2>
            {selectedRequest ? (
              <div className="space-y-8">
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Capability</p>
                   <p className="text-base font-bold text-gray-900">{selectedRequest.system}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Strategic Alignment Score: <span className={`ml-2 px-2 py-1 rounded text-white ${score > 70 ? 'bg-green-500' : score > 40 ? 'bg-orange-500' : 'bg-red-500'}`}>{score}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" value={score} 
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${score > 70 ? 'accent-green-600 bg-green-100' : score > 40 ? 'accent-orange-500 bg-orange-100' : 'accent-red-600 bg-red-100'}`}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase">
                    <span>Legacy / High Debt</span>
                    <span>Modern / Aligned</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Architecture Decision Comments</label>
                  <textarea 
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm h-28 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner bg-white placeholder-gray-300"
                    placeholder="Provide justification for the alignment score. This will be visible to the CRM and PMO..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button 
                    onClick={() => handleVetting('Approved')}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
                  >
                    {isSubmitting ? 'Processing...' : <><CheckCircle className="w-4 h-4 mr-2" /> Approve for PMO</>}
                  </Button>
                  <Button 
                    onClick={() => handleVetting('Vetoed')}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold shadow-sm"
                  >
                    {isSubmitting ? 'Processing...' : <><XCircle className="w-4 h-4 mr-2" /> Veto Request</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Info className="h-8 w-8 text-blue-200 mb-3" />
                <p className="text-sm font-bold text-gray-500">No Request Selected</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Select a pending application from the queue to begin alignment scoring.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};