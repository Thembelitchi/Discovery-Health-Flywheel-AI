import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Network, User, FileText, Activity, Layers, Code, HardDrive } from 'lucide-react';

interface FraudRiskNode {
  id: string;
  label: string;
  type: 'member' | 'provider' | 'claim' | 'pharmacy';
  details: string;
  riskScore: number;
}

interface FraudAnomaly {
  id: string;
  title: string;
  type: 'Collusion Ring' | 'Clinical Upcoding' | 'Phantom Clinic' | 'Duplicate Leakage';
  nodes: FraudRiskNode[];
  shapFactors: Record<string, number>;
  score: number;
  unlockedLeakageZar: number;
  governingRule: string;
}

const FRAUD_SCENARIOS: FraudAnomaly[] = [
  {
    id: "ANOMALY-001",
    title: "Di-Sipho Collusion Ring Pattern",
    type: "Collusion Ring",
    score: 0.94,
    unlockedLeakageZar: 17500,
    governingRule: "V002 / GNN Communities LPA",
    nodes: [
      { id: "M01", label: "Sipho Dlamini", type: "member", details: "Member DI-9022-01 • Age 54 • Hypertension registry", riskScore: 0.15 },
      { id: "C01", label: "CLM-2026-042", type: "claim", details: "Total 42 consultations claimed in rolling 30-day window", riskScore: 0.98 },
      { id: "P01", label: "Dr. Out-Of-Schema-Mock", type: "provider", details: "Practice No: 0999999 • Specialty Code 04", riskScore: 0.92 }
    ],
    shapFactors: {
      "Dual provider shared member density": 0.42,
      "Average daily visit duration > 24 hours": 0.38,
      "Day-of-Week billing homogeneity": 0.14
    }
  },
  {
    id: "ANOMALY-002",
    title: "Cardio Pulmonary Upcoding Alert",
    type: "Clinical Upcoding",
    score: 0.88,
    unlockedLeakageZar: 4200,
    governingRule: "V005 / CPT-ICD10 Correlation",
    nodes: [
      { id: "M02", label: "Thabo Mokoena", type: "member", details: "Member DI-9033-03 • Age 68 • Geriatric plan", riskScore: 0.12 },
      { id: "C02", label: "CLM-2026-003", type: "claim", details: "Billed CPT 94010 (Spirometry) alongside 99243 Specialist consult", riskScore: 0.54 },
      { id: "P02", label: "Dr. M. Khumalo", type: "provider", details: "Practice No: 0112394 • Pulmonology specialist", riskScore: 0.22 }
    ],
    shapFactors: {
      "Procedure-Diagnosis incompatibility": 0.48,
      "E&M modifier -25 usage index": 0.25,
      "Peer specialty cost variance > 3.0 Standard Dev": 0.15
    }
  },
  {
    id: "ANOMALY-003",
    title: "Pathcare Double Billing Leakage",
    type: "Duplicate Leakage",
    score: 0.99,
    unlockedLeakageZar: 3450,
    governingRule: "V004 / Identical Transaction Registry",
    nodes: [
      { id: "M03", label: "Sarah Lene", type: "member", details: "Member DI-9022-02 • Age 42 • Type 2 Diabetes", riskScore: 0.05 },
      { id: "C03", label: "CLM-2026-004", type: "claim", details: "Identical transaction timestamp, amount and code matches", riskScore: 0.99 },
      { id: "P03", label: "Pathcare Labs SA", type: "provider", details: "Practice No: 0334812 • Active Network Tier", riskScore: 0.02 }
    ],
    shapFactors: {
      "Duplicate index check matching CLM-2026-003": 0.85,
      "Same-day multi-line claim overlap": 0.14
    }
  }
];

