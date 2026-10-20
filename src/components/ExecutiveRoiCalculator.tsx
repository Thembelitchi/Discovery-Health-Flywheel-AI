import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * Benefit-case model for the claims automation programme.
 *
 * Everything below is ANNUAL. The previous version summed four plainly annual
 * cost lines into a variable named `totalMonthlyCost` and then multiplied by
 * twelve, which overstated cost 12x while still printing a 28.5x return -
 * a number no investment committee would accept. Costs and benefits are now
 * both stated per year, defaults are sized to a scheme's real claim volume,
 * and every constant is surfaced in the assumptions panel rather than buried.
 *
 * None of these figures are measured. They are planning assumptions, and the
 * UI says so.
 */

/** Cost lines, per year, in ZAR. Sized for a large medical scheme programme. */
const ANNUAL_COSTS = {
  platformInfrastructure: 28_000_000,
  dataScienceAndMlEngineering: 32_000_000,
  integrationAndChangeManagement: 24_000_000,
  programmeManagementAndAssurance: 12_000_000,
} as const;

/**
 * Figures published by Discovery Health Medical Scheme for 2025, reported at
 * its June 2026 AGM. These are not estimates and should not be edited without
 * a newer source.
 *
 *   claims paid        R89.4bn
 *   claims processed   64 million      -> average claim value R1,397
 *   beneficiaries      2,725,122
 *   chronic cohort     over 1,000,000 beneficiaries (2025 AGM presentation)
 *   hospital admission R74,613 average
 *
 * One further anchor, older and wider in scope: Discovery Health reported
 * R555m of fraud, waste and abuse recovered across its client schemes in 2018.
 * The recovery slider therefore models an INCREMENTAL uplift on an established
 * forensic programme, not the programme itself.
 */
const PUBLISHED = {
  claimsPaidZar: 89_400_000_000,
  claimsProcessed: 64_000_000,
  beneficiaries: 2_725_122,
  chronicCohort: 1_000_000,
  averageAdmissionZar: 74_613,
  fwaRecoveredZar2018: 555_000_000,
} as const;

/** Derived from published totals rather than assumed. */
const AVERAGE_CLAIM_VALUE = Math.round(PUBLISHED.claimsPaidZar / PUBLISHED.claimsProcessed);
const HIGH_RISK_MEMBERS = PUBLISHED.chronicCohort;

/** Unit economics still assumed; the sliders drive the rest. */
const AUTO_ADJUDICATION_COST_PER_CLAIM = 6;
const INTERVENTION_COST_PER_MEMBER = 450;
const HIGH_RISK_ADMISSION_RATE = 0.18;
const ADMISSIONS_AVOIDED_SHARE = 0.12;
const AVOIDED_ADMISSION_COST = PUBLISHED.averageAdmissionZar;

/**
 * Downside and upside bands. A single point estimate hides the fact that the
 * whole case turns on two or three assumptions.
 */
