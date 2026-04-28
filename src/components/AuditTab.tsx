import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileSearch, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Building2, 
  Loader2,
  Scale,
  Mail,
  GitMerge,
  X,
  ArrowRight,
  Send,
  Settings2,
  ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuditTabProps {
  duplications: any[];
  deptSpend: any[];
  onDepartmentClick: (id: number) => void;
}

type ResolutionStep = 'select' | 'notifying' | 'notify-success' | 'consolidate-config' | 'consolidating' | 'consolidate-success';

export const AuditTab: React.FC<AuditTabProps> = ({ duplications, deptSpend, onDepartmentClick }) => {
  // Gatekeeper States
  const [specText, setSpecText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | 'clean' | 'flagged'>(null);

  // Action Center Packaging States
  const [activeSideTab, setActiveSideTab] = useState<'duplications' | 'departments'>('duplications');
  
  // Resolution Workflow States
  const [selectedDuplicate, setSelectedDuplicate] = useState<any | null>(null);
  const [resolutionStep, setResolutionStep] = useState<ResolutionStep>('select');
  const [primarySystem, setPrimarySystem] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');
  
  // State to track which duplications have been resolved locally
  const [resolvedCategories, setResolvedCategories] = useState<string[]>([]);

  // Simulated AI Scanning Process
  const handleRunScan = () => {
    if (!specText.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      const lowerSpec = specText.toLowerCase();
      if (lowerSpec.includes('hr') || lowerSpec.includes('human resource') || lowerSpec.includes('leave') || lowerSpec.includes('payroll')) {
        setScanResult('flagged');
      } else {
        setScanResult('clean');
      }
    }, 2500);
  };

  const clearScan = () => {
    setSpecText('');
    setScanResult(null);
  };

  // --- WORKFLOW HANDLERS ---
  const openResolutionModal = (dup: any) => {
    setSelectedDuplicate(dup);
    setResolutionStep('select');
    setPrimarySystem(dup.systems?.[0] || '');
  };

  const closeResolutionModal = () => {
    if (resolutionStep === 'notify-success' || resolutionStep === 'consolidate-success') {
      if (selectedDuplicate) {
        setResolvedCategories(prev => [...prev, selectedDuplicate.category]);
      }
    }
    
    setSelectedDuplicate(null);
    setTimeout(() => setResolutionStep('select'), 300);
  };

  const handleNotifyPMO = () => {
    setResolutionStep('notifying');
    setTimeout(() => {
      setTicketId(`PMO-REQ-${Math.floor(1000 + Math.random() * 9000)}`);
      setResolutionStep('notify-success');
    }, 2000);
  };

  const handleConsolidateStep1 = () => {
    setResolutionStep('consolidate-config');
  };

  const handleExecuteConsolidation = () => {
    setResolutionStep('consolidating');
    setTimeout(() => {
      setTicketId(`EA-MERGE-${Math.floor(10000 + Math.random() * 90000)}`);
      setResolutionStep('consolidate-success');
    }, 2500);
  };

  const displayDuplications = duplications.filter(dup => !resolvedCategories.includes(dup.category));

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      
      <div className="mb-4 pb-3 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-bold text-blue-900 flex items-center tracking-tight">
          <ShieldCheck className="h-5 w-5 mr-2 text-blue-800" />
          Audit & Compliance Center
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">Pre-procurement gatekeeper and active resolution tracking</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN (Span 2): The Tender Gatekeeper */}
        <Card className="xl:col-span-2 border border-sky-200 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col h-full">
          <div className="bg-blue-900 px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center text-white">
              <div className="bg-yellow-400 p-1.5 rounded-lg mr-3 shadow-sm">
                <FileSearch className="h-4 w-4 text-blue-900" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Tender Gatekeeper</h2>
                <p className="text-[9px] text-blue-200 uppercase tracking-widest font-bold">ToR Overlap Scanner</p>
              </div>
            </div>
            <span className="bg-blue-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-700">CIO Checkpoint</span>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            
            <div className="flex flex-col h-full">
              <label className="text-xs font-bold text-gray-800 mb-1.5 flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-sky-500" /> 
                Paste Business Requirements
              </label>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                Scan specifications against the EA Catalog to block duplicate procurement before tender phase.
              </p>
              
              <textarea 
                className="w-full flex-1 min-h-[150px] p-3 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-none custom-scrollbar"
                placeholder="e.g., 'We require a cloud-based system to manage employee leave requests...'"
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                disabled={isScanning || scanResult !== null}
              ></textarea>

              {!scanResult ? (
                <Button 
                  onClick={handleRunScan} 
                  disabled={!specText.trim() || isScanning}
                  className="mt-4 w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-10 shadow-sm transition-all"
                >
                  {isScanning ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin text-yellow-400" /> Analyzing Catalog...</>
                  ) : (
                    <><Scale className="h-4 w-4 mr-2 text-yellow-400" /> Run Compliance Scan</>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={clearScan} 
                  variant="outline"
                  className="mt-4 w-full border-gray-300 text-gray-600 hover:bg-gray-50 h-10 font-bold"
                >
                  Clear & Run New Scan
                </Button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col justify-center relative overflow-y-auto custom-scrollbar">
              
              {!isScanning && scanResult === null && (
                <div className="text-center text-gray-400">
                  <UploadCloud className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold text-gray-500">Awaiting Requirements</p>
                </div>
              )}

              {isScanning && (
                <div className="text-center">
                  <div className="relative w-12 h-12 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-800 border-t-transparent animate-spin"></div>
                    <FileSearch className="absolute inset-0 m-auto h-5 w-5 text-sky-500 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-blue-900">Cross-referencing municipal systems...</p>
                </div>
              )}

              {scanResult === 'flagged' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start shadow-sm">
                    <XCircle className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-red-900 text-sm">Procurement Blocked</h3>
                      <p className="text-[10px] text-red-700 mt-0.5 leading-tight">
                        <strong>82% capability overlap</strong> detected. Proceeding will result in wasteful expenditure.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Existing Capable Systems</h4>
                      <div className="bg-white border border-gray-200 rounded-md p-2 shadow-sm flex justify-between items-center">
                        <div className="flex items-center">
                          <Building2 className="h-3.5 w-3.5 text-blue-800 mr-1.5" />
                          <span className="text-xs font-bold text-gray-900">Oracle HRMS Core</span>
                        </div>
                        <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">Licensed</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" /> CIO Signature History
                      </h4>
                      <div className="bg-white border border-orange-200 border-l-4 border-l-orange-500 rounded-md p-2 shadow-sm">
                        <p className="text-[10px] text-gray-700 leading-relaxed">
                          Similar ToR approved for <strong>Parks & Rec</strong> on <span className="font-bold">12 Feb 2026</span>. Consult PMO to extend existing license.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {scanResult === 'clean' && (
                <div className="animate-in slide-in-from-right-4 duration-300 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-green-800 text-base">Cleared for Procurement</h3>
                  <p className="text-xs text-gray-600 mt-1 max-w-[200px] mx-auto">
                    No existing systems fulfill these requirements.
                  </p>
                  <div className="mt-4 inline-flex bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500">
                      Audit Token: <span className="text-blue-900 font-mono">EA-CHK-20260428-A7X</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </Card>

        {/* RIGHT COLUMN (Span 1): The Packaged Action Center */}
        <Card className="xl:col-span-1 border border-gray-200 shadow-sm rounded-xl bg-white flex flex-col h-full overflow-hidden">
          
          <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
            <button 
              onClick={() => setActiveSideTab('duplications')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex justify-center items-center transition-colors ${activeSideTab === 'duplications' ? 'bg-white text-blue-900 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Overlaps
              {displayDuplications.length > 0 && <span className="ml-1.5 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[9px]">{displayDuplications.length}</span>}
            </button>
            <button 
              onClick={() => setActiveSideTab('departments')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex justify-center items-center transition-colors ${activeSideTab === 'departments' ? 'bg-white text-blue-900 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> Dept Flags
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white">
            
            {activeSideTab === 'duplications' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">Click on a detected overlap to initiate a resolution workflow.</p>
                
                {displayDuplications.length > 0 ? (
                  displayDuplications.map((dup, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => openResolutionModal(dup)}
                      className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group animate-in fade-in"
                    >
                      <div className="flex-1 pr-3">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{dup.category || 'Uncategorized'}</p>
                        <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[180px]">
                          {dup.systems?.join ? dup.systems.join(' vs ') : 'Multiple systems'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 group-hover:bg-blue-800 group-hover:text-yellow-400 group-hover:border-blue-900 transition-colors flex items-center">
                        Resolve <ArrowRight className="h-2.5 w-2.5 ml-1" />
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
                    <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-800 font-bold">All Overlaps Resolved</p>
                    <p className="text-xs text-gray-500 mt-1">Pending tickets are tracking in the PMO queue.</p>
                  </div>
                )}
              </div>
            )}

            {activeSideTab === 'departments' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">Departments flagged for excessive software burn rate.</p>
                {deptSpend.length > 0 ? (
                  deptSpend.map((dept, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => onDepartmentClick(dept.id)}
                      className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors group"
                    >
                      <div>
                        {/* FIX: Corrected mapping to pick up department name correctly */}
                        <p className="text-xs font-bold text-blue-900">{dept.department || dept.name || 'Unknown Department'}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          ZAR {typeof dept.spend === 'number' ? dept.spend.toFixed(2) : '0.00'} active burn
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-sky-600 hover:text-sky-700 px-2 h-7 group-hover:bg-white border border-transparent group-hover:border-sky-200 shadow-sm transition-all">
                        Audit Dashboard
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShieldCheck className="h-8 w-8 text-green-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold">All departments compliant.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* DYNAMIC RESOLUTION WORKFLOW MODAL */}
      {selectedDuplicate && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-blue-900 text-white">
              <div className="flex items-center font-bold text-sm">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" /> Overlap Resolution Matrix
              </div>
              <button onClick={closeResolutionModal} className="text-blue-200 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
            
            {resolutionStep === 'select' && (
              <div className="p-6 animate-in fade-in duration-300">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Conflict Category</p>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedDuplicate.category}</h3>
                
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6 shadow-inner">
                  <p className="text-xs text-orange-800 font-medium mb-2">The following systems are currently active and performing identical functions across departments:</p>
                  <div className="flex flex-col gap-2">
                    {selectedDuplicate.systems?.map((sys: string, i: number) => (
                      <div key={i} className="bg-white px-3 py-1.5 rounded border border-orange-100 text-sm font-bold text-gray-700 shadow-sm flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div> {sys}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Action Required</p>
                  <Button onClick={handleNotifyPMO} className="w-full bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex justify-between items-center h-12 group transition-all">
                    <div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-yellow-400 group-hover:scale-110 transition-transform" /> Notify PMO (pmo@durban.gov.za)</div>
                    <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Button>
                  <Button onClick={handleConsolidateStep1} variant="outline" className="w-full border-blue-200 text-blue-800 hover:bg-sky-50 shadow-sm flex justify-between items-center h-12 group transition-all">
                    <div className="flex items-center"><GitMerge className="h-4 w-4 mr-2 text-sky-500 group-hover:scale-110 transition-transform" /> Initiate License Consolidation Request</div>
                    <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Button>
                </div>
              </div>
            )}

            {resolutionStep === 'notifying' && (
              <div className="p-10 text-center animate-in fade-in duration-300">
                <Send className="h-10 w-10 text-sky-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-sm font-bold text-blue-900 mb-1">Drafting Communication...</h3>
                <p className="text-xs text-gray-500">Connecting to eThekwini mail servers and attaching catalog dependencies.</p>
              </div>
            )}

            {resolutionStep === 'notify-success' && (
              <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">PMO Successfully Notified</h3>
                <p className="text-xs text-gray-600 mb-4">The PMO has received the architectural overlap warning for the <strong>{selectedDuplicate.category}</strong> category.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 inline-block mb-6 shadow-inner">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Service Desk Ticket</p>
                  <p className="text-sm font-mono font-bold text-blue-900">{ticketId}</p>
                </div>
                <Button onClick={closeResolutionModal} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-10">
                  Close & Await Resolution
                </Button>
              </div>
            )}

            {resolutionStep === 'consolidate-config' && (
              <div className="p-6 animate-in slide-in-from-right-4 duration-300">
                <button onClick={() => setResolutionStep('select')} className="text-xs font-bold text-blue-600 hover:text-blue-800 mb-4 flex items-center transition-colors">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </button>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Architecture Consolidation</h3>
                <p className="text-xs text-gray-500 mb-6">Select which system should be retained as the Enterprise Standard.</p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-2 flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-1.5 text-sky-500" /> Target Primary System
                    </label>
                    <select 
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-sm"
                      value={primarySystem}
                      onChange={(e) => setPrimarySystem(e.target.value)}
                    >
                      {selectedDuplicate.systems?.map((sys: string) => (
                        <option key={sys} value={sys}>{sys}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-red-800 leading-relaxed">
                      Systems not selected above will have their licenses restricted and migration workflows will be triggered.
                    </p>
                  </div>
                </div>

                <Button onClick={handleExecuteConsolidation} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-12 shadow-sm">
                  <Settings2 className="h-4 w-4 mr-2 text-yellow-400" /> Execute Consolidation
                </Button>
              </div>
            )}

            {resolutionStep === 'consolidating' && (
              <div className="p-10 text-center animate-in fade-in duration-300">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
                  <GitMerge className="absolute inset-0 m-auto h-6 w-6 text-blue-900 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">Merging Architectural Data...</h3>
                <p className="text-xs text-gray-500">Updating IAM policies and scheduling deprecation cycles.</p>
              </div>
            )}

            {resolutionStep === 'consolidate-success' && (
              <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Consolidation Scheduled</h3>
                <p className="text-xs text-gray-600 mb-4">
                  <strong>{primarySystem}</strong> has been flagged as the enterprise standard.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 inline-block mb-6 shadow-inner">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Merge Request ID</p>
                  <p className="text-sm font-mono font-bold text-blue-900">{ticketId}</p>
                </div>
                <Button onClick={closeResolutionModal} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-10">
                  Acknowledge & Close
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};