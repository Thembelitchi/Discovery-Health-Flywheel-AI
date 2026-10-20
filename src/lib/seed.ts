/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Seed fixtures for the demo ledger.
 *
 * These are SYNTHETIC records. No real Discovery Health member, provider or
 * claim appears here, and none should ever be committed to this repository.
 *
 * Financial totals are deliberately absent: every headline figure is derived
 * from these rows by `computeFinancialSummary` in `./ledger`, so there is no
 * stored total that can disagree with the data.
 */

import { CareGap, Claim, Member, Provider } from '../types';

export const seedMembers: Member[] = [
  { discovery_member_id: "DI-9011-01", name: "Sipho Dlamini", age: 54, plan_type: "Classic Comprehensive", chronic_conditions: ["Hypertension", "Dyslipidemia"] },
  { discovery_member_id: "DI-9022-02", name: "Sarah Lene", age: 42, plan_type: "Classic Saver", chronic_conditions: ["Type 2 Diabetes"] },
  { discovery_member_id: "DI-9033-03", name: "Thabo Mokoena", age: 68, plan_type: "Core Priority", chronic_conditions: ["COPD", "Mild Asthma"] },
  { discovery_member_id: "DI-9044-04", name: "Amina Patel", age: 31, plan_type: "Classic Saver", chronic_conditions: ["Severe Asthma"] },
  { discovery_member_id: "DI-9055-05", name: "Zola Ndlovu", age: 45, plan_type: "Classic Comprehensive", chronic_conditions: ["Hypertension", "Type 2 Diabetes"] }
];

export const seedProviders: Provider[] = [
  { practice_number: "0439201", name: "Dr. S. Naidoo (General Practitioner)", type: "GP" },
  { practice_number: "0112394", name: "Dr. M. Khumalo (Cardiologist)", type: "Specialist" },
  { practice_number: "0225691", name: "Dr. L. van Wyk (Pulmonologist)", type: "Specialist" },
  { practice_number: "0334812", name: "Pathcare Labs SA", type: "Laboratory" },
];

/**
 * Hand-written cases the console walks through: an approved claim, an
 * unregistered provider, a clean specialist claim and its duplicate.
 */