const SCENARIOS = {
  conservative: { label: 'Conservative', benefit: 0.6, cost: 1.3 },
  base: { label: 'Base case', benefit: 1, cost: 1 },
  optimistic: { label: 'Optimistic', benefit: 1.3, cost: 0.9 },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

const zar = (value: number) => `R ${Math.round(value).toLocaleString('en-ZA')}`;
const millions = (value: number) => `R ${(value / 1_000_000).toFixed(1)}m`;

export default function ExecutiveRoiCalculator() {
  const [annualClaims, setAnnualClaims] = useState<number>(PUBLISHED.claimsProcessed);
  const [manualReviewShare, setManualReviewShare] = useState(12);
  const [automationUplift, setAutomationUplift] = useState(30);
  const [manualReviewCost, setManualReviewCost] = useState(55);
  const [careGapClosure, setCareGapClosure] = useState(15);
  // Recovery is the most arguable input, so it is a dial rather than a constant.
  const [recoveryRate, setRecoveryRate] = useState(0.15);
  const [scenario, setScenario] = useState<ScenarioKey>('base');
  const [showAssumptions, setShowAssumptions] = useState(false);

  const { benefit: benefitFactor, cost: costFactor } = SCENARIOS[scenario];

  // --- Annual benefits -----------------------------------------------------

  /** Claims moved off the manual queue, and what each one stops costing. */
  const manualClaims = annualClaims * (manualReviewShare / 100);
  const claimsNewlyAutomated = manualClaims * (automationUplift / 100);
  const adjudicationBenefit =
    claimsNewlyAutomated * (manualReviewCost - AUTO_ADJUDICATION_COST_PER_CLAIM);

  /** Incremental fraud, waste and abuse recovered as a share of claims paid. */
  const annualClaimsValue = annualClaims * AVERAGE_CLAIM_VALUE;
  const recoveryBenefit = annualClaimsValue * (recoveryRate / 100);

  /** Admissions avoided because a care gap was closed in time. */
  const membersReached = HIGH_RISK_MEMBERS * (careGapClosure / 100);
  const preventionBenefit =
    membersReached * HIGH_RISK_ADMISSION_RATE * ADMISSIONS_AVOIDED_SHARE * AVOIDED_ADMISSION_COST;

  const grossBenefit = (adjudicationBenefit + recoveryBenefit + preventionBenefit) * benefitFactor;

  // --- Annual costs --------------------------------------------------------

  const careInterventionCost = membersReached * INTERVENTION_COST_PER_MEMBER;
  const platformCost = Object.values(ANNUAL_COSTS).reduce((a, b) => a + b, 0);
  const totalCost = (platformCost + careInterventionCost) * costFactor;

  // --- Headline ------------------------------------------------------------

  const netBenefit = grossBenefit - totalCost;
  const roiMultiple = totalCost > 0 ? grossBenefit / totalCost : 0;
  const paybackMonths = grossBenefit > 0 ? (totalCost / grossBenefit) * 12 : Infinity;

  const chartData = [
    { name: 'Claims automation', value: Math.round(adjudicationBenefit * benefitFactor) },
    { name: 'FWA recovery', value: Math.round(recoveryBenefit * benefitFactor) },
    { name: 'Admissions avoided', value: Math.round(preventionBenefit * benefitFactor) },
  ];

  /**
   * Every figure the model rests on, and where it comes from. `published`
   * means it is a reported Discovery Health Medical Scheme figure; everything
   * else is an assumption someone still has to own.
   */
  const assumptions: Array<{ label: string; value: string; basis: string; published?: boolean }> = [
    { label: 'Annual claims processed', value: `${(PUBLISHED.claimsProcessed / 1_000_000).toFixed(0)}M`, basis: 'DHMS 2025, reported at the June 2026 AGM', published: true },
    { label: 'Annual claims paid', value: `R ${(PUBLISHED.claimsPaidZar / 1e9).toFixed(1)}bn`, basis: 'DHMS 2025, reported at the June 2026 AGM', published: true },
    { label: 'Average claim value', value: zar(AVERAGE_CLAIM_VALUE), basis: 'Derived: claims paid / claims processed', published: true },
    { label: 'Beneficiaries', value: PUBLISHED.beneficiaries.toLocaleString('en-ZA'), basis: 'DHMS at 31 December 2025', published: true },
    { label: 'Chronic cohort', value: `${HIGH_RISK_MEMBERS.toLocaleString('en-ZA')} lives`, basis: 'DHMS 2025 AGM: over 1 million members live with a chronic condition', published: true },
    { label: 'Cost per avoided admission', value: zar(AVOIDED_ADMISSION_COST), basis: 'DHMS 2025 average cost per hospital admission', published: true },
    { label: 'Incremental FWA recovery', value: `${recoveryRate.toFixed(2)}% of claims paid`, basis: `Slider. Uplift on an existing programme that recovered ${millions(PUBLISHED.fwaRecoveredZar2018)} across client schemes in 2018` },
    { label: 'Claims manually reviewed today', value: `${manualReviewShare}%`, basis: 'Assumption - not published; ask claims operations' },
    { label: 'Manual review cost / claim', value: zar(manualReviewCost), basis: 'Assumption - blended assessor cost' },
    { label: 'Cost to auto-adjudicate', value: `${zar(AUTO_ADJUDICATION_COST_PER_CLAIM)} / claim`, basis: 'Assumption' },
    { label: 'Intervention cost', value: `${zar(INTERVENTION_COST_PER_MEMBER)} / member / year`, basis: 'Assumption - blended across the care gaps in this console' },
    { label: 'Admission rate in cohort', value: `${(HIGH_RISK_ADMISSION_RATE * 100).toFixed(0)}%`, basis: 'Assumption - needs actuarial input' },
    { label: 'Share of admissions avoidable', value: `${(ADMISSIONS_AVOIDED_SHARE * 100).toFixed(0)}%`, basis: 'Assumption - the most uncertain input in the model' },
    { label: 'Platform & infrastructure', value: `${millions(ANNUAL_COSTS.platformInfrastructure)} / year`, basis: 'Assumption - programme budget' },
    { label: 'Data science & ML engineering', value: `${millions(ANNUAL_COSTS.dataScienceAndMlEngineering)} / year`, basis: 'Assumption - programme budget' },
    { label: 'Integration & change management', value: `${millions(ANNUAL_COSTS.integrationAndChangeManagement)} / year`, basis: 'Assumption - year-one weighted' },
    { label: 'Programme management & assurance', value: `${millions(ANNUAL_COSTS.programmeManagementAndAssurance)} / year`, basis: 'Assumption - programme budget' },
  ];

  const publishedCount = assumptions.filter((a) => a.published).length;

  return (
    <div className="border border-white/10 bg-[#121212] p-6 space-y-8" id="roi-calculator-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel mb-1">
            Benefit case &mdash; annual, pre-tax
          </div>
          <h2 className="text-xl font-black font-display text-white uppercase flex items-center gap-2">
            Claims Automation ROI Model
          </h2>
        </div>
        <div className="mt-2 md:mt-0 p-2.5 bg-flywheel/5 border border-flywheel/20 flex items-center gap-2 text-[10px] tracking-wider uppercase font-mono font-bold text-white">
          <Calculator size={12} className="text-flywheel" /> Illustrative model
        </div>
      </div>

      <div className="p-3 border border-orange-400/30 bg-orange-400/5 text-[11px] text-orange-200/80 leading-relaxed flex gap-2">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          Claim volume, claims paid, beneficiaries, the chronic cohort and the average admission cost
          are <strong>Discovery Health Medical Scheme figures for 2025</strong>, reported at the June
          2026 AGM. The operational inputs &mdash; manual review share, intervention cost, avoidable
          admission share &mdash; are still <strong>assumptions</strong> and need an owner. Open the
          panel below: each input says which it is. Figures are annual.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-5 space-y-6 bg-black/40 p-5 border border-white/5" id="roi-inputs-panel">
          <div className="text-[10px] font-black uppercase tracking-wider text-flywheel border-b border-white/10 pb-2">
            Model inputs
          </div>

          <Slider
            label="Annual claims volume"
            display={`${(annualClaims / 1_000_000).toFixed(0)}M / year`}
            min={20_000_000}
            max={150_000_000}
            step={1_000_000}
            value={annualClaims}
            onChange={setAnnualClaims}
          />
          <Slider
            label="Claims manually reviewed today"
            display={`${manualReviewShare}%`}
            min={5}
            max={50}
            step={1}
            value={manualReviewShare}
            onChange={setManualReviewShare}
          />
          <Slider
            label="Of those, newly automated"
            display={`${automationUplift}%`}
            min={5}
            max={60}
            step={1}
            value={automationUplift}
            onChange={setAutomationUplift}
          />
          <Slider
            label="Manual review cost / claim"
            display={zar(manualReviewCost)}
            min={20}
            max={120}
            step={5}
            value={manualReviewCost}
            onChange={setManualReviewCost}
          />
          <Slider
            label="Care gap closure rate"
            display={`${careGapClosure}%`}
            min={5}
            max={40}
            step={1}
            value={careGapClosure}
            onChange={setCareGapClosure}
          />
          <Slider
            label="Incremental FWA recovery"
            display={`${recoveryRate.toFixed(2)}% of claims paid`}
            min={0.05}
            max={1}
            step={0.05}
            value={recoveryRate}
            onChange={setRecoveryRate}
          />

          <div className="pt-4 border-t border-white/5">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-2">
              Scenario
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScenario(key)}
                  className={`p-2 text-[9px] font-black uppercase tracking-wider border transition-all ${
                    scenario === key
                      ? 'border-flywheel text-flywheel bg-flywheel/10'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}
                >
                  {SCENARIOS[key].label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-white/30 mt-2 leading-relaxed font-mono uppercase">
              Benefits &times;{benefitFactor} &middot; costs &times;{costFactor}
            </p>
          </div>
        </div>

        {/* Outputs */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between" id="roi-outputs-panel">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Annual benefit" value={millions(grossBenefit)} />
            <Stat label="Annual cost" value={millions(totalCost)} muted />
            <Stat label="Net annual" value={millions(netBenefit)} accent={netBenefit >= 0} />
            <Stat
              label="Return multiple"
              value={`${roiMultiple.toFixed(2)}x`}
              accent={roiMultiple >= 1}
            />
          </div>

          <div className="p-3 border border-white/5 bg-black/25 text-[10px] font-mono uppercase tracking-wider text-white/50 flex justify-between">
            <span>Payback period</span>
            <span className="text-white">
              {Number.isFinite(paybackMonths) ? `${paybackMonths.toFixed(1)} months` : 'never'}
            </span>
          </div>

          <div className="h-44 border border-white/5 bg-black/40 p-3" id="roi-savings-chart">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2 font-mono">
              Annual benefit by source
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#fff"
                  fontSize={9}
                  width={130}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [zar(value), 'Annual benefit']}
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)' }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="value" fill="#C0FF00" radius={[0, 4, 4, 0]} barSize={14}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 2 ? '#00E0FF' : '#C0FF00'} opacity={0.85 - index * 0.15} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario band - the honest summary of the case */}
          <div className="border border-white/10 bg-black/25 p-4 space-y-2" id="roi-sensitivity-band">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/40 font-mono">
              Sensitivity across scenarios
            </div>
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
              const s = SCENARIOS[key];
              const benefit = (adjudicationBenefit + recoveryBenefit + preventionBenefit) * s.benefit;
              const cost = (platformCost + careInterventionCost) * s.cost;
              const multiple = cost > 0 ? benefit / cost : 0;
              return (
                <div key={key} className="flex items-center justify-between text-[10px] font-mono">
                  <span className={scenario === key ? 'text-flywheel font-bold' : 'text-white/50'}>
                    {s.label}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-white/40">{millions(benefit - cost)} net</span>
                    <span className={multiple >= 1 ? 'text-white font-bold' : 'text-orange-300 font-bold'}>
                      {multiple.toFixed(2)}x
                    </span>
                  </span>
                </div>
              );
            })}
            <p className="text-[9px] text-white/30 pt-1 leading-relaxed">
              Even the downside pays back, which is what you would expect at this scale:
              the benefit is under 1% of claims paid. The return rests mostly on recovery
              uplift and on the share of admissions genuinely avoidable &mdash; the two
              least validated inputs. Move those two sliders first.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAssumptions((open) => !open)}
            className="text-[10px] font-black uppercase tracking-widest border border-white/15 text-white/70 px-3 py-2 hover:border-flywheel hover:text-flywheel transition-all"
          >
            {showAssumptions ? 'Hide' : 'Show'} all {assumptions.length} inputs &mdash; {publishedCount} published, {assumptions.length - publishedCount} assumed
          </button>

          {showAssumptions && (
            <div className="border border-white/10 bg-black/40 divide-y divide-white/5" id="roi-assumptions-panel">
              {assumptions.map((a) => (
                <div key={a.label} className="p-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="text-[10px] text-white/70 font-bold flex-1 flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 text-[8px] font-mono tracking-wider uppercase flex-shrink-0 ${
                        a.published
                          ? 'bg-flywheel/15 text-flywheel'
                          : 'bg-orange-400/15 text-orange-300'
                      }`}
                    >
                      {a.published ? 'Published' : 'Assumed'}
                    </span>
                    {a.label}
                  </span>
                  <span className="text-[10px] text-white font-mono">{a.value}</span>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider flex-1 sm:text-right">
                    {a.basis}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-white/80">
        <span>{label}</span>
        <span className="font-mono text-white">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full accent-flywheel h-1 bg-white/10 rounded-lg cursor-pointer"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  const tone = accent ? 'text-flywheel' : muted ? 'text-white/50' : 'text-white';
  return (
    <div className="p-4 border border-white/5 bg-black/25 flex flex-col justify-between h-24">
      <span className="text-[9px] uppercase tracking-wider text-white/40">{label}</span>
      <span className={`text-lg font-black font-mono ${tone}`}>{value}</span>
    </div>
  );
}
