import React from 'react';
import { FinancialSummary } from '../types';
import { TrendingUp, Award, Clock, Sparkles } from 'lucide-react';

interface Props {
  summary: FinancialSummary;
  onNavigate: (tab: 'home' | 'claims' | 'gaps' | 'roi' | 'fraud' | 'popia' | 'demo') => void;
}

export default function DashboardMetrics({ summary, onNavigate }: Props) {
  const approvalRate = summary.total_claims_count > 0 
    ? Math.round((summary.auto_approved_count / summary.total_claims_count) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8" id="dashboard-metrics-container">
      {/* Momentum Index */}
      <div 
        onClick={() => onNavigate('demo')}
        className="p-6 border border-white/10 bg-white/5 hover:border-flywheel hover:bg-white/10 transition-all duration-300 rounded-none flex flex-col justify-between cursor-pointer group" 
        id="momentum-metric-card"
        title="Click to view 90-Day MVP Demo Milestone simulation"
      >
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp size={12} className="animate-pulse" /> Health Momentum
            </span>
            <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-mono tracking-wider font-normal text-white/50">View Demo ↗</span>
          </div>
          <div className="text-5xl font-black font-display tracking-tighter">84<span className="text-base text-flywheel ml-1 font-medium font-sans animate-pulse">+12.4%</span></div>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-4 leading-normal">Clinical Velocity Score</p>
      </div>

      {/* Reinvestment Pool */}
      <div 
        onClick={() => onNavigate('roi')}
        className="p-6 border border-white/10 bg-white/5 hover:border-flywheel hover:bg-white/10 transition-all duration-300 rounded-none flex flex-col justify-between cursor-pointer group" 
        id="savings-metric-card"
        title="Click to model custom settings in the Executive ROI Projection Calculator"
      >
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles size={12} /> Reinvestment Pool
            </span>
            <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-mono tracking-wider font-normal text-white/50">Open ROI ↗</span>
          </div>
          <div className="text-5xl font-black font-display tracking-tighter text-flywheel">
            R {summary.savings_reinvestment_pool_zar.toLocaleString()}
          </div>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-4 leading-normal">
          Unlocked administrative savings
        </p>
      </div>

      {/* Auto-Approval Rate */}
      <div 
        onClick={() => onNavigate('claims')}
        className="p-6 border border-white/10 bg-white/5 hover:border-flywheel hover:bg-white/10 transition-all duration-300 rounded-none flex flex-col justify-between cursor-pointer group" 
        id="automation-metric-card"
        title="Click to inspect active Claims Ledger stream list"
      >
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award size={12} /> Auto-Approval Rate
            </span>
            <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-mono tracking-wider font-normal text-white/50">View Claims ↗</span>
          </div>
          <div className="text-5xl font-black font-display tracking-tighter">
            {approvalRate}%
          </div>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-4 leading-normal">
          {summary.auto_approved_count} of {summary.total_claims_count} claims automated
        </p>
      </div>

      {/* Proactive Outlay */}
      <div 
        onClick={() => onNavigate('gaps')}
        className="p-6 border border-white/10 bg-white/5 hover:border-flywheel hover:bg-white/10 transition-all duration-300 rounded-none flex flex-col justify-between cursor-pointer group" 
        id="outlay-metric-card"
        title="Click to view preventative Care Gaps and direct subsidized vouchers"
      >
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock size={12} /> Preventative Outlay
            </span>
            <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-mono tracking-wider font-normal text-white/50">Open Care Gaps ↗</span>
          </div>
          <div className="text-5xl font-black font-display tracking-tighter text-[#00E0FF]">
            R {summary.preventative_outlay_zar.toLocaleString()}
          </div>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-4 leading-normal">
          Funds reinvested in Care Gaps
        </p>
      </div>
    </div>
  );
}
