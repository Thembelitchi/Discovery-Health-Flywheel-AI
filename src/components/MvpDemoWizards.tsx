import React, { useState } from 'react';
import { Calendar, HelpCircle, ChevronRight, CheckSquare, Settings2, PlayCircle } from 'lucide-react';

interface Props {
  onMilestoneChange: (milestone: 'm1' | 'm2' | 'm3') => void;
  onNavigate: (tab: 'home' | 'claims' | 'gaps' | 'roi' | 'fraud' | 'popia' | 'demo') => void;
}

export default function MvpDemoWizards({ onMilestoneChange, onNavigate }: Props) {
  const [activeMilestone, setActiveMilestone] = useState<'m1' | 'm2' | 'm3'>('m1');

  const handleMilestoneClick = (ms: 'm1' | 'm2' | 'm3') => {
    setActiveMilestone(ms);
    onMilestoneChange(ms);
  };

  return (
    <div className="border border-white/10 bg-[#121212] p-6 space-y-6" id="mvp-demo-wizard-container">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">Interactive SteerCo Milestone Demo</div>
          <h2 className="text-xl font-black font-display text-white uppercase flex items-center gap-2">
            90-Day MVP Digital Prototype Simulation
          </h2>
        </div>
        <div className="mt-2 md:mt-0 p-2.5 bg-flywheel/5 border border-flywheel/20 flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-white">
          <Calendar size={12} className="text-flywheel" /> Phase Rollout Node
        </div>
      </div>

      <p className="text-xs text-white/50 leading-relaxed">
        Step through the phased implementation timeline for the Chief Analytics Officer and Chief Medical Officer SteerCo review. Selecting a milestone dynamically simulates claims latency, fraud precision, and clinical outcome metrics:
      </p>

      {/* Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="milestone-tabs">
        <button
          onClick={() => handleMilestoneClick('m1')}
          className={`p-4 border text-left transition-all relative flex flex-col justify-between ${
            activeMilestone === 'm1' ? 'border-flywheel bg-white/5' : 'border-white/5 bg-[#171717] hover:border-white/10'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold text-white/40 uppercase">DAYS 1 - 30</span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 ${
              activeMilestone === 'm1' ? 'bg-flywheel text-black' : 'bg-white/10 text-white'
            }`}>MONTH 1</span>
          </div>
          <h3 className="text-xs font-black text-white mt-3 uppercase tracking-wider">Foundation & Baseline</h3>
          <p className="text-[10px] text-white/50 mt-1">Deploy SAP OData, Kafka CDC, and de-serialize baseline member graphs.</p>
        </button>

        <button
          onClick={() => handleMilestoneClick('m2')}
          className={`p-4 border text-left transition-all relative flex flex-col justify-between ${
            activeMilestone === 'm2' ? 'border-flywheel bg-white/5' : 'border-white/5 bg-[#171717] hover:border-white/10'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold text-white/40 uppercase">DAYS 31 - 60</span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 ${
              activeMilestone === 'm2' ? 'bg-flywheel text-black' : 'bg-white/10 text-white'
            }`}>MONTH 2</span>
          </div>
          <h3 className="text-xs font-black text-white mt-3 uppercase tracking-wider">Agentic Claims Pilot</h3>
          <p className="text-[10px] text-white/50 mt-1">Enable Document AI invoice extraction and GNN live graph anomaly score blocks.</p>
        </button>

        <button
          onClick={() => handleMilestoneClick('m3')}
          className={`p-4 border text-left transition-all relative flex flex-col justify-between ${
            activeMilestone === 'm3' ? 'border-flywheel bg-white/5' : 'border-white/5 bg-[#171717] hover:border-white/10'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold text-white/40 uppercase">DAYS 61 - 90</span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 ${
              activeMilestone === 'm3' ? 'bg-flywheel text-black' : 'bg-white/10 text-white'
            }`}>MONTH 3</span>
          </div>
          <h3 className="text-xs font-black text-white mt-3 uppercase tracking-wider">Care Gap Scale Engine</h3>
          <p className="text-[10px] text-white/50 mt-1">Fund mobile clinics locally, launch WhatsApp triage, analyze control group ER claims.</p>
        </button>
      </div>

      {/* Script Dialogue Content */}
      <div className="p-5 border border-white/5 bg-black/40 grid grid-cols-1 lg:grid-cols-12 gap-8" id="milestone-scenario-details">
        {/* Left: Dialogue transcript */}
        <div className="lg:col-span-8 space-y-4">
          <div className="text-[9px] font-mono uppercase tracking-widest text-flywheel border-b border-white/5 pb-2">
            SteerCo Demo Interactive Narrative
          </div>

          {activeMilestone === 'm1' && (
            <div className="space-y-3 font-sans text-xs text-white/80 leading-relaxed" id="narrative-text-m1">
              <p>
                <strong className="text-flywheel uppercase">Narrative: </strong> "Welcome, clinical and financial guardians. In Month 1, we establish the infrastructure foundation. We are streaming claims directly from SAP S/4HANA into Apache Iceberg on Stackable Kubernetes within 1 minute of clinician entry. The healthcare graph is live, tracking 150,000 high-risk diabetic and cardiovascular profiles without sensitive PII."
              </p>
              <div className="bg-white/2 p-3 font-mono text-[10px] text-[#00E0FF] space-y-1">
                <div>✔ Latency checked: <strong>55 seconds E2E</strong></div>
                <div>✔ POPIA encryption: <strong>AES-256 enabled on 3.7M member tokens</strong></div>
                <div>✔ Reconciliation score: <strong>99.8% matched to SAP GL 749000</strong></div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => onNavigate('popia')}
                  className="px-3 py-1.5 border border-[#00E0FF] bg-[#00E0FF]/5 hover:bg-[#00E0FF] hover:text-black text-[9px] font-mono uppercase tracking-[0.15em] font-black text-[#00E0FF] transition-all cursor-pointer"
                >
                  Verify POPIA & SDX Tokenization ↗
                </button>
                <button
                  onClick={() => onNavigate('claims')}
                  className="px-3 py-1.5 border border-white/10 bg-transparent hover:border-white text-[9px] font-mono uppercase tracking-[0.15em] text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  Inspect Raw Claims Stream ↗
                </button>
              </div>
            </div>
          )}

          {activeMilestone === 'm2' && (
            <div className="space-y-3 font-sans text-xs text-white/80 leading-relaxed" id="narrative-text-m2">
              <p>
                <strong className="text-flywheel uppercase">Narrative: </strong> "Month 2 introduces agentic intelligence. Document AI classifies invoice formats with 96% accuracy, slashing manual review cycles from 72 hours down to 4 hours. Simultaneously, the GNN live scoring detects active billing collusion. Notice how this flagged invoice has been automatically denied and added to our preventative care budget."
              </p>
              <div className="bg-white/2 p-3 font-mono text-[10px] text-[#00E0FF] space-y-1">
                <div>✔ Document AI extraction: <strong>96.4% confidence score</strong></div>
                <div>✔ Anomaly GNN precision: <strong>82.5% true positive rate</strong></div>
                <div>✔ SLA attainment: <strong>98.1% of high-volume claims &lt; 4 hours</strong></div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => onNavigate('fraud')}
                  className="px-3 py-1.5 border border-red-500 bg-red-950/20 hover:bg-red-500 hover:text-black text-[9px] font-mono uppercase tracking-[0.15em] font-black text-red-400 transition-all cursor-pointer"
                >
                  Inspect GNN Fraud Alerts ↗
                </button>
                <button
                  onClick={() => onNavigate('claims')}
                  className="px-3 py-1.5 border border-white/10 bg-transparent hover:border-white text-[9px] font-mono uppercase tracking-[0.15em] text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  Manage Flagged Ledger ↗
                </button>
              </div>
            </div>
          )}

          {activeMilestone === 'm3' && (
            <div className="space-y-3 font-sans text-xs text-white/80 leading-relaxed" id="narrative-text-m3">
              <p>
                <strong className="text-flywheel uppercase">Narrative: </strong> "In Month 3, we scale preventative closure. Using Difference-in-Differences clinical analysis on 2,500 propensity-matched controls, we verified that the intervention cohort shows 18% fewer emergency chest and respiratory claims in 30 days (p=0.003). It's scientific proof: medical claims savings directly buy healthier futures."
              </p>
              <div className="bg-white/2 p-3 font-mono text-[10px] text-[#00E0FF] space-y-1">
                <div>✔ Critical Care Gap closure: <strong>52% within 30 days</strong></div>
                <div>✔ Emergency visits reduction: <strong>-18% (p=0.003 significance)</strong></div>
                <div>✔ Mobile Clinic AI precision: <strong>92.1% sensitivity on fundus photography</strong></div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => onNavigate('roi')}
                  className="px-3 py-1.5 border border-flywheel bg-flywheel/5 hover:bg-flywheel hover:text-black text-[9px] font-mono uppercase tracking-[0.15em] font-black text-flywheel transition-all cursor-pointer"
                >
                  Calculate Solvency & ROI Pool ↗
                </button>
                <button
                  onClick={() => onNavigate('gaps')}
                  className="px-3 py-1.5 border border-[#00E0FF] bg-[#00E0FF]/5 hover:bg-[#00E0FF] hover:text-black text-[9px] font-mono uppercase tracking-[0.15em] font-black text-[#00E0FF] transition-all cursor-pointer"
                >
                  Allocate Care Vouchers ↗
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Key Decision / Solvency */}
        <div className="lg:col-span-4 p-4 border border-white/5 bg-black/50 flex flex-col justify-between" id="milestone-decision-panel">
          <div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1">
              <CheckSquare size={10} /> SteerCo Decision Gate
            </div>
            {activeMilestone === 'm1' && (
              <p className="text-[11px] text-white/70 italic">
                C-Suite sign-off required: Approve Phase 2 Pilot scope and authorize POPIA Consent marketing campaigns on Personal Health Platform (PHP).
              </p>
            )}
            {activeMilestone === 'm2' && (
              <p className="text-[11px] text-white/70 italic">
                C-Suite sign-off required: Approve clinical deployment of Mobile Clinic and authorize full WhatsApp Triage integrations for 150,000 members.
              </p>
            )}
            {activeMilestone === 'm3' && (
              <p className="text-[11px] text-white/70 italic">
                C-Suite sign-off required: Approve full production scale-up to all Discovery Health Medical Scheme options for Year 2 program allocation.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <Settings2 size={12} className="text-flywheel" />
            <span className="text-[9px] font-mono uppercase text-white/40">Status: Gate Clearance Approved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