export default function FraudGraphVisualizer() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("ANOMALY-001");
  const activeScenario = FRAUD_SCENARIOS.find(s => s.id === selectedScenarioId) || FRAUD_SCENARIOS[0];

  return (
    <div className="border border-white/10 bg-[#121212] p-6 space-y-6" id="fraud-graph-container">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">Cloudera GNN GraphX Engine</div>
          <h2 className="text-xl font-black font-display text-white uppercase flex items-center gap-2">
            Real-Time Fraud Network Alerts
          </h2>
        </div>
        <div className="mt-2 md:mt-0 p-2 border border-red-500/20 bg-red-950/10 flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-red-400">
          <Activity size={12} className="animate-pulse" /> Live Graph Scanning
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Scenarios List - Left */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-[9px] font-bold tracking-widest text-white/40 uppercase mb-2">
            Active Neural Graph Flags ({FRAUD_SCENARIOS.length})
          </div>
          {FRAUD_SCENARIOS.map(scenario => {
            const isSelected = scenario.id === selectedScenarioId;
            return (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className={`p-4 border select-none cursor-pointer transition-all flex justify-between items-center ${
                  isSelected ? 'border-red-500 bg-red-900/10' : 'border-white/5 bg-[#171717] hover:border-white/15'
                }`}
              >
                <div>
                  <span className="font-mono text-[9px] font-bold text-red-500 block uppercase tracking-wider">{scenario.type}</span>
                  <div className="text-xs font-black text-white mt-1">{scenario.title}</div>
                  <span className="text-[9px] text-white/40 font-mono uppercase mt-1 block">Rule check: {scenario.governingRule}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-red-500">{(scenario.score * 100).toFixed(0)}%</span>
                  <div className="text-[8px] uppercase text-white/30 tracking-wider">Score</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Graph & SHAP Analysis - Right */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-5 border border-white/5 bg-black/40 relative min-h-[220px] flex flex-col justify-between" id="neural-nodes-canvas">
            <div className="text-[9px] font-mono uppercase text-white/40 mb-4 tracking-widest flex justify-between">
              <span>Vertex Relationship Path Map</span>
              <span className="text-red-500">Leakage Blocked: R {activeScenario.unlockedLeakageZar.toLocaleString()} ZAR</span>
            </div>

            {/* Visual Node Chain */}
            <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-6" id="fraud-graph-nodes-flow">
              {activeScenario.nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  <div className="flex flex-col items-center text-center p-3 border border-white/10 bg-[#121212] w-40 select-none">
                    <div className="p-1.5 bg-red-950/40 text-red-400 border border-red-900/40 mb-1.5">
                      {node.type === 'member' ? <User size={14} /> : node.type === 'provider' ? <HardDrive size={14} /> : <FileText size={14} />}
                    </div>
                    <span className="text-[9px] font-black uppercase text-white font-mono tracking-wider">{node.id}</span>
                    <strong className="text-xs text-white max-w-[130px] truncate block">{node.label}</strong>
                    <div className="w-full h-1 bg-white/10 mt-2">
                      <div className="h-full bg-red-500" style={{ width: `${node.riskScore * 100}%` }}></div>
                    </div>
                    <span className="text-[8px] text-white/40 mt-1 uppercase">Risk Base: {(node.riskScore * 100).toFixed(0)}%</span>
                  </div>

                  {index < activeScenario.nodes.length - 1 && (
                    <div className="hidden md:flex flex-col items-center text-red-500 text-xs font-mono animate-pulse font-black">
                      <span>───▶</span>
                      <span className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5">edge</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="text-[8px] font-mono text-white/30 uppercase mt-4">
              Community identification: Label Propagation Algorithm community index {activeScenario.id}
            </div>
          </div>

          {/* SHAP explainability waterfall */}
          <div className="p-4 border border-white/5 bg-[#171717]" id="shap-waterfall">
            <div className="text-[9px] font-mono uppercase tracking-widest text-flywheel mb-3 flex items-center gap-1.5">
              <Code size={10} /> CMS Circular 11/2024 Compliant SHAP Explainability Matrix
            </div>
            <div className="space-y-3 font-mono text-[10px]">
              {Object.entries(activeScenario.shapFactors).map(([factor, value]) => {
                const percent = (value * 100).toFixed(0);
                return (
                  <div key={factor} className="space-y-1">
                    <div className="flex justify-between text-white/80 uppercase">
                      <span>{factor}</span>
                      <span className="text-red-400">+{percent}% impact</span>
                    </div>
                    <div className="w-full h-[3px] bg-white/5">
                      <div className="h-full bg-red-500 opacity-80" style={{ width: `${value * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
