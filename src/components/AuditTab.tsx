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
  Settings2,
  ArrowLeft,
  Activity,
  Network,
  Lock,
  GitPullRequest,
  Copy,
  FileCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuditTabProps {
  duplications: any[];
  deptSpend: any[];
  onDepartmentClick: (id: number) => void;
  systems: any[]; 
}

type ResolutionStep = 'select' | 'notifying' | 'notify-success' | 'consolidate-config' | 'consolidating' | 'consolidate-success';
type ExecutiveView = 'operations' | 'ag-matrix';

export const AuditTab: React.FC<AuditTabProps> = ({ duplications, deptSpend, onDepartmentClick, systems }) => {
  const [executiveView, setExecutiveView] = useState<ExecutiveView>('operations');
  const [specText, setSpecText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | 'clean' | 'flagged'>(null);
  const [detectedSystem, setDetectedSystem] = useState<string>('');
  const [detectedReason, setDetectedReason] = useState<string>('');
  const [activeSideTab, setActiveSideTab] = useState<'duplications' | 'departments'>('duplications');
  
  const [selectedDuplicate, setSelectedDuplicate] = useState<any | null>(null);
  const [selectedAlignment, setSelectedAlignment] = useState<any | null>(null);
  const [resolutionStep, setResolutionStep] = useState<ResolutionStep>('select');
  const [primarySystem, setPrimarySystem] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');
  const [activeResolutions, setActiveResolutions] = useState<Record<string, string>>({});

  // TENDER GATEKEEPER SECURITY STATES
  const [clearanceToken, setClearanceToken] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // AG COMPLIANCE MATRIX STATES (Now Mutable for active remediation)
  const [isHandingOver, setIsHandingOver] = useState(false);
  const [alignmentData, setAlignmentData] = useState([
    { 
      id: "PRJ-2026-782", 
      name: "e-Sign Expansion (DocuSign)", 
      ea_strategy: "Paperless Municipality", 
      status: "Orphan", 
      payer: "UNASSIGNED", 
      risk: "Critical",
      next_step: "DD of Finance must assign an Operational Budget Code to transition from EA Pilot budget to Sustenance budget.",
      owner: "Finance / IMU"
    },
    { 
      id: "PRJ-2026-112", 
      name: "SAP S/4HANA Migration", 
      ea_strategy: "Financial Integrity", 
      status: "Aligned", 
      payer: "Finance Dept", 
      risk: "Low",
      next_step: "Regular quarterly license true-up required in July 2026.",
      owner: "Finance Unit"
    },
    { 
      id: "PRJ-2026-809", 
      name: "ESRI ArcGIS Servers", 
      ea_strategy: "Smart City Infrastructure", 
      status: "Aligned", 
      payer: "IMU - GIS Unit", 
      risk: "Low",
      next_step: "Verify server redundancy for the new precinct development plan.",
      owner: "IMU - GIS"
    },
    { 
      id: "PRJ-2026-445", 
      name: "Slack Enterprise", 
      ea_strategy: "Missing Architecture Doc", 
      status: "Orphan", 
      payer: "UNASSIGNED", 
      risk: "High",
      next_step: "EA Team must upload the 2026 Collaboration Blueprint to justify the multi-tenancy cost center.",
      owner: "EA Unit"
    }
  ]);

  // --- TENDER GATEKEEPER LOGIC ---
  const handleRunScan = () => {
    if (!specText.trim()) return;
    setIsScanning(true);
    setScanResult(null);
    setDetectedSystem('');
    setDetectedReason('');
    setClearanceToken('');
    setIsCopied(false);

    setTimeout(() => {
      setIsScanning(false);
      const lowerSpec = specText.toLowerCase().trim();
      
      let matchReason = '';
      const overlap = systems.find(s => {
        const sysNameLower = s.name.toLowerCase();
        const sysCategory = (s.category || s.functional_category || '').toLowerCase();
        
        if (lowerSpec.includes(sysNameLower)) { matchReason = 'Direct Name Match'; return true; }
        if (lowerSpec.length >= 3 && sysNameLower.includes(lowerSpec)) { matchReason = 'Partial Name Match'; return true; }
        const primaryBrand = sysNameLower.split(' ')[0];
        if (primaryBrand.length >= 3 && lowerSpec.includes(primaryBrand)) { matchReason = 'Brand Keyword Match'; return true; }
        if (sysCategory && lowerSpec.includes(sysCategory)) { matchReason = `Functional Capability Overlap (${s.category || s.functional_category})`; return true; }

        return false;
      });
      
      const keywords = ['hr', 'leave', 'payroll', 'gis', 'map', 'security'];
      const keywordMatch = keywords.some(k => lowerSpec.includes(k));

      if (overlap) {
        setDetectedSystem(overlap.name);
        setDetectedReason(matchReason);
        setScanResult('flagged');
      } else if (keywordMatch) {
        setDetectedSystem('Oracle HRMS / ESRI ArcGIS');
        setDetectedReason('Keyword Heuristics');
        setScanResult('flagged');
      } else {
        setScanResult('clean');
        // Generate a cryptographically styled secure token for SCM
        setClearanceToken(`EA-AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      }
    }, 2000);
  };

  const clearScan = () => { 
    setSpecText(''); 
    setScanResult(null); 
    setClearanceToken('');
    setIsCopied(false);
  };

  const copyClearanceToken = () => {
    navigator.clipboard.writeText(`AUTHORIZATION CLEARED.\nTOKEN: ${clearanceToken}\nVALID FOR: 30 DAYS\nISSUER: EA GOVERNANCE PLATFORM`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // --- AG COMPLIANCE HANDOVER LOGIC ---
  const handleInitiateHandover = async () => {
    if (!selectedAlignment) return;
    setIsHandingOver(true);

    // Simulate API call to update the project ownership and alert the DD
    setTimeout(() => {
      setAlignmentData(prev => prev.map(item => {
        if (item.id === selectedAlignment.id) {
          return {
            ...item,
            status: "Remediation Active",
            payer: item.owner, // Shift ownership to the correct DD
            risk: "Medium", // Downgrade risk since it's actively managed now
            next_step: "Pending formal DD sign-off in the Identity Matrix to finalize budget transfer."
          };
        }
        return item;
      }));
      
      setIsHandingOver(false);
      setSelectedAlignment(null); // Close modal
    }, 1500);
  };

  // --- DUPLICATION RESOLUTION LOGIC ---
  const openResolutionModal = (dup: any) => {
    setSelectedDuplicate(dup);
    setResolutionStep('select');
    const systemsList = dup.systems || dup.app_names || [];
    setPrimarySystem(systemsList[0] || '');
  };

  const closeResolutionModal = () => {
    if (resolutionStep === 'notify-success' || resolutionStep === 'consolidate-success') {
      if (selectedDuplicate) {
        setActiveResolutions(prev => ({
          ...prev,
          [selectedDuplicate.category]: ticketId
        }));
      }
    }
    setSelectedDuplicate(null);
    setTimeout(() => setResolutionStep('select'), 300);
  };

  const handleNotifyPMO = async () => {
    setResolutionStep('notifying');
    const token = localStorage.getItem('appManagerToken');
    const generatedTicket = `PMO-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const systemsInvolved = (selectedDuplicate?.systems || selectedDuplicate?.app_names || []).join(', ');

    try {
      await fetch(`${API_URL}/api/pmo/escalate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          project_id: generatedTicket, 
          reason: `EA Consolidation Required for Category: ${selectedDuplicate?.category}. Overlapping systems: ${systemsInvolved}` 
        })
      });

      setTimeout(() => {
        setTicketId(generatedTicket);
        setResolutionStep('notify-success');
      }, 800);
    } catch (err) {
      setTimeout(() => {
        setTicketId(generatedTicket);
        setResolutionStep('notify-success');
      }, 800);
    }
  };

  const handleExecuteConsolidation = () => {
    setResolutionStep('consolidating');
    setTimeout(() => {
      setTicketId(`EA-MERGE-${Math.floor(10000 + Math.random() * 90000)}`);
      setResolutionStep('consolidate-success');
    }, 2000);
  };

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col max-w-[1600px] mx-auto relative pb-12">
      
      {/* 1. EXECUTIVE HEADER */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-blue-900 flex items-center tracking-tight">
            <ShieldCheck className="h-6 w-6 mr-2 text-blue-800" />
            IMU Strategic Governance Center
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Eliminating silos between EA Strategy, PMO Projects, and Departmental DDs</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
          <button 
            onClick={() => setExecutiveView('operations')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${executiveView === 'operations' ? 'bg-white text-blue-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-blue-800'}`}
          >
            <Activity className="h-3.5 w-3.5 inline mr-1.5" /> Operational Audit
          </button>
          <button 
            onClick={() => setExecutiveView('ag-matrix')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${executiveView === 'ag-matrix' ? 'bg-white text-blue-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-blue-800'}`}
          >
            <GitPullRequest className="h-3.5 w-3.5 inline mr-1.5" /> AG Compliance Matrix
          </button>
        </div>
      </div>

      {executiveView === 'operations' ? (
        <div className="flex-1 flex flex-col min-h-0 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            {[
              { title: 'EA Strategy', score: '92%', icon: Scale, color: 'text-green-600', dot: 'bg-green-500' },
              { title: 'PMO Integration', score: '64%', icon: Building2, color: 'text-orange-600', dot: 'bg-orange-500' },
              { title: 'Security Vetting', score: '100%', icon: Lock, color: 'text-green-600', dot: 'bg-green-500' },
              { title: 'API/Networks', score: '88%', icon: Network, color: 'text-blue-600', dot: 'bg-blue-500' }
            ].map((dept, i) => (
              <Card key={i} className="p-4 bg-white border border-gray-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <dept.icon className="h-3.5 w-3.5 mr-1.5" /> {dept.title}
                  </div>
                  <span className={`h-2 w-2 rounded-full ${dept.dot} ${dept.score !== '100%' ? 'animate-pulse' : ''}`}></span>
                </div>
                <div className="flex items-end justify-between mt-1">
                  <h3 className={`text-xl font-black ${dept.color}`}>{dept.score}</h3>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Uniformity</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* TENDER GATEKEEPER */}
            <Card className="xl:col-span-2 border border-sky-200 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col h-full">
              <div className="bg-blue-900 px-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center text-white">
                  <div className="bg-yellow-400 p-1.5 rounded-lg mr-3 shadow-sm">
                    <FileSearch className="h-4 w-4 text-blue-900" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-tight">Tender Gatekeeper</h2>
                    <p className="text-[9px] text-blue-200 uppercase tracking-widest font-bold">Functional Capability & ToR Scanner</p>
                  </div>
                </div>
                <span className="bg-blue-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-700">CIO Checkpoint</span>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col h-full">
                  <label className="text-xs font-bold text-gray-800 mb-1.5 flex items-center"><FileText className="h-3.5 w-3.5 mr-1.5 text-sky-500" /> Paste Business Requirements</label>
                  <textarea 
                    className="w-full flex-1 min-h-[150px] p-3 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none resize-none focus:bg-white transition-colors"
                    placeholder="Paste ToR text here (e.g. 'We need a tool for team collaboration')..."
                    value={specText}
                    onChange={(e) => setSpecText(e.target.value)}
                    disabled={isScanning || scanResult !== null}
                  ></textarea>
                  {!scanResult ? (
                    <Button onClick={handleRunScan} disabled={!specText.trim() || isScanning} className="mt-4 bg-blue-800 hover:bg-blue-900 text-white font-bold h-10 shadow-sm">
                      {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Capabilities...</> : <><Scale className="h-4 w-4 mr-2 text-yellow-400" /> Scan Strategic Overlap</>}
                    </Button>
                  ) : (
                    <Button onClick={clearScan} variant="outline" className="mt-4 border-gray-300 text-gray-600 h-10 font-bold">Scan New Document</Button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col justify-center relative overflow-hidden">
                  {!isScanning && scanResult === null && (
                    <div className="text-center text-gray-400"><UploadCloud className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-xs font-bold">Awaiting Content</p></div>
                  )}
                  {scanResult === 'flagged' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 z-10">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start shadow-sm">
                        <XCircle className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-red-900 text-sm">Procurement Blocked</h3>
                          <p className="text-[10px] text-red-700 mt-0.5 font-bold">Existing System: {detectedSystem}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                        <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                          Architectural Conflict 
                          <span className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">{detectedReason}</span>
                        </h4>
                        <p className="text-[11px] text-gray-700 leading-relaxed">Requirements overlap with <strong>{detectedSystem}</strong> which is already licensed for IMU. Procurement via SCM may not proceed without a deviation request.</p>
                      </div>
                    </div>
                  )}
                  {scanResult === 'clean' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 text-center flex flex-col items-center justify-center h-full">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-bold text-green-800 text-base mb-1">Cleared for Tender</h3>
                      <p className="text-[10px] text-gray-600 font-medium mb-4">No architectural duplication detected.</p>
                      
                      <div className="bg-white border border-green-200 w-full p-3 rounded-lg shadow-sm mb-4">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-left">EA Clearance Token</p>
                        <p className="text-sm text-gray-800 font-mono font-bold text-left tracking-wider">{clearanceToken}</p>
                      </div>

                      <Button 
                        onClick={copyClearanceToken}
                        variant={isCopied ? "default" : "outline"}
                        className={`w-full font-bold h-10 ${isCopied ? 'bg-green-600 hover:bg-green-700 text-white border-none' : 'border-blue-200 text-blue-800 hover:bg-blue-50'}`}
                      >
                        {isCopied ? <><FileCheck className="h-4 w-4 mr-2" /> Copied to Clipboard</> : <><Copy className="h-4 w-4 mr-2" /> Export EA Clearance</>}
                      </Button>
                      <p className="text-[9px] text-gray-400 mt-2">Required attachment for SCM procurement</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* OVERLAPS & DEPT FLAGS */}
            <Card className="xl:col-span-1 border border-gray-200 shadow-sm rounded-xl bg-white flex flex-col h-full overflow-hidden">
              <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                <button onClick={() => setActiveSideTab('duplications')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeSideTab === 'duplications' ? 'bg-white text-blue-900 border-b-2 border-yellow-400' : 'text-gray-500 hover:bg-gray-100'}`}>Overlaps {duplications.length > 0 && <span className="ml-1 bg-red-100 text-red-600 px-1 rounded-full text-[9px]">{duplications.length}</span>}</button>
                <button onClick={() => setActiveSideTab('departments')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeSideTab === 'departments' ? 'bg-white text-blue-900 border-b-2 border-yellow-400' : 'text-gray-500 hover:bg-gray-100'}`}>Dept Flags</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {activeSideTab === 'duplications' && (
                  <div className="space-y-3">
                    {duplications.length > 0 ? duplications.map((dup, idx) => {
                      const pendingTicket = activeResolutions[dup.category];
                      return (
                        <div 
                          key={idx} 
                          onClick={() => !pendingTicket && openResolutionModal(dup)} 
                          className={`bg-white border p-3 rounded-lg flex justify-between items-center transition-all group overflow-hidden ${pendingTicket ? 'border-orange-200 opacity-80 cursor-default' : 'border-gray-200 hover:border-blue-400 cursor-pointer'}`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-bold text-gray-900 truncate">{dup.category || 'Conflict'}</p>
                            <p className="text-[10px] text-gray-500 truncate">{(dup.systems || dup.app_names || []).join(' vs ')}</p>
                          </div>
                          {pendingTicket ? (
                            <span className="shrink-0 text-[9px] font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-200 flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> {pendingTicket}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 group-hover:bg-blue-800 group-hover:text-yellow-400 transition-colors">
                              Resolve
                            </span>
                          )}
                        </div>
                      );
                    }) : <div className="text-center py-10 text-gray-400 font-bold text-xs"><CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-200" /> Compliant</div>}
                  </div>
                )}

                {activeSideTab === 'departments' && (
                  <div className="space-y-3">
                    {deptSpend.map((dept, idx) => {
                      const spend = parseFloat(dept.total_spend || 0);
                      const isHighRisk = spend > 15000;
                      const isMedRisk = spend > 5000 && spend <= 15000;
                      
                      return (
                        <div key={idx} onClick={() => onDepartmentClick(dept.id)} className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors group overflow-hidden">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-bold text-blue-900 truncate flex items-center">
                              {dept.department || dept.name}
                            </p>
                            <div className="flex items-center mt-1 gap-2">
                              <p className="text-[10px] text-gray-500 truncate">ZAR {spend.toLocaleString()} burn</p>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border tracking-widest ${isHighRisk ? 'bg-red-50 text-red-600 border-red-200' : isMedRisk ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                {isHighRisk ? 'High Risk' : isMedRisk ? 'Med Risk' : 'Low Risk'}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="shrink-0 text-[10px] font-bold text-sky-600 px-2 h-7 group-hover:bg-white border border-transparent group-hover:border-sky-200 shadow-sm">Identity Matrix</Button>
                        </div>
                      );
                    })}
                    {deptSpend.length === 0 && <div className="text-center py-10 text-gray-400 font-bold text-xs">No department data available.</div>}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* 2. ACTIONABLE AG COMPLIANCE MATRIX */
        <div className="flex-1 animate-in slide-in-from-bottom-4 duration-500 min-h-0 flex flex-col">
          <Card className="border-blue-200 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col h-full">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="font-black text-base flex items-center">
                  <GitMerge className="h-5 w-5 mr-2 text-yellow-400" />
                  Strategic Portfolio Alignment
                </h3>
                <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mt-0.5">Bridging EA Strategy, PMO Projects, & Departmental Budgets</p>
              </div>
              <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full animate-pulse shadow-sm flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1.5" /> AUDITOR GENERAL RISK AREA
              </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">PMO Project Link</th>
                    <th className="px-6 py-4">Project / System Name</th>
                    <th className="px-6 py-4">EA Strategic Pillar</th>
                    <th className="px-6 py-4">Sustainability Payer</th>
                    <th className="px-6 py-4 text-center">AG Audit Risk</th>
                    <th className="px-6 py-4 text-right">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alignmentData.map((row, idx) => {
                    const isOrphan = row.status === 'Orphan';
                    const isRemediating = row.status === 'Remediation Active';

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedAlignment(row)}
                        className={`cursor-pointer hover:bg-blue-50/80 transition-all ${isOrphan ? 'bg-red-50/20' : isRemediating ? 'bg-orange-50/30' : 'bg-white'}`}
                      >
                        <td className="px-6 py-4 font-black text-gray-700">{row.id}</td>
                        <td className="px-6 py-4 font-black text-blue-900 underline decoration-blue-200">{row.name}</td>
                        <td className="px-6 py-4 font-bold text-gray-600">
                          {row.ea_strategy.includes('Missing') ? (
                            <span className="text-red-600 font-bold text-[10px] flex items-center"><XCircle className="h-3 w-3 mr-1" /> UNMAPPED</span>
                          ) : row.ea_strategy}
                        </td>
                        <td className="px-6 py-4">
                          {row.payer === 'UNASSIGNED' ? (
                            <span className="text-orange-600 font-black text-[10px] bg-orange-50 px-2 py-1 rounded border border-orange-200 flex w-fit items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" /> NEEDS BUDGET OWNER
                            </span>
                          ) : (
                            <span className="text-gray-900 font-bold text-xs flex items-center">
                              <Building2 className="h-3 w-3 mr-1.5 text-blue-800" /> {row.payer}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${isOrphan ? 'bg-red-100 text-red-700' : isRemediating ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {row.risk.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" className="bg-blue-900 text-yellow-400 font-bold h-7 text-[9px]">VIEW ACTIONS</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. STRATEGIC ACTION SIDE PANEL */}
      {selectedAlignment && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm z-[110] flex items-center justify-end animate-in fade-in">
          <div className="bg-white h-screen w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
               <div className="flex items-center">
                 <GitMerge className="h-5 w-5 mr-3 text-yellow-400" />
                 <div>
                   <h3 className="font-black text-lg">Governance Action</h3>
                   <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">PMO Reference: {selectedAlignment.id}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedAlignment(null)} className="text-white hover:rotate-90 transition-transform"><X /></button>
            </div>

            <div className="p-8 flex-1 space-y-8 overflow-y-auto custom-scrollbar">
              <section>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                  System Identified
                  <span className={`px-2 py-0.5 rounded ${selectedAlignment.status === 'Orphan' ? 'bg-red-100 text-red-700' : selectedAlignment.status === 'Remediation Active' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedAlignment.status}
                  </span>
                </label>
                <h2 className="text-2xl font-black text-blue-900 mt-1">{selectedAlignment.name}</h2>
              </section>

              {selectedAlignment.status === 'Orphan' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-center text-red-800 font-bold text-xs mb-2">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Auditor General Risk
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    This system is listed on the implementation roadmap but lacks a corresponding sustainment budget or owner.
                  </p>
                </div>
              )}

              <section className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-blue-900" /> Required Next Steps
                </h4>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                   <p className="text-sm font-bold text-blue-900 leading-snug">
                     {selectedAlignment.next_step}
                   </p>
                   <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Primary Owner:</span>
                      <span className="text-[10px] font-black text-blue-900 bg-blue-100 px-2 py-1 rounded">{selectedAlignment.owner}</span>
                   </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              {selectedAlignment.status === 'Orphan' ? (
                <Button 
                  onClick={handleInitiateHandover} 
                  disabled={isHandingOver}
                  className="flex-1 bg-blue-900 text-yellow-400 font-black h-12 shadow-lg hover:bg-blue-800"
                >
                  {isHandingOver ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> EXECUTING...</> : 'INITIATE HANDOVER'}
                </Button>
              ) : (
                <Button 
                  disabled
                  className="flex-1 bg-gray-200 text-gray-500 font-black h-12 shadow-none cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> HANDOVER INITIATED
                </Button>
              )}
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-600 font-bold h-12" onClick={() => setSelectedAlignment(null)}>
                DISMISS
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. OPERATIONAL RESOLUTION MODAL */}
      {selectedDuplicate && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-blue-900 text-white">
              <div className="flex items-center font-bold text-sm"><AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" /> Resolution Matrix</div>
              <button onClick={closeResolutionModal} className="text-blue-200 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
            {resolutionStep === 'select' && (
              <div className="p-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Conflict Category</p>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedDuplicate.category}</h3>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6 shadow-inner">
                  <div className="flex flex-col gap-2">
                    {(selectedDuplicate.systems || selectedDuplicate.app_names || []).map((sys: string, i: number) => (
                      <div key={i} className="bg-white px-3 py-1.5 rounded border border-orange-100 text-sm font-bold text-gray-700 shadow-sm flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div> {sys}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Button onClick={handleNotifyPMO} className="w-full bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex justify-between items-center h-12 group transition-all">
                    <div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-yellow-400" /> Notify PMO</div><ArrowRight className="h-4 w-4 opacity-50 group-hover:translate-x-1" />
                  </Button>
                  <Button onClick={() => setResolutionStep('consolidate-config')} variant="outline" className="w-full border-blue-200 text-blue-800 hover:bg-sky-50 flex justify-between items-center h-12 group transition-all">
                    <div className="flex items-center"><GitMerge className="h-4 w-4 mr-2 text-sky-500" /> Initiate License Consolidation</div><ArrowRight className="h-4 w-4 opacity-50 group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
            {resolutionStep === 'notify-success' && (
              <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">PMO Successfully Notified</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 inline-block mb-6 shadow-inner"><p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ticket</p><p className="text-sm font-mono font-bold text-blue-900">{ticketId}</p></div>
                <Button onClick={closeResolutionModal} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-10">Close & Await Resolution</Button>
              </div>
            )}
            {resolutionStep === 'consolidate-config' && (
              <div className="p-6">
                <button onClick={() => setResolutionStep('select')} className="text-xs font-bold text-blue-600 hover:text-blue-800 mb-4 flex items-center"><ArrowLeft className="h-3 w-3 mr-1" /> Back</button>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Architecture Consolidation</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-2">Target Primary System</label>
                    <select className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-bold" value={primarySystem} onChange={(e) => setPrimarySystem(e.target.value)}>
                      {(selectedDuplicate.systems || selectedDuplicate.app_names || []).map((sys: string) => (
                        <option key={sys} value={sys}>{sys}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button onClick={handleExecuteConsolidation} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-12 shadow-sm"><Settings2 className="h-4 w-4 mr-2 text-yellow-400" /> Execute Consolidation</Button>
              </div>
            )}
            {(resolutionStep === 'consolidating' || resolutionStep === 'notifying') && <div className="p-10 text-center animate-in fade-in duration-300"><Loader2 className="h-10 w-10 text-sky-500 mx-auto mb-4 animate-spin" /><h3 className="text-sm font-bold text-blue-900 mb-1">Processing Architectural Request...</h3></div>}
            {resolutionStep === 'consolidate-success' && (
              <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="h-8 w-8 text-green-600" /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Consolidation Scheduled</h3>
                <p className="text-xs text-gray-600 mb-4"><strong>{primarySystem}</strong> set as standard.</p>
                <Button onClick={closeResolutionModal} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-10">Acknowledge</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};