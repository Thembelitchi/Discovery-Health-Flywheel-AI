import React, { useState, useEffect } from 'react';
import { Claim, CareGap, FinancialSummary } from './types';
import DashboardMetrics from './components/DashboardMetrics';
import ClaimsFeed from './components/ClaimsFeed';
import CareGapsList from './components/CareGapsList';
import ClaimUploader from './components/ClaimUploader';
import AiInsightsHub from './components/AiInsightsHub';
import ExecutiveRoiCalculator from './components/ExecutiveRoiCalculator';
import FraudGraphVisualizer from './components/FraudGraphVisualizer';
import PopiaLineageTracker from './components/PopiaLineageTracker';
import MvpDemoWizards from './components/MvpDemoWizards';
import SystemKnowledgeHub from './components/SystemKnowledgeHub';
import HomeDashboardView from './components/HomeDashboardView';
import { Sparkles, Activity, FileText, HeartPulse, RefreshCw, AlertCircle, HelpCircle, Menu, X } from 'lucide-react';

export default function App() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [careGaps, setCareGaps] = useState<CareGap[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'claims' | 'gaps' | 'roi' | 'fraud' | 'popia' | 'demo'>('home');
  const [aiRefreshToggle, setAiRefreshToggle] = useState(false);
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto scroll to top of window on tab change to prevent user from keeping scrolling down
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Fetch initial ledger status
  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      setClaims(data.claims);
      setCareGaps(data.careGaps);
      setFinancialSummary(data.financialSummary);
    } catch (err) {
      console.error("Error loading server data:", err);
      showNotice("Failed to synchronize with Discovery OData Server. Reconnecting...", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotice = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Upload/commit claim
  const handleUploadClaim = async (claimData: any) => {
    try {
      const response = await fetch("/api/claim/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimData),
      });
      const data = await response.json();
      if (data.success) {
        setClaims(prev => [data.claim, ...prev]);
        setFinancialSummary(data.financialSummary);
        showNotice(`Transaction ${data.claim.document_id} committed and verified!`, "success");
        setAiRefreshToggle(p => !p); // refresh AI insights
      }
    } catch (err) {
      console.error(err);
      showNotice("Failed to commit transaction to CDP server.", "error");
    }
  };

  // Override manual flagged claims
  const handleClaimAction = async (docId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch("/api/claim/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, action, reason }),
      });
      const data = await response.json();
      if (data.success) {
        setClaims(data.claims);
        setFinancialSummary(data.financialSummary);
        showNotice(`Claim ${docId} manual override completed: ${action === 'approve' ? 'Approved' : 'Denied'}.`, "info");
        setAiRefreshToggle(p => !p);
      }
    } catch (err) {
      console.error(err);
      showNotice("Claims action failed.", "error");
    }
  };

  // Trigger care gaps
  const handleTriggerGap = async (gapId: string, note?: string) => {
    try {
      const response = await fetch("/api/caregaps/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapId, note }),
      });
      const data = await response.json();
      if (data.success) {
        setCareGaps(data.careGaps);
        setFinancialSummary(data.financialSummary);
        showNotice(`Care pathway gap ${gapId} optimization triggered. Check voucher status!`, "success");
        setAiRefreshToggle(p => !p);
      }
    } catch (err: any) {
      toastError(err);
    }
  };

  const toastError = async (err: any) => {
    showNotice("Cannot fund gap. Ensure claims savings cover the subsidy cost.", "error");
  };

  const generateReport = () => {
    const reportText = `DISCOVERY HEALTH FLYWHEEL - SYSTEM AUDIT REPORT (mTLS VERIFIED)
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Audit Ledger Session Hash: DH-X-${Math.floor(Math.random() * 900000 + 100000)}

[REINVESTMENT ANALYSIS MATRIX]
--------------------------------------------------
Total Claims Audited    : ${financialSummary?.total_claims_count?.toLocaleString() || "4"} transactions
Auto-Approved           : ${financialSummary?.auto_approved_count?.toLocaleString() || "2"} transactions
Flagged for Audit       : ${financialSummary?.flagged_review_count?.toLocaleString() || "2"} transactions
Total Value Handled     : ZAR ${financialSummary?.total_claims_value_zar?.toLocaleString() || "120,000"} ZAR
Cumulative Saved Pool   : ZAR ${financialSummary?.savings_reinvestment_pool_zar?.toLocaleString() || "4,930"} ZAR
Direct Preventative Out : ZAR ${financialSummary?.preventative_outlay_zar?.toLocaleString() || "0"} ZAR
Calculated Net Velocity : +12.4% health stabilization

[SECURITY PROTOCOL STATUS]
--------------------------------------------------
AES-256 Tokenization    : ENABLED via Cloudera SDX
Council for Medical Sch : COMPLIANT (SARR-902)
SAP OData GL Postings   : RECONCILED (99.8% match confidence)

--------------------------------------------------
Report visual display validated. System operational.`;

    setReportContent(reportText);
    setIsHubOpen(true);
    showNotice("Audit report generated & synced directly to System Console!", "success");

    try {
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Flywheel-Audit-Report-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("Iframe sandboxing blocked automatic download. Presenting full interactive copy-paste clipboard control instead.");
    }
  };

  const handleMilestoneChange = (milestone: 'm1' | 'm2' | 'm3') => {
    if (milestone === 'm1') {
      setFinancialSummary({
        total_claims_count: 1200000,
        total_claims_value_zar: 115000000,
        auto_approved_count: 960000,
        flagged_review_count: 240000,
        savings_reinvestment_pool_zar: 2300000,
        preventative_outlay_zar: 450000
      });
      showNotice("Month 1 Foundation State: Streamed 1.2M transactions", "info");
    } else if (milestone === 'm2') {
      setFinancialSummary({
        total_claims_count: 4500000,
        total_claims_value_zar: 390000000,
        auto_approved_count: 3600000,
        flagged_review_count: 900000,
        savings_reinvestment_pool_zar: 14800000,
        preventative_outlay_zar: 1200000
      });
      showNotice("Month 2 Claims Pilot State: Document AI accuracy 96.4%", "success");
    } else if (milestone === 'm3') {
      setFinancialSummary({
        total_claims_count: 15000000,
        total_claims_value_zar: 1275000000,
        auto_approved_count: 12600000,
        flagged_review_count: 2400000,
        savings_reinvestment_pool_zar: 309380908,
        preventative_outlay_zar: 10800000
      });
      showNotice("Month 3 Care Gap Scale State: -18% ER visits reduction (p=0.003)", "success");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col justify-between overflow-x-hidden select-none" id="flywheel-health-ai-app">
      {/* Header Navigation consistent with Bold Typography theme */}
      <header className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-white/10 relative z-40" id="app-header-navigation">
        <div className="flex items-center gap-3">
          {/* Universal Burger Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 border border-white/10 text-white hover:text-flywheel hover:border-flywheel transition-all cursor-pointer mr-1"
            title="Toggle Navigation Menu"
            id="mobile-burger-toggle"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          <div 
            onClick={() => setActiveTab('home')}
            className="text-xs font-bold tracking-[0.4em] uppercase text-white flex items-center gap-1.5 cursor-pointer hover:text-flywheel transition-colors"
          >
            Discovery Health Flywheel
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsHubOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 border border-flywheel bg-flywheel/5 text-flywheel text-[9px] font-mono uppercase tracking-widest hover:bg-flywheel hover:text-black transition-colors cursor-pointer mr-2"
            title="Open Interactive FAQ & Glossary Guide"
          >
            <HelpCircle size={11} /> FAQ Guide
          </button>
          <div 
            onClick={() => setActiveTab('home')}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C0FF00] to-[#00E0FF] animate-pulse cursor-pointer"
          ></div>
          <span className="hidden sm:inline text-[10px] font-black tracking-widest uppercase text-white cursor-pointer" onClick={() => setActiveTab('home')}>T. Litchi</span>
        </div>
      </header>

      {/* Universal Expanded Burger Menu overlay */}
      {isMobileMenuOpen && (
        <div className="bg-[#0A0A0A] border-b border-white/10 transition-all duration-300 pb-6 pt-4 px-6 relative z-30 space-y-4 shadow-xl" id="expanded-mobile-navigation">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Navigation channels:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold uppercase tracking-wider">
            <button 
              onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'home' ? 'border-flywheel text-flywheel bg-white/2 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              Home / Dashboard Overview
            </button>
            <button 
              onClick={() => { setActiveTab('claims'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'claims' ? 'border-[#00E0FF] text-[#00E0FF] bg-[#00E0FF]/5 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              Claims Ledger Stream
            </button>
            <button 
              onClick={() => { setActiveTab('gaps'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'gaps' ? 'border-red-400 text-red-400 bg-red-400/5 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              Proactive Care Gaps
            </button>
            <button 
              onClick={() => { setActiveTab('roi'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'roi' ? 'border-flywheel text-flywheel bg-white/2 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              Executive ROI Model
            </button>
            <button 
              onClick={() => { setActiveTab('fraud'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'fraud' ? 'border-purple-400 text-purple-400 bg-purple-400/5 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              GNN Fraud Network
            </button>
            <button 
              onClick={() => { setActiveTab('popia'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'popia' ? 'border-blue-400 text-blue-400 bg-blue-400/5 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              POPIA & SDX Lineage
            </button>
            <button 
              onClick={() => { setActiveTab('demo'); setIsMobileMenuOpen(false); }} 
              className={`p-2.5 text-left transition-all border ${activeTab === 'demo' ? 'border-orange-400 text-orange-400 bg-orange-400/5 font-black' : 'border-white/5 text-white hover:border-white/10'}`}
            >
              90-Day MVP Demo Roadmap
            </button>
            <button 
              onClick={() => { setIsHubOpen(true); setIsMobileMenuOpen(false); }} 
              className="p-2.5 text-left transition-all border border-flywheel text-flywheel bg-flywheel/5 flex items-center gap-1.5"
            >
              <HelpCircle size={13} /> Open FAQ & Knowledge Hub
            </button>
          </div>
        </div>
      )}

      {/* Floating Notice Popup */}
      {notification && (
        <div className="fixed top-24 right-10 z-50 p-4 border flex items-center gap-3 shadow-2xl transition-all animate-bounce rounded-none text-xs" style={{
          backgroundColor: notification.type === 'success' ? '#142a18' : notification.type === 'error' ? '#2d1515' : '#141c2c',
          borderColor: notification.type === 'success' ? '#C0FF00' : notification.type === 'error' ? '#f87171' : '#38bdf8',
          color: notification.type === 'success' ? '#C0FF00' : notification.type === 'error' ? '#f87171' : '#e0f2fe'
        }} id="app-toast-alert">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="font-bold uppercase tracking-wider">{notification.message}</span>
        </div>
      )}

      {/* Main Grid Content */}
      <main className="flex-1 px-6 md:px-10 py-8 max-w-7xl mx-auto w-full space-y-8" id="dashboard-layout-main">

        {/* Home Tab Specific High-Fidelity Dashboards */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in" id="home-only-dash-widgets">
            {/* Dynamic & Collapsible Premium AI Hub & Momentum Banner */}
            <div className="border border-white/10 bg-[#0E0E0E] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" id="ai-hub-control-bar">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-flywheel opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-flywheel"></span>
                </span>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                    Discovery Flywheel AI & Analytics Engine
                  </div>
                  <p className="text-[9px] text-[#00E0FF] font-mono uppercase tracking-wider mt-0.5">
                    Dynamic Clinical CDP • Real-time Solvency Reinvestments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsHubOpen(true);
                    showNotice("Opening interactive operational guide & FAQ Console...", "info");
                  }}
                  className="px-3 py-1.5 border border-[#00E0FF]/40 bg-[#00E0FF]/10 text-[#00E0FF] hover:bg-[#00E0FF] hover:text-black text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                  title="Open System FAQ & Operational Guide"
                >
                  <HelpCircle size={10} /> FAQ Guide
                </button>
                <button
                  onClick={() => {
                    setAiRefreshToggle(!aiRefreshToggle);
                    showNotice("Requesting real-time clinical synthesis summary...", "success");
                  }}
                  className="px-3 py-1.5 border border-white/15 bg-transparent hover:border-flywheel text-white/80 hover:text-flywheel text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                  title="Refresh AI insights feed"
                >
                  Sync Channels
                </button>
                <button
                  onClick={() => {
                    setIsHeroExpanded(!isHeroExpanded);
                    showNotice(isHeroExpanded ? "AI Hub Minimized. Dashboards decluttered." : "AI Hub Maximized. Rendering Live GNN & LLM diagnostics.", "info");
                  }}
                  className={`px-4 py-1.5 font-bold uppercase text-[9px] tracking-widest transition-all cursor-pointer ${
                    isHeroExpanded 
                      ? 'bg-neutral-800 text-white hover:bg-neutral-700' 
                      : 'bg-flywheel text-black hover:bg-transparent hover:text-flywheel border border-flywheel'
                  }`}
                >
                  {isHeroExpanded ? "Minimize AI Hub & Stats" : "Show AI Hub & Stats"}
                </button>
              </div>
            </div>

            {isHeroExpanded && (
              <div className="flex flex-col lg:flex-row gap-8 items-stretch animate-fade-in" id="hero-marketing-panel">
                {/* Left panel: Huge Typography momentum */}
                <div className="w-full lg:w-3/5 p-6 md:p-10 border border-white/10 bg-black/40 flex flex-col justify-between h-[360px] md:h-auto" id="left-hero-banner">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-4 animate-pulse flex items-center gap-2">
                      <span>●</span> System Status: Optimal
                    </div>
                    <h1 className="text-[75px] md:text-[110px] leading-[0.8] font-black tracking-tighter uppercase font-display text-white">
                      Fly<br/>Wheel
                    </h1>
                  </div>

                  <div className="flex items-end justify-between border-t border-white/10 pt-6 mt-6">
                    <div>
                      <span className="text-[75px] leading-[0.8] font-black tracking-tighter text-white font-display">84</span>
                      <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40 mt-2">Momentum Index Score</div>
                    </div>
                    <div className="pb-1 text-right">
                      <div className="text-2xl font-bold text-flywheel animate-pulse">+12.4%</div>
                      <div className="text-[9px] font-bold tracking-widest uppercase text-white/40">vs Last 7 Days</div>
                    </div>
                  </div>
                </div>

                {/* Right panel: Gemini Live Synthesis Insights */}
                <div className="w-full lg:w-2/5" id="right-hero-analysis">
                  <AiInsightsHub triggerRefreshToggle={aiRefreshToggle} />
                </div>
              </div>
            )}

            {/* Bento Metrics indicators */}
            {financialSummary && <DashboardMetrics summary={financialSummary} onNavigate={setActiveTab} />}
          </div>
        )}

        {/* Tab content */}
        <div className="mt-8" id="active-tab-content-panel">
          {activeTab === 'home' && (
            <div id="home-view-module" className="animate-fade-in">
              <HomeDashboardView 
                summary={financialSummary} 
                onNavigate={setActiveTab} 
                onOpenFAQ={() => setIsHubOpen(true)}
              />
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-8" id="claims-view-module">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Activity size={16} className="text-flywheel" />
                <h2 className="text-lg font-black tracking-widest uppercase text-white">Claims Ledger Stream</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8" id="claims-layout-grid">
                <div className="xl:col-span-2">
                  <ClaimsFeed claims={claims} onAction={handleClaimAction} onNavigate={setActiveTab} />
                </div>
                <div className="xl:col-span-1">
                  <ClaimUploader onUpload={handleUploadClaim} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gaps' && (
            <div id="gaps-view-module">
              {financialSummary && (
                <CareGapsList 
                  careGaps={careGaps} 
                  savingsPool={financialSummary.savings_reinvestment_pool_zar} 
                  onTriggerGap={handleTriggerGap} 
                />
              )}
            </div>
          )}

          {activeTab === 'roi' && (
            <div id="roi-view-module" className="animate-fade-in">
              <ExecutiveRoiCalculator />
            </div>
          )}

          {activeTab === 'fraud' && (
            <div id="fraud-view-module" className="animate-fade-in">
              <FraudGraphVisualizer />
            </div>
          )}

          {activeTab === 'popia' && (
            <div id="popia-view-module" className="animate-fade-in">
              <PopiaLineageTracker />
            </div>
          )}

          {activeTab === 'demo' && (
            <div id="demo-view-module" className="animate-fade-in">
              <MvpDemoWizards onMilestoneChange={handleMilestoneChange} onNavigate={setActiveTab} />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Data Stream Footer matching provided Bold Typography theme design */}
      <footer className="mt-12 bg-flywheel text-[#0a0a0a] flex flex-col md:flex-row items-center justify-between p-6 md:px-10 py-6 gap-6 md:gap-14" id="data-stream-footer">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]">Active Stream</div>
          <div className="w-2.5 h-2.5 rounded-full bg-black animate-ping"></div>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full justify-items-stretch">
          <div className="flex flex-col border-l border-black/15 pl-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-black/60">Glucose Avg</span>
            <span className="text-lg font-black">94 mg/dL</span>
          </div>
          <div className="flex flex-col border-l border-black/15 pl-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-black/60">VO2 Max</span>
            <span className="text-lg font-black">52.1</span>
          </div>
          <div className="flex flex-col border-l border-black/15 pl-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-black/60">Stress Load</span>
            <span className="text-lg font-black uppercase">Low</span>
          </div>
          <div className="flex flex-col border-l border-black/15 pl-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-black/60">Audited Savings Pool</span>
            <span className="text-lg font-black">R {financialSummary?.savings_reinvestment_pool_zar.toLocaleString() || "4,580"}</span>
          </div>
        </div>

        <button 
          onClick={generateReport}
          className="w-full md:w-auto px-8 py-3 bg-black text-flywheel text-[10px] font-black uppercase tracking-[0.2em] border border-black hover:bg-transparent hover:text-black transition-colors"
          id="export-audit-feed-btn"
        >
          Generate Report
        </button>
      </footer>

      {/* System Knowledge Hub Overlay */}
      <SystemKnowledgeHub
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        reportContent={reportContent}
        onClearReport={() => setReportContent(null)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          showNotice(`Routed to ${tab.toUpperCase()} channel.`, "info");
        }}
      />
    </div>
  );
}
