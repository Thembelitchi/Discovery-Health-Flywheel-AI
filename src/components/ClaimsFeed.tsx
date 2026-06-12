import React, { useState } from 'react';
import { Claim, RuleDetail } from '../types';
import { Check, AlertTriangle, X, ShieldAlert, Code, User, FileText, Landmark } from 'lucide-react';

interface Props {
  claims: Claim[];
  onAction: (docId: string, action: 'approve' | 'reject', reason?: string) => void;
  onNavigate: (tab: 'home' | 'claims' | 'gaps' | 'roi' | 'fraud' | 'popia' | 'demo') => void;
}

export default function ClaimsFeed({ claims, onAction, onNavigate }: Props) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(claims[0]?.document_id || null);
  const [showFhir, setShowFhir] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const selectedClaim = claims.find(c => c.document_id === selectedClaimId) || claims[0];

  const handleAction = (docId: string, action: 'approve' | 'reject') => {
    onAction(docId, action, action === 'reject' ? (rejectionReason || "Audited and denied under clinical tariff rules.") : undefined);
    setRejectionReason("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8" id="claims-feed-section">
      {/* Feed List Left Side */}
      <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-2" id="claims-list-cards">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 mb-2 flex items-center justify-between">
          <span>OData Ingestion Streams</span>
          <span className="font-mono text-flywheel">{claims.length} Transactions</span>
        </div>

        {claims.length === 0 ? (
          <div className="p-6 border border-white/5 text-center text-white/40">No claims processed in active session stream.</div>
        ) : (
          claims.map(claim => {
            const isApproved = claim.status === 'approved';
            const isFlagged = claim.status === 'flagged';
            const isRejected = claim.status === 'rejected';
            const isSelected = claim.document_id === selectedClaimId;

            return (
              <div
                key={claim.document_id}
                onClick={() => {
                  setSelectedClaimId(claim.document_id);
                  setShowFhir(false);
                }}
                className={`p-4 border select-none cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-flywheel bg-white/5' 
                    : 'border-white/15 bg-[#121212] hover:border-white/30'
                }`}
                id={`claim-row-${claim.document_id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-white/40 uppercase font-black">{claim.document_id}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${
                    isApproved ? 'bg-flywheel text-black' : 
                    isFlagged ? 'bg-orange-500 text-black' : 
                    'bg-red-600 text-white'
                  }`}>
                    {claim.status}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-sm font-bold text-white">{claim.fields.member.name}</h4>
                    <span className="text-[10px] text-white/50">{claim.fields.provider.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-white">R {claim.fields.amounts.total_claimed.toLocaleString()}</span>
                    <div className="text-[9px] text-white/40 uppercase">Total Claimed</div>
                  </div>
                </div>

                {/* Micro indicators bar */}
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5 text-[9px] text-white/40 font-mono">
                  <span>Confidence: <strong className={claim.confidence > 0.8 ? 'text-flywheel' : 'text-red-500'}>{Math.round(claim.confidence * 100)}%</strong></span>
                  <span>Rules: <strong className="text-white">{claim.validation_results.passed.length}/{claim.validation_results.passed.length + claim.validation_results.failed.length} PASSED</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Claim Audit Pane */}
      <div className="lg:col-span-3 border border-white/10 bg-[#121212] p-6 flex flex-col justify-between min-h-[500px]" id="selected-claim-panel">
        {!selectedClaim ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-xs uppercase tracking-widest">
            Select a claim transaction to audit details
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">Active Ledger Document</div>
                  <h3 className="text-2xl font-black font-display text-white uppercase flex items-center gap-2">
                    {selectedClaim.document_id}
                    <span className="text-[10px] font-sans font-medium tracking-normal text-white/40 normal-case ml-2">
                      Received {new Date(selectedClaim.created_at).toLocaleTimeString()}
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFhir(!showFhir)}
                    className={`px-3 py-1.5 border uppercase font-mono text-[9px] font-bold tracking-widest flex items-center gap-1.5 transition-all ${
                      showFhir ? 'border-flywheel bg-flywheel text-black' : 'border-white/20 bg-transparent text-white hover:border-white'
                    }`}
                  >
                    <Code size={10} /> {showFhir ? "Standard Preview" : "FHIR Mapping"}
                  </button>
                </div>
              </div>

              {/* standard preview vs FHIR block */}
              {showFhir ? (
                <div className="bg-black/50 p-4 border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto rounded-none mb-6 max-h-[320px] overflow-y-auto" id="fhir-json-viewer">
                  <pre>{JSON.stringify(selectedClaim.fhir_claim, null, 2)}</pre>
                </div>
              ) : (
                <div className="space-y-6" id="claim-clinical-blueprint">
                  {/* Member & Provider Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/2 border border-white/5">
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-white/40 uppercase mb-2 flex items-center gap-1">
                          <User size={10} /> Member Profile
                        </div>
                        <div className="text-xs font-bold text-white">{selectedClaim.fields.member.name}</div>
                        <div className="text-[10px] font-mono text-white/50 mt-1 uppercase">
                          ID: {selectedClaim.fields.member.discovery_member_id} • Age {selectedClaim.fields.member.age}
                        </div>
                        <div className="flex gap-1 flex-wrap mt-2">
                          {selectedClaim.fields.member.chronic_conditions.map((cx, i) => (
                            <span key={i} className="text-[8px] bg-red-950/40 text-red-400 border border-red-900/40 px-1.5 py-0.5 font-bold uppercase tracking-wide">
                              {cx}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('gaps')}
                        className="mt-4 text-left font-mono text-[9px] uppercase tracking-wider text-flywheel hover:underline flex items-center gap-1 border-t border-white/5 pt-2 cursor-pointer"
                        title="Jump to Proactive Care Gaps Tracker"
                      >
                        Optimize Care Gaps &rarr;
                      </button>
                    </div>
                    
                    <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-white/40 uppercase mb-2 flex items-center gap-1">
                          <FileText size={10} /> Clinical Provider
                        </div>
                        <div className="text-xs font-bold text-white">{selectedClaim.fields.provider.name}</div>
                        <div className="text-[10px] font-mono text-white/50 mt-1 uppercase">
                          Practice: {selectedClaim.fields.provider.practice_number} • {selectedClaim.fields.provider.type}
                        </div>
                        <div className="text-[9px] text-[#00E0FF] mt-2 flex items-center gap-1 font-mono uppercase">
                          Diagnostic ICD-10: {selectedClaim.fields.icd_10_codes.map(c => c.code).join(", ")}
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('fraud')}
                        className="mt-4 text-left font-mono text-[9px] uppercase tracking-wider text-red-400 hover:underline flex items-center gap-1 border-t border-white/5 pt-2 cursor-pointer"
                        title="Scan GNN Fraud Network Anomalies"
                      >
                        Scan Provider GNN Anomalies &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-6 text-center border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Submitted Amount</span>
                      <strong className="text-xl font-black font-display text-white">R {selectedClaim.fields.amounts.total_claimed.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Eligible Payable</span>
                      <strong className="text-xl font-black font-display text-[#00E0FF]">R {selectedClaim.fields.amounts.eligible_tariff.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Flywheel Savings</span>
                      <strong className="text-xl font-black font-display text-flywheel animate-pulse">R {selectedClaim.fields.amounts.savings_calculated.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Validation Rules */}
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Landmark size={10} /> SAP OData OPA Claims Rules
                      </span>
                      <button
                        onClick={() => onNavigate('popia')}
                        className="text-[9px] uppercase text-[#00E0FF] hover:underline hover:text-white font-mono tracking-wider cursor-pointer"
                        title="View POPIA encryption & SDX Atlas lineage details"
                      >
                        SDX Lineage Line ↗
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="odata-rules-grid">
                      {Object.entries(selectedClaim.validation_results.details).map(([ruleCode, info]: [string, any]) => (
                        <div key={ruleCode} className="p-3 border border-white/5 bg-black/40 flex items-start gap-2 text-[11px]">
                          {info.passed ? (
                            <div className="p-0.5 rounded-none bg-flywheel/15 text-flywheel border border-flywheel/40">
                              <Check size={10} />
                            </div>
                          ) : (
                            <div className="p-0.5 rounded-none bg-red-950 text-red-500 border border-red-900">
                              <ShieldAlert size={10} />
                            </div>
                          )}
                          <div>
                            <span className="font-mono text-[10px] font-black text-white/80 block uppercase">
                              {ruleCode} {info.passed ? "• PASS" : "• FLAG"}
                            </span>
                            <span className="text-white/50 text-[10px] block leading-tight mt-0.5">{info.message}</span>
                            {info.savings > 0 && info.passed && (
                              <span className="text-[9px] text-flywheel font-mono uppercase block mt-1">+R {info.savings} administrative savings reinvested</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Audit override Actions for Flagged claims */}
            <div className="mt-6 pt-4 border-t border-white/10" id="claims-control-actions">
              {selectedClaim.status === 'flagged' ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-yellow-950/20 border border-yellow-900/30 text-xs text-yellow-300 flex items-center gap-2">
                    <AlertTriangle size={14} className="flex-shrink-0 animate-bounce" />
                    <span>This transaction triggered manual audit flags (overall extraction confidence low or tariff mismatch). Resolve audit action:</span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAction(selectedClaim.document_id, 'approve')}
                      className="flex-1 py-3 bg-flywheel text-black uppercase font-black text-xs tracking-widest hover:bg-transparent hover:text-flywheel border border-flywheel transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={12} /> Override & Approve
                    </button>
                    <button
                      onClick={() => handleAction(selectedClaim.document_id, 'reject')}
                      className="flex-1 py-3 bg-red-600 text-white uppercase font-black text-xs tracking-widest hover:bg-transparent hover:text-red-500 border border-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={12} /> Deny Claim Mismatch
                    </button>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Comment for audit rejection reason..."
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full p-2 bg-black border border-white/5 font-mono text-[10px] text-white focus:outline-none focus:border-red-500 placeholder-white/30"
                    />
                  </div>
                </div>
              ) : selectedClaim.status === 'approved' ? (
                <div className="p-3 bg-flywheel/10 border border-flywheel/20 text-flywheel text-[10px] font-mono uppercase tracking-widest text-center">
                  Success: Claim Transaction Approved and Cleared. ZAR {selectedClaim.fields.amounts.savings_calculated} Reinvested into Proactive Pools.
                </div>
              ) : (
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs text-center font-mono uppercase">
                  Alert: Claim Leakage Blocked. Audit Reason: {selectedClaim.rejection_reason}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
