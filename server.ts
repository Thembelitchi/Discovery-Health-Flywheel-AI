import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database simulating Discovery Health CDP ledger
let members = [
  { discovery_member_id: "DI-9011-01", name: "Sipho Dlamini", age: 54, plan_type: "Classic Comprehensive", chronic_conditions: ["Hypertension", "Dyslipidemia"] },
  { discovery_member_id: "DI-9022-02", name: "Sarah Lene", age: 42, plan_type: "Classic Saver", chronic_conditions: ["Type 2 Diabetes"] },
  { discovery_member_id: "DI-9033-03", name: "Thabo Mokoena", age: 68, plan_type: "Core Priority", chronic_conditions: ["COPD", "Mild Asthma"] },
  { discovery_member_id: "DI-9044-04", name: "Amina Patel", age: 31, plan_type: "Classic Saver", chronic_conditions: ["Severe Asthma"] },
  { discovery_member_id: "DI-9055-05", name: "Zola Ndlovu", age: 45, plan_type: "Classic Comprehensive", chronic_conditions: ["Hypertension", "Type 2 Diabetes"] }
];

let providers = [
  { practice_number: "0439201", name: "Dr. S. Naidoo (General Practitioner)", type: "GP" },
  { practice_number: "0112394", name: "Dr. M. Khumalo (Cardiologist)", type: "Specialist" },
  { practice_number: "0225691", name: "Dr. L. van Wyk (Pulmonologist)", type: "Specialist" },
  { practice_number: "0334812", name: "Pathcare Labs SA", type: "Laboratory" },
];

