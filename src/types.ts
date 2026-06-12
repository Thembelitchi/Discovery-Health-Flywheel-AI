/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  discovery_member_id: string;
  name: string;
  age: number;
  plan_type: string;
  chronic_conditions: string[];
}

export interface Provider {
  practice_number: string;
  name: string;
  type: string;
}

export interface ClaimField {
  member: Member;
  provider: Provider;
  dates: {
    service_date: string;
  };
  amounts: {
    total_claimed: number;
    eligible_tariff: number;
    savings_calculated: number;
  };
  icd_10_codes: Array<{
    code: string;
    description: string;
  }>;
  cpt_codes: Array<{
    code: string;
    price: number;
    description: string;
  }>;
}

export interface RuleDetail {
  passed: boolean;
  message: string;
  savings: number;
}

export interface Claim {
  document_id: string;
  fields: ClaimField;
  confidence: number;
  status: 'approved' | 'flagged' | 'rejected';
  rejection_reason?: string;
  validation_results: {
    passed: string[];
    failed: string[];
    details: Record<string, RuleDetail>;
  };
  fhir_claim?: any;
  created_at: string;
}

export interface CareGap {
  id: string;
  member_id: string;
  member_name: string;
  member_age: number;
  chronic_condition: string;
  gap_type: string;
  description: string;
  risk_level: 'High' | 'Medium' | 'Low';
  status: 'open' | 'intervention_sent' | 'resolved';
  recommended_cpt: string;
  subsidized_cost_zar: number;
  intervention_notes?: string;
  resolved_date?: string;
}

export interface FinancialSummary {
  total_claims_count: number;
  auto_approved_count: number;
  flagged_review_count: number;
  savings_reinvestment_pool_zar: number;
  preventative_outlay_zar: number;
  total_claims_value_zar: number;
}
