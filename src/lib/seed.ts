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

export const seedClaims: Claim[] = [
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
    subsidized_cost_zar: 850,
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
    subsidized_cost_zar: 450,
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
    subsidized_cost_zar: 380,
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
    subsidized_cost_zar: 650,
  }
];
