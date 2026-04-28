import React, { useState } from 'react';
import { X, Info, Mail, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const [activeView, setActiveView] = useState<'none' | 'about' | 'contact' | 'privacy'>('none');

  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* FIXED FOOTER: shrink-0 keeps it from squishing, z-50 keeps it above scrolling content */}
      <footer className="shrink-0 w-full bg-white border-t border-gray-200 px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-gray-400 z-50 relative shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center mb-1 sm:mb-0">
          <span>&copy; {currentYear} Smart Analytics Manager.</span>
          <span className="mx-2">|</span>
          <span className="text-indigo-500 font-bold flex items-center">
            Developed by ILAMI TECHNOLOGIES <ExternalLink className="h-3 w-3 ml-1" />
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveView('about')} className="hover:text-indigo-600 transition-colors">About</button>
          <button onClick={() => setActiveView('contact')} className="hover:text-indigo-600 transition-colors">Contact Support</button>
          <button onClick={() => setActiveView('privacy')} className="hover:text-indigo-600 transition-colors">Privacy Policy</button>
        </div>
      </footer>

      {/* ABOUT POP-UP */}
      {activeView === 'about' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center text-gray-900 font-bold text-sm">
                <Info className="h-4 w-4 mr-2 text-indigo-600" /> About the System
              </div>
              <button onClick={() => setActiveView('none')} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900">Smart Analytics Manager v2.1.0</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enterprise Architecture mapping and software asset management system designed specifically for municipal environments. 
              </p>
              <div className="pt-4 mt-4 border-t border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                Proprietary & Confidential
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT POP-UP */}
      {activeView === 'contact' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center text-gray-900 font-bold text-sm">
                <Mail className="h-4 w-4 mr-2 text-indigo-600" /> Technical Support
              </div>
              <button onClick={() => setActiveView('none')} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 font-medium">For system outages, integration requests, or billing inquiries, please contact the vendor directly.</p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                <p className="font-bold text-gray-900">ILAMI Technologies</p>
                <p className="text-indigo-600 font-medium mt-1">support@ilami-technologies.com</p>
                <p className="text-gray-500 mt-1">+27 (0) 800 123 456</p>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setActiveView('none')}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY PAGE */}
      {activeView === 'privacy' && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-8 py-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm shrink-0">
            <div className="flex items-center text-gray-900 font-bold text-lg">
              <ShieldCheck className="h-5 w-5 mr-2 text-indigo-600" /> Data Privacy & Governance Policy
            </div>
            <Button variant="outline" onClick={() => setActiveView('none')} className="text-gray-600 hover:bg-gray-100 border-gray-200">
              <X className="h-4 w-4 mr-2" /> Close Document
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 lg:px-32 xl:px-64 bg-gray-50 custom-scrollbar">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6 text-sm text-gray-700 leading-relaxed">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Enterprise Privacy & Data Policy</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Effective Date: April 2026</p>
              </div>
              
              <hr className="border-gray-100" />

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">1. Data Ownership & Jurisdiction</h3>
                <p>All telemetry, financial data, and personal identifiable information (PII) processed by the Smart Analytics Manager remains the exclusive property of the eThekwini Municipality. The vendor acts solely as a data processor in accordance with the Protection of Personal Information Act (POPIA).</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">2. Telemetry & Monitoring</h3>
                <p>The application actively monitors software utilization (active vs. idle time) across procured enterprise licenses. This data is aggregated and anonymized for the purpose of architectural cost optimization and AI-driven recommendations. Screen-scraping or keystroke logging is strictly prohibited.</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">3. API Connectors & Integrations</h3>
                <p>Data ingested via the Enterprise Integration Hub (e.g., Entra ID, SharePoint, MS Graph) is secured via end-to-end encryption (TLS 1.3). Authentication tokens are securely hashed and never exposed in plain text to end-users.</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">4. Vendor Access</h3>
                <p>Vendor engineers may only access the municipal database for strict maintenance, debugging, or deployment tasks under a formally approved Change Control request. All vendor actions are logged in the system audit trail.</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-indigo-900 mt-8">
                <p className="font-semibold text-xs uppercase tracking-wider mb-1">Legal Disclaimer</p>
                <p className="text-xs">By utilizing this software, the municipality agrees to the terms of the Master Service Agreement (MSA) established during procurement.</p>
              </div>
            </div>
            <div className="h-12"></div>
          </div>
        </div>
      )}
    </>
  );
}