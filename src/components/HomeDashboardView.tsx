import React from 'react';
import { 
  Activity, HeartPulse, Coins, ShieldAlert, Lock, PlayCircle, 
  ArrowRight, ShieldCheck, Terminal, HelpCircle, FileText, CheckCircle2 
} from 'lucide-react';
import { FinancialSummary } from '../types';

interface Props {
  summary: FinancialSummary | null;
  onNavigate: (tab: 'home' | 'claims' | 'gaps' | 'roi' | 'fraud' | 'popia' | 'demo') => void;
  onOpenFAQ: () => void;
}

export default function HomeDashboardView({ summary, onNavigate, onOpenFAQ }: Props) {
  const currentSavings = summary?.savings_reinvestment_pool_zar?.toLocaleString() || "4,930";
  const processedClaims = summary?.total_claims_count?.toLocaleString() || "4";

  const modules = [
    {
      id: 'claims' as const,
      title: "Claims Ledger Streams",
      description: "Autonomous claims processing & OData schema verification.",
      purpose: "Automates multi-million claims ingestion daily from Cloudera Kafka streams, utilizing Google Document AI to extract codes and cross-check procedure criteria within 4 hours, compared to 72 hours manually.",
      color: "border-[#00E0FF]/20 hover:border-[#00E0FF] bg-[#00E0FF]/2",
      badge: "Real-time Processing",
      badgeColor: "text-[#00E0FF] bg-[#00E0FF]/10 border-[#00E0FF]/20",
      icon: <Activity size={20} className="text-[#00E0FF]" />
    },
    {
      id: 'gaps' as const,
      title: "Proactive Care Gaps",
      description: "Direct preventative vouchers financed by administrative savings.",
      purpose: "Our central breakthrough: saves money in back-office administration to fund proactive healthcare. Dispatches automated digital vouchers (e.g. spirometry, cardiac screens) to high-risk chronic members, lowering hospital admissions.",
      color: "border-red-500/20 hover:border-red-500 bg-red-950/5",
      badge: "Clinical Interventions",
      badgeColor: "text-red-400 bg-red-900/10 border-red-950/30",
      icon: <HeartPulse size={20} className="text-red-400" />
    },
    {
      id: 'roi' as const,
      title: "Executive ROI Projection",
      description: "Interactive solvency & amortization scenario calculator.",
      purpose: "Enables executive leaders and board of trustees to adjust operational metrics (e.g., auto-approval percentage point gains, review staff hours saved) and calculate real-time net solvency reinvestment and scheme savings pools.",
      color: "border-flywheel/20 hover:border-flywheel bg-flywheel/2",
      badge: "Actuarial Amortization",
      badgeColor: "text-flywheel bg-flywheel/10 border-flywheel/20",
      icon: <Coins size={20} className="text-flywheel" />
    },
    {
      id: 'fraud' as const,
      title: "GNN Anomaly Map",
      description: "Graph neural network analysis for collusion detection.",
      purpose: "Analyzes provider network relationships, identifying upcoding and phantom claims structures at the ingestion boundaries using Cloudera Spark GraphX representations.",
      color: "border-purple-500/20 hover:border-purple-500 bg-purple-950/5",
      badge: "Graph Intelligence",
      badgeColor: "text-purple-400 bg-purple-900/10 border-purple-950/30",
      icon: <ShieldAlert size={20} className="text-purple-400" />
    },
    {
      id: 'popia' as const,
      title: "POPIA / SDX Shield",
      description: "Secure data lineage auditing & SHA-256 tokenization.",
      purpose: "Enforces zero-trust clinical privacy. Generates fully anonymized hashes for member demographics and high-risk markers inside the Cloudera SDX table structure to compile with POPIA regulations.",
      color: "border-blue-500/20 hover:border-blue-500 bg-blue-950/5",
      badge: "Data Privacy",
      badgeColor: "text-blue-400 bg-blue-900/10 border-blue-950/30",
      icon: <Lock size={20} className="text-blue-400" />
    },
    {
      id: 'demo' as const,
      title: "90-Day MVP Demo",
      description: "Simulate scaling pilot stages (Months 1 - 3).",
      purpose: "A step-by-step progress framework tracking the transition from basic Kafka data stream foundation (Month 1), claims auto-adjudication pilot (Month 2), to fully automated care gap closure scale (Month 3).",
      color: "border-orange-500/20 hover:border-orange-500 bg-orange-950/5",
      badge: "Phased Roadmap",
      badgeColor: "text-orange-400 bg-orange-900/10 border-orange-950/30",
      icon: <PlayCircle size={20} className="text-orange-400" />
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in" id="home-dashboard-view">
      
      {/* Premium Hero Banner */}
      <div className="relative border border-white/10 bg-[#0E0E0E] p-8 md:p-12 overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        {/* Glow backdrop accent */}
        <div className="absolute -right-40 -top-40 w-96 h-96 rounded-full bg-flywheel/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute -left-45 -bottom-45 w-96 h-96 rounded-full bg-[#00E0FF]/5 blur-[80px] pointer-events-none"></div>

        <div className="space-y-4 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-flywheel/10 border border-flywheel/20 text-flywheel text-[9px] font-mono uppercase tracking-[0.2em]">
            <ShieldCheck size={11} /> Production Active • SAP ODATA Ready
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-display text-white leading-none">
            The Discovery <br/>
            <span className="text-flywheel">Health Flywheel</span>
          </h1>
          <p className="text-xs text-white/70 leading-relaxed">
            A programmatic, self-funding cycle connecting <strong className="text-white">Agentic Claims Intelligence</strong> down to proactive <strong className="text-white">Care Gap Closures</strong>. Operational savings earned in claims administration are immediately channeled to subsidize outstanding preventative care.
          </p>
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => onNavigate('demo')}
              className="px-5 py-2.5 bg-flywheel text-black font-black uppercase text-[10px] tracking-wider hover:bg-neutral-200 transition-all cursor-pointer flex items-center gap-2"
            >
              Start Pilot Wizard <ArrowRight size={12} />
            </button>
            <button
              onClick={onOpenFAQ}
              className="px-5 py-2.5 border border-white/20 hover:border-white text-white/80 hover:text-white uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-[#1A1A1A]/50"
            >
              <HelpCircle size={12} /> Operational FAQ
            </button>
          </div>
        </div>

        {/* Dynamic Telemetry Summary Card */}
        <div className="border border-white/10 bg-black/50 p-6 md:w-80 w-full space-y-4 z-10">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#00E0FF]">Active Status Stream</span>
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <div className="text-[9px] text-white/40 uppercase tracking-wide">Accumulated Reinvestment Pool</div>
              <div className="text-3xl font-black font-display text-flywheel mt-1">R {currentSavings}</div>
              <div className="text-[8px] font-mono text-[#00E0FF] mt-0.5 uppercase">Cleared for direct allocation</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-wide">Processed Claims volume</div>
              <div className="text-2xl font-black text-white mt-1">{processedClaims}</div>
              <div className="text-[8px] font-mono text-white/40 mt-0.5 uppercase">99.8% GL SAP Reconciliation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Features Outline Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-white/50 border-b border-white/5 pb-2">
          System Core capabilities (Choose view to begin)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div 
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className={`p-6 border transition-all duration-300 flex flex-col justify-between group cursor-pointer h-full ${mod.color}`}
              id={`home-view-card-${mod.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="p-2 border border-white/10 bg-black/40 group-hover:scale-110 transition-transform">
                    {mod.icon}
                  </span>
                  <span className={`text-[8px] font-mono uppercase px-2 py-0.5 border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide group-hover:text-flywheel transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-[10px] text-white/50 font-mono mt-1 uppercase tracking-tight">
                    {mod.description}
                  </p>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed pt-2 border-t border-white/5">
                  {mod.purpose}
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center justify-between text-[9px] font-mono uppercase text-flywheel tracking-widest border-t border-white/5 opacity-80 group-hover:opacity-100">
                <span>Access module</span>
                <span className="group-hover:translate-x-1.5 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded FAQ Quick Help Accordion for Direct Access */}
      <div className="p-6 border border-white/10 bg-[#0E0E0E]">
        <h3 className="text-xs font-black uppercase tracking-wider text-white mb-2 flex items-center gap-2">
          <Terminal size={14} className="text-flywheel" /> SYSTEM GLOSSARY & UNDERSTANDING PREVIEW
        </h3>
        <p className="text-[11px] text-white/60 mb-5 leading-relaxed">
          Need a quick reference to make sense of the clinical metrics and variables? Explore key definitions below:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-white/70 leading-relaxed">
          <div className="bg-black/30 border border-white/5 p-4 space-y-2">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wide text-flywheel">● What is the "Reinvestment Pool"?</h4>
            <p className="text-[11px]">
              It represents the cumulative South African Rands saved through automated validation of claims rules and fraud prevention, which is kept in a secure virtual vault to subsidize clinic visits, saving people money directly.
            </p>
          </div>
          <div className="bg-black/30 border border-white/5 p-4 space-y-2">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wide text-[#00E0FF]">● What are "Care Gaps"?</h4>
            <p className="text-[11px]">
              Clinically identified healthcare assessments (vaccines, spirometry tests, diabetic fundus imaging) that members have missed. Funding these preventatively stops dangerous chronic escalations.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
