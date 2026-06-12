import React from 'react';
import { CareGap } from '../types';
import { Sparkles, HeartPulse, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  careGaps: CareGap[];
  savingsPool: number;
  onTriggerGap: (gapId: string, note?: string) => void;
}

export default function CareGapsList({ careGaps, savingsPool, onTriggerGap }: Props) {
  return (
    <div className="border border-white/10 bg-[#121212] p-6 h-full" id="care-gaps-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-4 mb-6">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">Cloudera Clinical Registry</div>
          <h2 className="text-xl font-black font-display text-white uppercase flex items-center gap-2">
            Proactive Care Gaps & Interventions
          </h2>
        </div>
        <div className="mt-2 md:mt-0 p-2.5 bg-flywheel/5 border border-flywheel/20 flex items-center gap-2 text-xs">
          <Sparkles size={12} className="text-flywheel animate-pulse" />
          <span className="text-white">Flywheel Budget: <strong className="text-flywheel font-mono">R {savingsPool.toLocaleString()}</strong></span>
        </div>
      </div>

      <p className="text-xs text-white/50 mb-6 leading-relaxed">
        Identify and deploy funding for outstanding health checkups, diabetic renal checks, and vaccines before complications escalate into hospital admissions. Trigger invitations or fund vouchers immediately utilizing the Claims Reinvestment Pool:
      </p>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="care-gaps-list-grid">
        {careGaps.map(gap => {
          const isOpen = gap.status === 'open';
          const isTriggered = gap.status === 'intervention_sent';
          const isResolved = gap.status === 'resolved';

          const canFund = savingsPool >= gap.subsidized_cost_zar;

          return (
            <div
              key={gap.id}
              className={`p-5 border flex flex-col justify-between transition-all ${
                isResolved 
                  ? 'border-emerald-500/20 bg-emerald-950/5' 
                  : isTriggered
                  ? 'border-orange-500/20 bg-orange-950/5'
                  : 'border-white/5 bg-[#171717] hover:border-white/15'
              }`}
              id={`gap-card-${gap.id}`}
            >
              <div>
                {/* Header indicators */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono text-[9px] text-white/40 uppercase font-bold">{gap.id} • {gap.chronic_condition}</span>
                    <h4 className="text-sm font-black text-white mt-0.5">{gap.member_name} (Age {gap.member_age})</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Risk Badge */}
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 ${
                      gap.risk_level === 'High' ? 'bg-red-950 text-red-400 border border-red-900/60' :
                      gap.risk_level === 'Medium' ? 'bg-orange-950 text-orange-400 border border-orange-900/60' :
                      'bg-sky-950 text-sky-400 border border-sky-900/60'
                    }`}>
                      {gap.risk_level} Risk
                    </span>
                  </div>
                </div>

                {/* Gap description */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-white/80 group-hover:text-flywheel mb-1 italic">
                    {gap.gap_type}
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {gap.description}
                  </p>
                </div>

                {/* Subsidized Cost & Recommendations */}
                <div className="p-3 bg-black/40 border border-white/5 text-[10px] mb-4 space-y-1 font-mono">
                  <div className="flex justify-between text-white/40 uppercase">
                    <span>Protocol recommendation</span>
                    <span className="text-[#00E0FF] font-bold">{gap.recommended_cpt}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1 mt-1 font-bold text-white/60 uppercase">
                    <span>Proactive subsidy cost</span>
                    <span className="text-flywheel font-bold text-xs">R {gap.subsidized_cost_zar}</span>
                  </div>
                </div>

                {/* Action note logs */}
                {gap.intervention_notes && (
                  <div className="p-3 bg-white/2 border-l-2 border-flywheel text-[10px] text-white/60 italic mb-4 font-sans leading-relaxed">
                    {gap.intervention_notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/5 mt-auto">
                {isOpen && (
                  <button
                    onClick={() => onTriggerGap(gap.id, `Closed-loop audit voucher dispatched to ${gap.member_name} for a fully subsidized ${gap.gap_type} assessment.`)}
                    className="w-full py-2 bg-transparent text-white uppercase text-[10px] font-black tracking-widest border border-white/20 hover:border-flywheel hover:text-flywheel transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send size={10} /> Dispatch Clinical Notice
                  </button>
                )}

                {isTriggered && (
                  <div className="space-y-2">
                    <button
                      onClick={() => onTriggerGap(gap.id)}
                      disabled={!canFund}
                      className={`w-full py-2 uppercase text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                        canFund 
                          ? 'bg-flywheel text-black border-flywheel hover:bg-transparent hover:text-flywheel' 
                          : 'bg-black text-white/20 border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles size={10} /> {canFund ? "Fund voucher from savings" : "Need more claims audit savings"}
                    </button>
                    {!canFund && (
                      <div className="text-[9px] text-red-400 flex items-center justify-center gap-1 font-mono uppercase">
                        <AlertTriangle size={8} /> Insufficient funds (Cost R{gap.subsidized_cost_zar} &gt; Pool R{savingsPool})
                      </div>
                    )}
                  </div>
                )}

                {isResolved && (
                  <div className="text-[10px] text-flywheel font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 p-1 font-mono">
                    <CheckCircle2 size={12} /> Proactively Resolved & Fully Funded
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
