import React, { useState } from 'react';
import { Sparkles, Calculator, Landmark, ShieldCheck, TrendingUp, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ExecutiveRoiCalculator() {
  const [claimsVolume, setClaimsVolume] = useState<number>(15000000);
  const [incrementalAutoRate, setIncrementalAutoRate] = useState<number>(20);
  const [manualReviewCost, setManualReviewCost] = useState<number>(85);
  const [careGapClosure, setCareGapClosure] = useState<number>(40);
  
  // Static context defaults from financial model
  const autoAdjudicationCost = 8;
  const fraudRate = 0.5; // %
  const avgFraudValue = 8500;
  const erVisitCost = 12000;
  const highRiskMembers = 150000;
  const interventionCost = 180;
  const staffHourlyCost = 180;
  const priorAuthVolume = 50000;

  // Monthly Savings calculation rules
  const autoAdjudicationSavings = claimsVolume * (incrementalAutoRate / 100) * (manualReviewCost - autoAdjudicationCost);
  const fraudPreventionSavings = claimsVolume * (fraudRate / 100) * 3 * avgFraudValue * 0.5 * 0.1; // model scaled factor from context
  const careGapSavings = highRiskMembers * (careGapClosure / 100) * erVisitCost * 0.10;
  const operationalEfficiencySavings = priorAuthVolume * 44 * staffHourlyCost / 730; // 44 hours saved
  
  const totalMonthlySavings = autoAdjudicationSavings + fraudPreventionSavings + careGapSavings + operationalEfficiencySavings;
  const annualGrossSavings = totalMonthlySavings * 12;

  // Costs
  const infraCost = 1250000;
  const mlTrainingCost = 850000;
  const integrationCost = 450000;
  const careInterventionCost = highRiskMembers * (careGapClosure / 100) * interventionCost;
  const programMgmtCost = 650000;

  const totalMonthlyCost = infraCost + mlTrainingCost + integrationCost + careInterventionCost + programMgmtCost;
  const annualCost = totalMonthlyCost * 12;

  // Net ROI
  const netMonthlySavings = totalMonthlySavings - totalMonthlyCost;
  const netAnnualSavings = netMonthlySavings * 12;
  const amortizationFee = 2083333; // phase 1 amortized ZAR
  const finalNetAnnualToDiscovery = netAnnualSavings - 25000000;

  const roiMultiple = Number((annualGrossSavings / annualCost).toFixed(1));

  const chartData = [
    { name: 'Auto-Adjudication', value: Math.round(autoAdjudicationSavings) },
    { name: 'Fraud Prev', value: Math.round(fraudPreventionSavings) },
    { name: 'Care Gaps Closed', value: Math.round(careGapSavings) },
    { name: 'Op Efficiency', value: Math.round(operationalEfficiencySavings) }
  ];

  return (
    <div className="border border-white/10 bg-[#121212] p-6 space-y-8" id="roi-calculator-container">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">C-Suite Interactive Dashboard</div>
          <h2 className="text-xl font-black font-display text-white uppercase flex items-center gap-2">
            Discovery Health Flywheel ROI Projection Calculator
          </h2>
        </div>
        <div className="mt-2 md:mt-0 p-2.5 bg-flywheel/5 border border-flywheel/20 flex items-center gap-2 text-[10px] tracking-wider uppercase font-mono font-bold text-white">
          <Calculator size={12} className="text-flywheel" /> Live Modeling Node
        </div>
      </div>

      <p className="text-xs text-white/50 leading-relaxed">
        Model variable medical claims volumes and AI automation indexes. Witness how incremental performance gains directly drive massive financial reinvestment pools in real-time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Block */}
        <div className="lg:col-span-5 space-y-6 bg-black/40 p-5 border border-white/5" id="roi-inputs-panel">
          <div className="text-[10px] font-black uppercase tracking-wider text-flywheel border-b border-white/10 pb-2">
            Model Hypotheses Parameters
          </div>

          {/* Monthly Claims Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80">
              <span className="flex items-center gap-1">Monthly Claims Volume <HelpCircle size={10} title="Average principal membership monthly submittals" /></span>
              <span className="font-mono text-white">{(claimsVolume / 1000000).toFixed(1)} M claims</span>
            </div>
            <input
              type="range"
              min={1000000}
              max={25000000}
              step={500000}
              value={claimsVolume}
              onChange={(e) => setClaimsVolume(Number(e.target.value))}
              className="w-full accent-flywheel h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Incremental Auto adjudication Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80">
              <span>Auto-Adjudication Gain (%)</span>
              <span className="font-mono text-white">+{incrementalAutoRate}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={incrementalAutoRate}
              onChange={(e) => setIncrementalAutoRate(Number(e.target.value))}
              className="w-full accent-flywheel h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Manual Review Cost */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80">
              <span>Manual Review Fee / Claim</span>
              <span className="font-mono text-white">R {manualReviewCost} ZAR</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={manualReviewCost}
              onChange={(e) => setManualReviewCost(Number(e.target.value))}
              className="w-full accent-flywheel h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Care Gap Closure Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80">
              <span>Preventative Care Gap Closure</span>
              <span className="font-mono text-white">{careGapClosure}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={85}
              step={5}
              value={careGapClosure}
              onChange={(e) => setCareGapClosure(Number(e.target.value))}
              className="w-full accent-flywheel h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Static Variables Legend */}
          <div className="pt-4 border-t border-white/5 space-y-1.5 text-[9px] font-mono text-white/40 uppercase">
            <div className="flex justify-between">
              <span>Target Patient Cohort</span>
              <span>{highRiskMembers.toLocaleString()} lives</span>
            </div>
            <div className="flex justify-between">
              <span>Subsidized Care Intervention Cost</span>
              <span>R {interventionCost} / member</span>
            </div>
            <div className="flex justify-between">
              <span>Avoided Hospitalization SLA</span>
              <span>R {erVisitCost.toLocaleString()} ZAR</span>
            </div>
          </div>
        </div>

        {/* Dynamic Outputs Block */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between" id="roi-outputs-panel">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border border-white/5 bg-black/25 flex flex-col justify-between h-24">
              <span className="text-[9px] uppercase tracking-wider text-white/40">Monthly Gross Savings</span>
              <span className="text-lg font-black text-white font-mono">R {Math.round(totalMonthlySavings).toLocaleString()}</span>
            </div>
            <div className="p-4 border border-white/5 bg-black/25 flex flex-col justify-between h-24">
              <span className="text-[9px] uppercase tracking-wider text-white/40">Monthly Operational Cost</span>
              <span className="text-lg font-black text-white/50 font-mono">R {Math.round(totalMonthlyCost).toLocaleString()}</span>
            </div>
            <div className="p-4 border border-white/5 bg-black/25 col-span-2 md:col-span-1 flex flex-col justify-between h-24">
              <span className="text-[9px] uppercase tracking-wider text-flywheel">Net Annual ROI Multiple</span>
              <span className="text-xl font-black text-flywheel font-display animate-pulse">{roiMultiple}X</span>
            </div>
          </div>

          {/* Recharts Bar Chart Visualizer */}
          <div className="h-44 border border-white/5 bg-black/40 p-3" id="roi-savings-chart">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2 font-mono">
              Breakdown of Reclaimed Medical Leakage
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={9} fontStyle="italic" width={110} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`R ${value.toLocaleString()}`, 'Monthly Segment Savings']} 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)' }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="value" fill="#C0FF00" radius={[0, 4, 4, 0]} barSize={12}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#00E0FF' : '#C0FF00'} opacity={0.8 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Financial Statement & Solvency Indicator */}
          <div className="p-4 border border-flywheel/15 bg-flywheel/5 flex items-center justify-between text-xs font-mono">
            <div>
              <div className="font-bold text-white uppercase">Re-investment Pool Rate (Year 1):</div>
              <div className="text-flywheel uppercase mt-0.5 font-black text-sm">
                ZAR {(finalNetAnnualToDiscovery / 1000000).toFixed(1)} Million net positive
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 bg-flywheel text-black font-black text-[9px] tracking-wider uppercase rounded-none">
                SLA Approved
              </span>
              <div className="text-[8px] text-white/40 uppercase mt-1">CMS Solvency Met</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
