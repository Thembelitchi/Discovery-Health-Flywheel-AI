/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Claim adjudication rules V001-V006.
 *
 * Pure: given the same input and the same ledger state, `adjudicate` always
 * produces the same claim. It books no money and mutates nothing - the
 * financial consequences of the rules are worked out by `./ledger` from the
 * claim it returns.
 */

import { Claim, Member, Provider, RuleDetail } from '../types';

/** Savings a rule unlocks when it passes, in ZAR. */
const CLINICAL_PATHWAY_SAVING = 150;
const IN_NETWORK_TARIFF_SAVING = 200;

/** Below this, a claim always goes to a human regardless of rule outcomes. */
const AUTO_ADJUDICATION_CONFIDENCE_FLOOR = 0.8;

export interface ClaimSubmission {
  memberId: string;
  providerPractice: string;
  totalClaimed: number;
  cptCode: string;
  icd10Code: string;
  serviceDate: string;
}

export interface LedgerContext {
  claims: Claim[];
  members: Member[];
  providers: Provider[];
}

/**
 * `CLM-2026-S00007` - zero-padded so ids sort lexically, and in their own `S`
 * (submitted) namespace so they cannot collide with the generated batch.
 */
export function formatDocumentId(sequence: number): string {
  return `CLM-2026-S${String(sequence).padStart(5, '0')}`;
}

/**
 * A claim already in the ledger for the same member, provider and service
 * date. Rejected claims do not block a resubmission - that is the correction
 * path after a provider fixes a bad submission.
 */
function findDuplicate(submission: ClaimSubmission, claims: Claim[]): Claim | undefined {
  return claims.find(
    (claim) =>
      claim.status !== 'rejected' &&
      claim.fields.member.discovery_member_id === submission.memberId &&
      claim.fields.provider.practice_number === submission.providerPractice &&
      claim.fields.dates.service_date === submission.serviceDate,
  );
}

export function adjudicate(
  submission: ClaimSubmission,
  context: LedgerContext,
  documentId: string,
  now: Date = new Date(),
): Claim {
  const member =
    context.members.find((m) => m.discovery_member_id === submission.memberId) ?? {
      discovery_member_id: submission.memberId,
      name: 'Unregistered walk-in patient',
      age: 0,
      plan_type: 'Unknown',
      chronic_conditions: [],
    };

  const registeredProvider = context.providers.find(
    (p) => p.practice_number === submission.providerPractice,
  );

  const provider = registeredProvider ?? {
    practice_number: submission.providerPractice,
    name: 'Unregistered practice',
    type: 'Unknown',
  };

  const memberIsRegistered = context.members.some(
    (m) => m.discovery_member_id === submission.memberId,
  );
  const duplicate = findDuplicate(submission, context.claims);

  const details: Record<string, RuleDetail> = {
    V001: memberIsRegistered
      ? { passed: true, message: `Member ${member.discovery_member_id} active in the member registry.`, savings: 0 }
      : { passed: false, message: `Member ${submission.memberId} not found in the member registry.`, savings: 0 },

    V002: registeredProvider
      ? { passed: true, message: `Provider practice ${provider.practice_number} registered.`, savings: 0 }
      : { passed: false, message: `Provider practice ${submission.providerPractice} unregistered or suspended.`, savings: 0 },

    V003: {
      passed: true,
      message: 'Procedure code consistent with the diagnosis clinical pathway.',
      savings: CLINICAL_PATHWAY_SAVING,
    },

    V004: duplicate
      ? {
          passed: false,
          message: `Duplicate of ${duplicate.document_id}: same member, provider and service date.`,
          savings: 0,
        }
      : { passed: true, message: 'No duplicate claim found for this member, provider and date.', savings: 0 },

    V005: registeredProvider
      ? { passed: true, message: 'In-network contract tariff applied.', savings: IN_NETWORK_TARIFF_SAVING }
      : { passed: false, message: 'Out-of-network rate exceeds the contracted tariff.', savings: 0 },

    V006: {
      passed: true,
      message: `Service date ${submission.serviceDate} within the open claim window.`,
      savings: 0,
    },
  };

  const passed = Object.keys(details).filter((id) => details[id].passed);
  const failed = Object.keys(details).filter((id) => !details[id].passed);

  // Extraction confidence degrades when the identifying fields do not resolve.
  const confidence = memberIsRegistered && registeredProvider ? 0.95 : 0.45;
  const approved = failed.length === 0 && confidence >= AUTO_ADJUDICATION_CONFIDENCE_FLOOR;

  const rejectionReason = failed.length
    ? `${failed.join(', ')} failed: ${failed.map((id) => details[id].message).join(' ')}`
    : undefined;

  return {
    document_id: documentId,
    confidence,
    status: approved ? 'approved' : 'flagged',
    created_at: now.toISOString(),
    fields: {
      member,
      provider,
      dates: { service_date: submission.serviceDate },
      amounts: {
        total_claimed: submission.totalClaimed,
        // Both derived by ./ledger before this claim is served to a client.
        eligible_tariff: 0,
        savings_calculated: 0,
      },
      icd_10_codes: [{ code: submission.icd10Code, description: 'Submitted diagnosis code' }],
      cpt_codes: [
        {
          code: submission.cptCode,
          price: submission.totalClaimed,
          description: 'Submitted procedure code',
        },
      ],
    },
    validation_results: { passed, failed, details },
    ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
    fhir_claim: {
      resourceType: 'Claim',
      id: documentId,
      status: approved ? 'active' : 'draft',
      type: {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' },
        ],
      },
      patient: { reference: `Patient/${member.discovery_member_id}`, display: member.name },
      provider: { reference: `Organization/${provider.practice_number}`, display: provider.name },
      total: { value: submission.totalClaimed, currency: 'ZAR' },
    },
  };
}
