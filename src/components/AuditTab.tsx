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
  systems: any[]; // ADDED: To check against live catalog
}

type ResolutionStep = 'select' | 'notifying' | 'notify-success' | 'consolidate-config' | 'consolidating' | 'consolidate-success';

export const AuditTab: React.FC<AuditTabProps> = ({ duplications, deptSpend, onDepartmentClick, systems }) => {
  const [specText, setSpecText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | 'clean' | 'flagged'>(null);
  const [detectedSystem, setDetectedSystem] = useState<string>('');
  const [activeSideTab, setActiveSideTab] = useState<'duplications' | 'departments'>('duplications');
  const [selectedDuplicate, setSelectedDuplicate] = useState<any | null>(null);
  const [resolutionStep, setResolutionStep] = useState<ResolutionStep>('select');
  const [primarySystem, setPrimarySystem] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');
  const [resolvedCategories, setResolvedCategories] = useState<string[]>([]);

  const handleRunScan = () => {
    if (!specText.trim()) return;
    setIsScanning(true);
    setScanResult(null);
    setDetectedSystem('');

    setTimeout(() => {
      setIsScanning(false);
      const lowerSpec = specText.toLowerCase();
      
      // LOGIC: Check if any existing system name exists in the requirement text
      const overlap = systems.find(s => lowerSpec.includes(s.name.toLowerCase()));
      
      // Keywords fallback for demo purposes
      const keywords = ['hr', 'leave', 'payroll', 'gis', 'map', 'security'];
      const keywordMatch = keywords.some(k => lowerSpec.includes(k));

      if (overlap) {
        setDetectedSystem(overlap.name);
        setScanResult('flagged');
      } else if (keywordMatch) {
        setDetectedSystem('Oracle HRMS / ESRI ArcGIS');
        setScanResult('flagged');
      } else {
        setScanResult('clean');
      }
    }, 2000);
  };

  const clearScan = () => { setSpecText(''); setScanResult(null); };

  const openResolutionModal = (dup: any) => {
    setSelectedDuplicate(dup);
    setResolutionStep('select');
    const systemsList = dup.systems || dup.app_names || [];
    setPrimarySystem(systemsList[0] || '');
  };

  const closeResolutionModal = () => {
    if (resolutionStep === 'notify-success' || resolutionStep === 'consolidate-success') {
      if (selectedDuplicate) setResolvedCategories(prev => [...prev, selectedDuplicate.category]);
    }
    setSelectedDuplicate(null);
    setTimeout(() => setResolutionStep('select'), 300);
  };

  const handleNotifyPMO = () => {
    setResolutionStep('notifying');
    setTimeout(() => {
      setTicketId(`PMO-REQ-${Math.floor(1000 + Math.random() * 9000)}`);
      setResolutionStep('notify-success');
    }, 1500);
  };

  const handleExecuteConsolidation = () => {
    setResolutionStep('consolidating');
    setTimeout(() => {
      setTicketId(`EA-MERGE-${Math.floor(10000 + Math.random() * 90000)}`);
      setResolutionStep('consolidate-success');
    }, 2000);
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
              <label className="text-xs font-bold text-gray-800 mb-1.5 flex items-center"><FileText className="h-3.5 w-3.5 mr-1.5 text-sky-500" /> Paste Business Requirements</label>
              <textarea 
                className="w-full flex-1 min-h-[150px] p-3 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none resize-none focus:bg-white transition-colors"
                placeholder="Paste ToR text here (e.g. 'We need Oracle for payroll')..."
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                disabled={isScanning || scanResult !== null}
              ></textarea>
              {!scanResult ? (
                <Button onClick={handleRunScan} disabled={!specText.trim() || isScanning} className="mt-4 bg-blue-800 hover:bg-blue-900 text-white font-bold h-10 shadow-sm">
                  {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Comparing Catalog...</> : <><Scale className="h-4 w-4 mr-2 text-yellow-400" /> Run Compliance Scan</>}
                </Button>
              ) : (
                <Button onClick={clearScan} variant="outline" className="mt-4 border-gray-300 text-gray-600 h-10 font-bold">New Scan</Button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col justify-center">
              {!isScanning && scanResult === null && (
                <div className="text-center text-gray-400"><UploadCloud className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-xs font-bold">Awaiting Content</p></div>
              )}
              {scanResult === 'flagged' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start shadow-sm">
                    <XCircle className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                    <div><h3 className="font-bold text-red-900 text-sm">Procurement Blocked</h3><p className="text-[10px] text-red-700 mt-0.5 font-bold">Existing System Detected: {detectedSystem}</p></div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Architectural Conflict</h4>
                    <p className="text-[11px] text-gray-700 leading-relaxed">Requirements overlap with <strong>{detectedSystem}</strong> which is already licensed for IMU. New procurement is unauthorized.</p>
                  </div>
                </div>
              )}
              {scanResult === 'clean' && (
                <div className="animate-in slide-in-from-right-4 duration-300 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                  <h3 className="font-bold text-green-800 text-base">Cleared for Tender</h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">TOKEN: EA-AUTH-{Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-1 border border-gray-200 shadow-sm rounded-xl bg-white flex flex-col h-full overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
            <button onClick={() => setActiveSideTab('duplications')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeSideTab === 'duplications' ? 'bg-white text-blue-900 border-b-2 border-yellow-400' : 'text-gray-500 hover:bg-gray-100'}`}>Overlaps {displayDuplications.length > 0 && <span className="ml-1 bg-red-100 text-red-600 px-1 rounded-full text-[9px]">{displayDuplications.length}</span>}</button>
            <button onClick={() => setActiveSideTab('departments')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeSideTab === 'departments' ? 'bg-white text-blue-900 border-b-2 border-yellow-400' : 'text-gray-500 hover:bg-gray-100'}`}>Dept Flags</button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {activeSideTab === 'duplications' && (
              <div className="space-y-3">
                {displayDuplications.length > 0 ? displayDuplications.map((dup, idx) => (
                  <div key={idx} onClick={() => openResolutionModal(dup)} className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-400 transition-all group">
                    <div className="flex-1 pr-2"><p className="text-xs font-bold text-gray-900">{dup.category || 'Conflict'}</p><p className="text-[10px] text-gray-500 truncate">{(dup.systems || dup.app_names || []).join(' vs ')}</p></div>
                    <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 group-hover:bg-blue-800 group-hover:text-yellow-400">Resolve</span>
                  </div>
                )) : <div className="text-center py-10 text-gray-400 font-bold text-xs"><CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-200" /> Compliant</div>}
              </div>
            )}

            {activeSideTab === 'departments' && (
              <div className="space-y-3">
                {deptSpend.map((dept, idx) => (
                  <div key={idx} onClick={() => onDepartmentClick(dept.id)} className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors group">
                    <div>
                      <p className="text-xs font-bold text-blue-900">{dept.department || dept.name}</p>
                      <p className="text-[10px] text-gray-500">ZAR {(parseFloat(dept.total_spend || 0)).toLocaleString()} active burn</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold text-sky-600 px-2 h-7 group-hover:bg-white border border-transparent group-hover:border-sky-200 shadow-sm">Audit</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

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