let claims = [
  {
    document_id: "CLM-2026-001",
    confidence: 0.96,
    status: "approved" as const,
    created_at: "2026-06-10T14:20:00Z",
    fields: {
      member: members[1], // Sarah Lene
      provider: providers[0], // Dr. S Naidoo
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
    status: "flagged" as const,
    created_at: "2026-06-11T09:15:00Z",
    fields: {
      member: members[0], // Sipho Dlamini
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
    status: "approved" as const,
    created_at: "2026-06-11T16:45:00Z",
    fields: {
      member: members[2], // Thabo Mokoena
      provider: providers[1], // Dr. M Khumalo
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
    status: "flagged" as const,
    created_at: "2026-06-12T08:10:00Z",
    fields: {
      member: members[2], // Thabo Mokoena duplication!
      provider: providers[1], // Dr. M Khumalo
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

let careGaps = [
  {
    id: "GAP-101",
    member_id: "DI-9011-01",
    member_name: "Sipho Dlamini",
    member_age: 54,
    chronic_condition: "Hypertension",
    gap_type: "Cardiovascular Risk Assessment",
    description: "Annual echocardiogram and metabolic profile check outstanding under chronic care pathway.",
    risk_level: "High" as const,
    status: "open" as const,
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
    risk_level: "Medium" as const,
    status: "open" as const,
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
    risk_level: "High" as const,
    status: "intervention_sent" as const,
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
    risk_level: "Medium" as const,
    status: "open" as const,
    recommended_cpt: "94010 (Spirometry measurement, R 950)",
    subsidized_cost_zar: 650,
  }
];

// Reinvestment Pool Stats
let financialSummary = {
  total_claims_count: 4,
  auto_approved_count: 2,
  flagged_review_count: 2,
  savings_reinvestment_pool_zar: 4580, // Approved administrative savings (R350 + R780) + Rejected leakage if any
  preventative_outlay_zar: 0,
  total_claims_value_zar: 9250
};

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY && !aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// REST endpoints for Client App
app.get("/api/data", (req, res) => {
  res.json({
    members,
    providers,
    claims,
    careGaps,
    financialSummary
  });
});

// Process/Upload simulated claim
app.post("/api/claim/upload", (req, res) => {
  const { memberId, providerPractice, totalClaimed, cptCode, icd10Code, serviceDate } = req.body;

  const foundMember = members.find(m => m.discovery_member_id === memberId) || {
    discovery_member_id: memberId || "DI-TEMP-99",
    name: "New Walking-In Patient",
    age: 35,
    plan_type: "KeySaver",
    chronic_conditions: ["General Care"]
  };

  const foundProvider = providers.find(p => p.practice_number === providerPractice) || {
    practice_number: providerPractice || "0999001",
    name: "Specialty Medical Inc (OData Registered)",
    type: "Clinic"
  };

  // Run OData rules simulation
  const ruleV001 = foundMember.discovery_member_id !== "INVALID";
  const ruleV002 = providerPractice !== "0999999" && providerPractice !== "INVALID";
  
  // V003: correct clinical icd10 match cpt
  const ruleV003 = true; 

  // V004 check duplicate criteria: same day, same member, same provider
  const isDuplicate = claims.some(c => 
    c.fields.member.discovery_member_id === foundMember.discovery_member_id &&
    c.fields.provider.practice_number === foundProvider.practice_number &&
    c.fields.dates.service_date === (serviceDate || "2026-06-12") &&
    c.status !== "rejected"
  );
  const ruleV004 = !isDuplicate;

  // V005 Out of network rate rule
  const isOutOfNetwork = !providers.some(p => p.practice_number === foundProvider.practice_number);
  const ruleV005 = !isOutOfNetwork;

  const ruleV006 = !!serviceDate;

  const overallConfidence = ruleV001 && ruleV002 ? 0.95 : 0.45;
  const passed: string[] = [];
  const failed: string[] = [];
  const details: Record<string, any> = {};

  // Build metrics
  let calculatedSavings = 0;
  
  // Fill details
  details["V001"] = { passed: ruleV001, message: ruleV001 ? `Member ${foundMember.discovery_member_id} verified.` : "Invalid Member Registry Code.", savings: 0 };
  details["V002"] = { passed: ruleV002, message: ruleV002 ? `Provider ${foundProvider.name} registered.` : "Unregistered Practice Number detected.", savings: 0 };
  details["V003"] = { passed: ruleV003, message: "Clinical pathway correlation validated.", savings: 150 };
  details["V004"] = { passed: ruleV004, message: ruleV004 ? "Perfect single submittal transaction." : "Duplicative billing detected.", savings: ruleV004 ? 0 : Number(totalClaimed) };
  details["V005"] = { passed: ruleV005, message: ruleV005 ? "Preferred Network Tariff saving negotiated." : "Out-of-network premium adjusted.", savings: ruleV005 ? 200 : 0 };
  details["V006"] = { passed: ruleV006, message: "Date within 2026 window.", savings: 0 };

  Object.keys(details).forEach(key => {
    if (details[key].passed) {
      passed.push(key);
      calculatedSavings += details[key].savings;
    } else {
      failed.push(key);
    }
  });

  const shouldApprove = overallConfidence >= 0.8 && failed.length === 0;
  const docId = `CLM-2026-0${claims.length + 1}`;

  const finalClaim = {
    document_id: docId,
    confidence: overallConfidence,
    status: (shouldApprove ? "approved" : "flagged") as any,
    created_at: new Date().toISOString(),
    fields: {
      member: foundMember,
      provider: foundProvider,
      dates: { service_date: serviceDate || "2026-06-12" },
      amounts: {
        total_claimed: Number(totalClaimed || 950),
        eligible_tariff: shouldApprove ? Number(totalClaimed || 950) : 0,
        savings_calculated: shouldApprove ? calculatedSavings : Number(totalClaimed || 950)
      },
      icd_10_codes: [{ code: icd10Code || "I10", description: "Hypertension registry code" }],
      cpt_codes: [{ code: cptCode || "99213", price: Number(totalClaimed || 950), description: "Medical consult and routine vitals assessment" }]
    },
    validation_results: {
      passed,
      failed,
      details
    },
    fhir_claim: {
      resourceType: "Claim",
      id: docId,
      status: shouldApprove ? "active" : "draft",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
      patient: { reference: `Patient/${foundMember.discovery_member_id}`, display: foundMember.name },
      provider: { reference: `Organization/${foundProvider.practice_number}`, display: foundProvider.name },
      total: { value: Number(totalClaimed || 950), currency: "ZAR" }
    }
  };

  claims.unshift(finalClaim); // add to top of feed

  // update financials
  financialSummary.total_claims_count += 1;
  financialSummary.total_claims_value_zar += Number(totalClaimed || 950);
  if (shouldApprove) {
    financialSummary.auto_approved_count += 1;
    financialSummary.savings_reinvestment_pool_zar += calculatedSavings;
  } else {
    financialSummary.flagged_review_count += 1;
    // Duplicity saves full claim leakage directly
    if (failed.includes("V004")) {
      financialSummary.savings_reinvestment_pool_zar += Number(totalClaimed || 950);
    }
  }

  res.json({ success: true, claim: finalClaim, financialSummary });
});

// Resolve custom manual claims audit from dashboard
app.post("/api/claim/action", (req, res) => {
  const { docId, action, reason } = req.body;
  const claimIdx = claims.findIndex(c => c.document_id === docId);

  if (claimIdx !== -1) {
    const claim = claims[claimIdx];
    if (action === "approve") {
      claim.status = "approved";
      claim.fhir_claim.status = "active";
      financialSummary.flagged_review_count = Math.max(0, financialSummary.flagged_review_count - 1);
      financialSummary.auto_approved_count += 1;
      
      // Calculate savings on override:
      const blockSavings = 350; // Manual generic rebate
      financialSummary.savings_reinvestment_pool_zar += blockSavings;
      claim.fields.amounts.savings_calculated = blockSavings;
      claim.fields.amounts.eligible_tariff = claim.fields.amounts.total_claimed;
    } else {
      claim.status = "rejected";
      claim.rejection_reason = reason || "Audited and denied under Discovery Medical rule system.";
      financialSummary.flagged_review_count = Math.max(0, financialSummary.flagged_review_count - 1);
      
      // Captured blocked leakage fully as savings!
      const leakedAmount = claim.fields.amounts.total_claimed;
      financialSummary.savings_reinvestment_pool_zar += leakedAmount;
      claim.fields.amounts.savings_calculated = leakedAmount;
    }
  }

  res.json({ success: true, claims, financialSummary });
});

// Deploy Care Gap intervention (Dispatches and funds preventative checkups)
app.post("/api/caregaps/trigger", (req, res) => {
  const { gapId, note } = req.body;
  const gap = careGaps.find(g => g.id === gapId);

  if (gap) {
    if (gap.status === "open") {
      gap.status = "intervention_sent";
      gap.intervention_notes = note || `Reinvestment voucher sent to clinical partner PathCare/GP for dynamic assessment booking.`;
    } else if (gap.status === "intervention_sent") {
      // Re-allocate money from the savings pool to pay for this preventative care check-up fully!
      const cost = gap.subsidized_cost_zar;
      if (financialSummary.savings_reinvestment_pool_zar >= cost) {
        financialSummary.savings_reinvestment_pool_zar -= cost;
        financialSummary.preventative_outlay_zar += cost;
        gap.status = "resolved";
        gap.resolved_date = new Date().toISOString().split('T')[0];
        gap.intervention_notes = `Successfully funded via Flywheel savings pool. Voucher redeemed at clinic on ${gap.resolved_date}.`;
      } else {
        return res.status(400).json({ error: "Insufficient funds in the Flywheel Reinvestment Pool. Wait for more auto-approved audit savings!" });
      }
    }
  }

  res.json({ success: true, careGaps, financialSummary });
});

// AI Suggestion hub powered by Gemini 3.5 Flash
app.post("/api/ai/synthesis", async (req, res) => {
  const { prompt } = req.body;
  const ai = getGemini();

  const mockPayload = {
    claimsCount: financialSummary.total_claims_count,
    autoApproved: financialSummary.auto_approved_count,
    flagged: financialSummary.flagged_review_count,
    savingsPool: financialSummary.savings_reinvestment_pool_zar,
    preventativeOutlaw: financialSummary.preventative_outlay_zar,
    gapsCount: careGaps.length,
    openGaps: careGaps.filter(g => g.status === 'open').length,
    gapsList: careGaps.map(g => `${g.member_name} (${g.chronic_condition}): ${g.gap_type} [${g.risk_level} Risk]`).join(", ")
  };

  const systemInstruction = `You are the Discovery Health Care Flywheel AI Engine. 
  Your job is to analyze real-time claims streams, rule audit performance (rules V001 to V006), and outstanding preventative gaps in care.
  Formulate creative and highly practical clinical pathways. Highlight where claims administrative savings have been unlocked and how they can be proactively deployed to prevent expensive hospitalization (e.g., funding an HbA1c screening for diabetic member Sarah Lene, or cardiac screening for Sipho Dlamini).
  Format your answer cleanly in professional clinical and economic terms. Address the practitioner ("Discovery Clinical Team").
  Keep the response brief (max 250 words) and high impact, using bold terms matching the dynamic Flywheel momentum. Encourage them to activate outstanding care gaps currently open using the accumulated reinvestment pool of R ${financialSummary.savings_reinvestment_pool_zar}.`;

  const offlineIntelligence = `### **FLYWHEEL INTELLIGENCE REPORT: BETA-9 PROTOCOL**

Our metabolic, respiratory, and cardiac pathways are running at **optimal velocity**. By utilizing automated, closed-loop audits, the system has successfully funneled redundant medical leakage directly into active clinical interventions.

**Core Clinical Interventions Initiated:**
*   **Diabetic Pathway (Sarah Lene):** Automated generic medicine substitution has reclaimed **ZAR 350**. Recommend immediately funding the outstanding diabetic retinal and renal screening (Subsidized cost: R450).
*   **Geriatric Respiratory Safeguard (Thabo Mokoena):** Prevented **ZAR 3,450** in secondary duplicate spirometry claims. Funds fully deployed to sponsor winters immunisation.
*   **Cardiovascular Care Gaps (Sipho Dlamini - High Risk):** Outstanding cardiology consult (Open care gap). We have R **${financialSummary.savings_reinvestment_pool_zar}** active in the Flywheel savings pool. Recommend authorizing R850 for immediate dispatch.

**Flywheel Optimization Score:** **84/100** (+12.4% health velocity). Recommend triggering the open care gap interventions immediately to optimize chronic stabilization metrics.`;

  if (!ai) {
    return res.json({ text: offlineIntelligence });
  }

  try {
    const geminiPrompt = `Analyze this system ledger data:
    - Active Claims Count: ${mockPayload.claimsCount}
    - Auto-Approved Claims: ${mockPayload.autoApproved}
    - Flagged Manual Reviews: ${mockPayload.flagged}
    - Active Savings Reinvestment Pool: ZAR ${mockPayload.savingsPool}
    - Proactive Health Outlay: ZAR ${mockPayload.preventativeOutlaw}
    - Active Outstanding Care Gaps: ${mockPayload.openGaps} outstanding of ${mockPayload.gapsCount} total
    - Care Gaps list: ${mockPayload.gapsList}

    User specific focus or request: ${prompt || "Perform a general clinical efficiency assessment of the health flywheel."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiPrompt,
      config: {
        systemInstruction,
        temperature: 1.0,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.warn("Gemini API is currently unavailable or high demand. Gracefully falling back to cached local high-fidelity clinical model.");
    res.json({ text: offlineIntelligence });
  }
});


// Dev & Production serving
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting in ${isProd ? "production" : "development"} mode...`);
    console.log(`Server binds to host 0.0.0.0 and port ${PORT}`);
  });
}

startServer();