const narrativeClaims: Claim[] = [
  {
    document_id: "CLM-2026-001",
    confidence: 0.96,
    status: "approved",
    created_at: "2026-06-10T14:20:00Z",
    fields: {
      member: seedMembers[1], // Sarah Lene
      provider: seedProviders[0], // Dr. S Naidoo
      dates: { service_date: "2026-06-10" },
      amounts: {
        total_claimed: 1100,
        eligible_tariff: 1100,
        savings_calculated: 350, // Administrative & generic substitution saving
      },
      icd_10_codes: [{ code: "E11.9", description: "Type 2 diabetes mellitus without complications" }],
      cpt_codes: [
        { code: "99213", price: 650, description: "Physician outpatient consult (Medium complexity)" },
        { code: "83036", price: 450, description: "HbA1c Glycated Hemoglobin blood screening" }
      ]
    },
    validation_results: {
      passed: ["V001", "V002", "V003", "V004", "V005", "V006"],
      failed: [],
      details: {
        "V001": { passed: true, message: "Member DI-9022-02 active in Discovery Health registry", savings: 0 },
        "V002": { passed: true, message: "Provider practice 0439201 registered with BHF/Discovery", savings: 0 },
        "V003": { passed: true, message: "HbA1c blood test complies with core Pathway for Diabetes mellitus", savings: 200 },
        "V004": { passed: true, message: "No duplicate claims found for member in last 24h", savings: 0 },
        "V005": { passed: true, message: "In-network GP discount applied: 15% rate agreement saving captured", savings: 150 },
        "V006": { passed: true, message: "Claim date within valid 2026 schema window", savings: 0 }
      }
    },
    fhir_claim: {
      resourceType: "Claim",
      id: "CLM-2026-001",
      status: "active",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
      patient: { reference: "Patient/DI-9022-02", display: "Sarah Lene" },
      provider: { reference: "Organization/0439201", display: "Dr. S. Naidoo" },
      total: { value: 1100, currency: "ZAR" }
    }
  },
  {
    document_id: "CLM-2026-002",
    confidence: 0.94,
    status: "flagged",
    created_at: "2026-06-11T09:15:00Z",
    fields: {
      member: seedMembers[0], // Sipho Dlamini
      provider: { practice_number: "0999999", name: "Dr. Out-Of-Schema-Mock (Clinical Practice)", type: "GP" },
      dates: { service_date: "2026-06-11" },
      amounts: {
        total_claimed: 1850,
        eligible_tariff: 0,
        savings_calculated: 0,
      },
      icd_10_codes: [{ code: "I10", description: "Essential (primary) hypertension" }],
      cpt_codes: [
        { code: "99214", price: 950, description: "Physician outpatient consult (High complexity)" },
        { code: "93000", price: 900, description: "Electrocardiogram (ECG) tracing and analysis" }
      ]
    },
    validation_results: {
      passed: ["V001", "V003", "V004", "V006"],
      failed: ["V002", "V005"],
      details: {
        "V001": { passed: true, message: "Member DI-9011-01 active in Discovery Health registry", savings: 0 },
        "V002": { passed: false, message: "Provider practice number 0999999 unregistered or suspended", savings: 0 },
        "V003": { passed: true, message: "ECG complies with Pathway for Hypertension registry", savings: 0 },
        "V004": { passed: true, message: "No duplicate claims found for member in last 24h", savings: 0 },
        "V005": { passed: false, message: "Out-of-network clinic rate exceeded maximum contract tariff limit by R900", savings: 900 },
        "V006": { passed: true, message: "Claim date within valid 2026 schema window", savings: 0 }
      }
    },
    rejection_reason: "V002 failed: Unregistered provider practice number. Admin/fraud audit needed.",
    fhir_claim: {
      resourceType: "Claim",
      id: "CLM-2026-002",
      status: "draft",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
      patient: { reference: "Patient/DI-9011-01", display: "Sipho Dlamini" },
      provider: { reference: "Organization/0999999", display: "Dr. Out-Of-Schema-Mock" },
      total: { value: 1850, currency: "ZAR" }
    }
  },
  {
    document_id: "CLM-2026-003",
    confidence: 0.98,
    status: "approved",
    created_at: "2026-06-11T16:45:00Z",
    fields: {
      member: seedMembers[2], // Thabo Mokoena
      provider: seedProviders[1], // Dr. M Khumalo
      dates: { service_date: "2026-06-11" },
      amounts: {
        total_claimed: 3450,
        eligible_tariff: 3450,
        savings_calculated: 780, // Smart network tariff discount
      },
      icd_10_codes: [{ code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified" }],
      cpt_codes: [
        { code: "99243", price: 2100, description: "Specialist consultation (High complexity)" },
        { code: "94010", price: 1350, description: "Spirometry measurement of lung capacities" }
      ]
    },
    validation_results: {
      passed: ["V001", "V002", "V003", "V004", "V005", "V006"],
      failed: [],
      details: {
        "V001": { passed: true, message: "Member DI-9033-03 active in Discovery Health registry", savings: 0 },
        "V002": { passed: true, message: "Specialist practice 0112394 active and registered", savings: 0 },
        "V003": { passed: true, message: "Spirometry lung function complies with COPD care guidelines", savings: 380 },
        "V004": { passed: true, message: "No duplicate claims found in historical ledger", savings: 0 },
        "V005": { passed: true, message: "Discovery Network Co-payment waived. In-network contract rate saved R400", savings: 400 },
        "V006": { passed: true, message: "Claim date within valid 2026 schema window", savings: 0 }
      }
    },
    fhir_claim: {
      resourceType: "Claim",
      id: "CLM-2026-003",
      status: "active",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
      patient: { reference: "Patient/DI-9033-03", display: "Thabo Mokoena" },
      provider: { reference: "Organization/0112394", display: "Dr. M. Khumalo" },
      total: { value: 3450, currency: "ZAR" }
    }
  },
  {
    document_id: "CLM-2026-004",
    confidence: 0.99,
    status: "flagged",
    created_at: "2026-06-12T08:10:00Z",
    fields: {
      member: seedMembers[2], // Thabo Mokoena duplication!
      provider: seedProviders[1], // Dr. M Khumalo
      dates: { service_date: "2026-06-11" }, // Same date
      amounts: {
        total_claimed: 3450,
        eligible_tariff: 0,
        savings_calculated: 3450, // Flagged duplicate -> Entire amount can be saved as leakage!
      },
      icd_10_codes: [{ code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified" }],
      cpt_codes: [
        { code: "99243", price: 2100, description: "Specialist consultation (High complexity)" },
        { code: "94010", price: 1350, description: "Spirometry measurement of lung capacities" }
      ]
    },
    validation_results: {
      passed: ["V001", "V002", "V003", "V005", "V006"],
      failed: ["V004"],
      details: {
        "V001": { passed: true, message: "Member DI-9033-03 active in Discovery Health registry", savings: 0 },
        "V002": { passed: true, message: "Specialist practice 0112394 active and registered", savings: 0 },
        "V003": { passed: true, message: "Spirometry lung function complies with COPD care guidelines", savings: 0 },
        "V004": { passed: false, message: "Duplicate active claim detected: Identical provider, patient, date, codes submitted twice", savings: 3450 },
        "V005": { passed: true, message: "Discovery Network tariff check completed", savings: 0 },
        "V006": { passed: true, message: "Claim date within valid 2026 schema window", savings: 0 }
      }
    },
    rejection_reason: "V004 failed: Duplicate health transaction audit triggered. Total leakage of R3,450 blocked.",
    fhir_claim: {
      resourceType: "Claim",
      id: "CLM-2026-004",
      status: "draft",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
      patient: { reference: "Patient/DI-9033-03", display: "Thabo Mokoena" },
      provider: { reference: "Organization/0112394", display: "Dr. M. Khumalo" },
      total: { value: 3450, currency: "ZAR" }
    }
  }
];

export const seedCareGaps: CareGap[] = [
  {
    id: "GAP-101",
    member_id: "DI-9011-01",
    member_name: "Sipho Dlamini",
    member_age: 54,
    chronic_condition: "Hypertension",
    gap_type: "Cardiovascular Risk Assessment",
    description: "Annual echocardiogram and metabolic profile check outstanding under chronic care pathway.",
    risk_level: "High",
    status: "open",
    recommended_cpt: "93306 (Cardiac Ultrasound, R 1,200)",
    cohort_size: 4_180,
    subsidized_cost_zar: 3_553_000,
  },
  {
    id: "GAP-102",
    member_id: "DI-9022-02",
    member_name: "Sarah Lene",
    member_age: 42,
    chronic_condition: "Type 2 Diabetes",
    gap_type: "Eye and Renal Diabetic Screening",
    description: "Annual fundus photography and kidney microalbumin urine test gaps detected.",
    risk_level: "Medium",
    status: "open",
    recommended_cpt: "92250 (Fundus Photography, R 550)",
    cohort_size: 6_920,
    subsidized_cost_zar: 3_114_000,
  },
  {
    id: "GAP-103",
    member_id: "DI-9033-03",
    member_name: "Thabo Mokoena",
    member_age: 68,
    chronic_condition: "COPD",
    gap_type: "Influenza & Pneumococcal Care",
    description: "Winter flu immunization outstanding for high-risk geriatric pulmonary respiratory pathway.",
    risk_level: "High",
    status: "intervention_sent",
    recommended_cpt: "90658 (Influenza Immunisation, R 380)",
    cohort_size: 2_450,
    subsidized_cost_zar: 931_000,
    intervention_notes: "Proactive benefit authorization dispatched via mobile app notifications on June 11."
  },
  {
    id: "GAP-104",
    member_id: "DI-9044-04",
    member_name: "Amina Patel",
    member_age: 31,
    chronic_condition: "Severe Asthma",
    gap_type: "Spirometry Re-assessment",
    description: "Pulmonary control spirometry outstanding to re-audit steroid controller dosages.",
    risk_level: "Medium",
    status: "open",
    recommended_cpt: "94010 (Spirometry measurement, R 950)",
    cohort_size: 1_870,
    subsidized_cost_zar: 1_215_500,
  },
  {
    id: "GAP-105",
    member_id: "DI-9055-05",
    member_name: "Zola Ndlovu",
    member_age: 45,
    chronic_condition: "Hypertension & Type 2 Diabetes",
    gap_type: "Diabetic retinopathy screening programme",
    description: "Retinal screening outstanding across the full dual-diagnosis cohort. Costed for a national rollout, so it is deliberately larger than the pool currently holds.",
    risk_level: "High",
    status: "open",
    recommended_cpt: "92250 (Fundus photography, R 550)",
    cohort_size: 28_400,
    subsidized_cost_zar: 18_460_000,
  }
];

/* -------------------------------------------------------------------------- */
/* Batch generation                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The four claims above are hand-written so the console has narrative cases to
 * walk through. On their own they total under R10,000, which makes every
 * headline figure read like a toy. A real adjudication queue carries a day's
 * batch behind those exemplars, so the rest is generated.
 *
 * Generated deterministically: the same batch every load, so a demo is
 * repeatable and the derived totals are stable.
 */

/** mulberry32 — small deterministic PRNG, so the batch never shifts. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Claim archetypes with their share of volume and value range. Weighted so the
 * mix looks like a scheme's book: mostly scripts and primary care by count,
 * with the value concentrated in the smaller number of in-hospital events.
 */
const ARCHETYPES: Array<{
  share: number; min: number; max: number;
  cpt: string; icd: string; label: string; icdLabel: string;
}> = [
  { share: 0.30, min: 180,   max: 1_400,   cpt: '0001', icd: 'Z76.0', label: 'Chronic medicine script',          icdLabel: 'Repeat prescription' },
  { share: 0.22, min: 420,   max: 1_150,   cpt: '99213', icd: 'Z00.0', label: 'GP consultation',                 icdLabel: 'General examination' },
  { share: 0.18, min: 260,   max: 2_200,   cpt: '83036', icd: 'E11.9', label: 'Pathology panel',                 icdLabel: 'Type 2 diabetes mellitus' },
  { share: 0.14, min: 1_600, max: 4_800,   cpt: '99243', icd: 'I10',   label: 'Specialist consultation',         icdLabel: 'Essential hypertension' },
  { share: 0.09, min: 1_900, max: 9_500,   cpt: '74160', icd: 'R10.9', label: 'Radiology — CT with contrast',    icdLabel: 'Abdominal pain, unspecified' },
  { share: 0.05, min: 14_000, max: 68_000, cpt: '47562', icd: 'K80.2', label: 'Day-case surgical procedure',     icdLabel: 'Calculus of gallbladder' },
  { share: 0.02, min: 48_000, max: 240_000, cpt: '99233', icd: 'J44.9', label: 'In-hospital admission',          icdLabel: 'Chronic obstructive pulmonary disease' },
];

/**
 * Savings booked by a rule that passes, as a share of the claim's value.
 * Flat amounts worked for four hand-written claims but become absurd across a
 * batch — R150 off a R68,000 procedure is not a tariff saving.
 */
const CLINICAL_PATHWAY_SHARE = 0.04; // generic substitution, protocol alignment
const IN_NETWORK_TARIFF_SHARE = 0.06; // negotiated rate vs billed

/** Outcome mix for a mature adjudication engine. */
const APPROVED_SHARE = 0.86;
const REJECTED_SHARE = 0.02; // remainder is flagged for a human

const BATCH_SIZE = 18_000;

function pickArchetype(r: number) {
  let acc = 0;
  for (const a of ARCHETYPES) {
    acc += a.share;
    if (r <= acc) return a;
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}

function generateBatch(count: number): Claim[] {
  const random = rng(20260616);
  const out: Claim[] = [];

  for (let i = 0; i < count; i += 1) {
    const archetype = pickArchetype(random());
    const amount = Math.round(archetype.min + random() * (archetype.max - archetype.min));

    const member = seedMembers[Math.floor(random() * seedMembers.length)];
    const provider = seedProviders[Math.floor(random() * seedProviders.length)];

    const roll = random();
    const status: Claim['status'] =
      roll < APPROVED_SHARE ? 'approved'
      : roll < APPROVED_SHARE + REJECTED_SHARE ? 'rejected'
      : 'flagged';

    // Which rule fails decides why a claim left the happy path.
    const failing = status === 'approved' ? null : random() < 0.45 ? 'V004' : random() < 0.6 ? 'V002' : 'V005';

    const pathwaySaving = Math.round(amount * CLINICAL_PATHWAY_SHARE);
    const tariffSaving = Math.round(amount * IN_NETWORK_TARIFF_SHARE);

    const day = 10 + Math.floor(random() * 3);
    const serviceDate = `2026-06-${String(day).padStart(2, '0')}`;

    out.push({
      document_id: `CLM-2026-B${String(i + 1).padStart(5, '0')}`,
      confidence: status === 'approved' ? 0.92 + random() * 0.07 : 0.4 + random() * 0.4,
      status,
      created_at: `${serviceDate}T${String(6 + Math.floor(random() * 14)).padStart(2, '0')}:00:00Z`,
      fields: {
        member,
        provider,
        dates: { service_date: serviceDate },
        amounts: { total_claimed: amount, eligible_tariff: 0, savings_calculated: 0 },
        icd_10_codes: [{ code: archetype.icd, description: archetype.icdLabel }],
        cpt_codes: [{ code: archetype.cpt, price: amount, description: archetype.label }],
      },
      validation_results: {
        passed: ['V001', 'V002', 'V003', 'V004', 'V005', 'V006'].filter((id) => id !== failing),
        failed: failing ? [failing] : [],
        details: {
          V001: { passed: true, message: `Member ${member.discovery_member_id} active in the member registry.`, savings: 0 },
          V002: failing === 'V002'
            ? { passed: false, message: `Provider practice ${provider.practice_number} suspended pending review.`, savings: 0 }
            : { passed: true, message: `Provider practice ${provider.practice_number} registered.`, savings: 0 },
          V003: { passed: true, message: `${archetype.label} consistent with the ${archetype.icdLabel} pathway.`, savings: pathwaySaving },
          V004: failing === 'V004'
            ? { passed: false, message: 'Duplicate: same member, provider and service date already submitted.', savings: 0 }
            : { passed: true, message: 'No duplicate claim found for this member, provider and date.', savings: 0 },
          V005: failing === 'V005'
            ? { passed: false, message: 'Out-of-network rate exceeds the contracted tariff.', savings: 0 }
            : { passed: true, message: 'In-network contract tariff applied.', savings: tariffSaving },
          V006: { passed: true, message: `Service date ${serviceDate} within the open claim window.`, savings: 0 },
        },
      },
      ...(failing ? { rejection_reason: `${failing} failed on automated adjudication.` } : {}),
      fhir_claim: {
        resourceType: 'Claim',
        id: `CLM-2026-B${String(i + 1).padStart(5, '0')}`,
        status: status === 'approved' ? 'active' : 'draft',
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] },
        patient: { reference: `Patient/${member.discovery_member_id}`, display: member.name },
        provider: { reference: `Organization/${provider.practice_number}`, display: provider.name },
        total: { value: amount, currency: 'ZAR' },
      },
    });
  }

  return out;
}

/** The narrative exemplars, followed by the day's batch behind them. */
export const seedBatch: Claim[] = generateBatch(BATCH_SIZE);

/**
 * The ledger as the console sees it: the narrative exemplars first, then the
 * day's batch. Every headline figure is still derived from these rows by
 * `computeFinancialSummary` - there is no stored total anywhere.
 */
export const seedClaims: Claim[] = [...narrativeClaims, ...seedBatch];
