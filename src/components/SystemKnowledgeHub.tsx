import React, { useState } from 'react';
import { 
  X, HelpCircle, BookOpen, Clipboard, Check, Terminal, 
  Layers, Landmark, HeartPulse, ShieldAlert, Lock, Activity, 
  Coins, Sparkles, AlertCircle 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string | null;
  onClearReport: () => void;
  onNavigate: (tab: 'home' | 'claims' | 'gaps' | 'roi' | 'fraud' | 'popia' | 'demo') => void;
}

export default function SystemKnowledgeHub({ isOpen, onClose, reportContent, onClearReport, onNavigate }: Props) {
  const [activeFaq, setActiveFaq] = useState<string | null>("concept");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (reportContent) {
      navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const faqItems = [
    {
      id: "concept",
      title: "What is the Discovery Health Flywheel?",
      icon: <Sparkles size={14} className="text-flywheel" />,
      tagline: "The Core Reinvestment Mechanism",
      content: "The Flywheel is a proprietary closed-loop AI platform designed for South Africa's largest private healthcare scheme. It connects back-office claims savings (freed administrative leakage) directly with front-office proactive care gaps (preventative medical clinics and subsidies). Every saved Rand is programmatically written to the ledger to construct healthier lives first, which in turn reduces downstream emergency admissions."
    },
    {
      id: "ledger",
      title: "Claims Ledger & Automated Adjudication",
      icon: <Activity size={14} className="text-[#00E0FF]" />,
      tagline: "Automating massive claim volumes",
      content: "Ingests medical invoices via Google Cloud Document AI to automatically map ICD-10 and procedure codes against SAP benefit matrices. By checking compliance schemas instantly, it eliminates manual processing loops, dropping review response latencies from 72 hours under traditional workflows down to under 4 hours."
    },
    {
      id: "gaps",
      title: "Care Gaps & Proactive Interventions",
      icon: <HeartPulse size={14} className="text-red-400" />,
      tagline: "How savings fund medical outcomes",
      content: "Proactive care gaps are clinical priorities (outstanding cardiological checkups, asthma spirometry re-assessments, wellness counseling) detected across Discovery's high-risk cohorts. Instead of asking members to pay outstanding fees, the accumulated claims savings pool is used to dispatch prepaid diagnostic vouchers, ensuring early medical diagnostics save lives before critical care events emerge."
    },
    {
      id: "roi",
      title: "Executive ROI Analytics Engine",
      icon: <Coins size={14} className="text-flywheel" />,
      tagline: "Financial validation & justification",
      content: "A live variable scenario matrix enabling Discovery's Chief Executive and Chief Financial Officer to model cost amortization against Claims Auto-adjudication, Preventative Gap closures, and staff hourly savings. This direct efficiency projection acts as proof to stakeholders and CMS regulators that contribution increases go strictly toward better health."
    },
    {
      id: "fraud",
      title: "Graph Neural Network Fraud Engine",
      icon: <ShieldAlert size={14} className="text-red-500" />,
      tagline: "Identify phantom clinics and collusion",
      content: "Utilizes Cloudera Spark GraphX to map deep provider-member-claim relationship patterns. Detecting collusion networks, upcoding, and duplicate transactional billing timestamps allows Discovery to flag and block claims at the Kafka stream ingestion boundary with extreme precision."
    },
    {
      id: "popia",
      title: "SDX Lineage & POPIA Token Shield",
      icon: <Lock size={14} className="text-[#00E0FF]" />,
      tagline: "Guaranteed demographic & health privacy",
      content: "In strictly regulated healthcare markets, personal clinical data must never be compromised. The token shield automatically replaces Member ID, DOB, and high-risk CDL markers with secure hash values at the Kafka stream boundary in Cloudera SDX. Re-identification strictly happens at the API Gateway only under pre-authorized scope clearance."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" id="knowledge-hub-wrapper">
      <div className="w-full max-w-4xl bg-[#0F0F0F] border border-white/10 flex flex-col max-h-[90vh] shadow-2xl relative" id="knowledge-hub-container">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-flywheel/5 border border-flywheel/20 text-flywheel">
              <Terminal size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-flywheel block uppercase">Information Center</span>
              <h2 className="text-base font-black uppercase text-white tracking-wider">System Operations & Documentation</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 border border-white/15 text-white/50 hover:text-white hover:border-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content Arena: Split Column layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* LEFT PANELS: The FAQ Hub */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
              System Guidelines & Operational Glossary
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {faqItems.map((item) => {
                const isSelected = activeFaq === item.id;
                return (
                  <div 
                    key={item.id}
                    className={`border transition-all duration-300 ${
                      isSelected ? 'border-flywheel bg-white/2' : 'border-white/5 bg-[#141414] hover:border-white/15'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(item.id)}
                      className="w-full flex items-center justify-between p-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1 bg-black/40 border border-white/10">{item.icon}</span>
                        <div>
                          <h3 className="text-xs font-black text-white uppercase tracking-wide">{item.title}</h3>
                          <span className="text-[8px] font-mono text-white/40 uppercase tracking-tight block mt-0.5">{item.tagline}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">{isSelected ? '▼' : '▶'}</span>
                    </button>
                    
                    {isSelected && (
                      <div className="px-4 pb-4 pt-1 text-xs text-white/70 leading-relaxed border-t border-white/5 bg-black/20">
                        <p>{item.content}</p>
                        {item.id !== 'concept' && (
                          <button
                            onClick={() => {
                              onNavigate(item.id as any);
                              onClose();
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[#00E0FF] hover:underline"
                          >
                            Explore Live Module ↗
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-flywheel/5 border border-flywheel/10 text-[10px] text-white/60 leading-normal flex items-start gap-2">
              <AlertCircle size={14} className="text-flywheel flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white uppercase font-bold">SteerCo Advisory:</strong> This pilot prototype showcases a fully compliant 90-day simulation of live financial streams verified against target SARR regulations.
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Live Report Console */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 mb-3">
                  System Report console (mTLS Audited)
                </div>

                {reportContent ? (
                  <div className="relative group">
                    <div className="bg-black border border-white/5 p-4 rounded-none font-mono text-[10px] text-[#00E0FF] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[35vh] overflow-y-auto">
                      {reportContent}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={handleCopy}
                        className="p-1 px-2 bg-neutral-900 border border-white/10 text-white/70 hover:text-white hover:border-white transition-all text-[8px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check size={8} className="text-flywheel" /> : <Clipboard size={8} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={onClearReport}
                        className="p-1 bg-neutral-950 border border-[#f87171]/20 text-[#f87171] hover:bg-[#f87171]/10 transition-all text-[8px] uppercase font-bold cursor-pointer"
                        title="Close preview"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-white/5 bg-black/40 p-6 text-center py-12 flex flex-col items-center justify-center min-h-[160px]">
                    <Terminal size={20} className="text-white/20 mb-2 animate-pulse" />
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      Report stream empty
                    </span>
                    <p className="text-[9px] text-white/20 max-w-[180px] mx-auto mt-2 leading-relaxed">
                      Click "Generate Report" in the fluorescent lime footer below to route audited telemetry directly to this viewport.
                    </p>
                  </div>
                )}
              </div>

              {/* Helpful quick guide links */}
              <div className="bg-[#141414] border border-white/5 p-4 space-y-2.5">
                <span className="text-[9px] font-mono uppercase text-white/40 tracking-wider">Quick Action Navigation:</span>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <button 
                    onClick={() => { onNavigate('roi'); onClose(); }} 
                    className="p-2 border border-white/5 hover:border-flywheel text-left text-white/70 hover:text-white uppercase transition-all"
                  >
                    Adjust ROI Parameters →
                  </button>
                  <button 
                    onClick={() => { onNavigate('gaps'); onClose(); }} 
                    className="p-2 border border-white/5 hover:border-flywheel text-left text-white/70 hover:text-white uppercase transition-all"
                  >
                    Fund outstanding gap →
                  </button>
                  <button 
                    onClick={() => { onNavigate('fraud'); onClose(); }} 
                    className="p-2 border border-white/5 hover:border-flywheel text-left text-white/70 hover:text-white uppercase transition-all"
                  >
                    Investigate GNN alerts →
                  </button>
                  <button 
                    onClick={() => { onNavigate('demo'); onClose(); }} 
                    className="p-2 border border-white/5 hover:border-flywheel text-left text-white/70 hover:text-white uppercase transition-all"
                  >
                    Phased Pilot wizard →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 p-4 bg-black/50 text-right flex items-center justify-between text-[10px] font-mono text-white/30">
          <span>CLEARED SARR/POPIA STATUS: EXEMPT ACCREDITED</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-white text-black font-black uppercase text-[9px] tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Dismiss Console
          </button>
        </div>

      </div>
    </div>
  );
}
