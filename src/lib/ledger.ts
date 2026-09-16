/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Flywheel ledger engine.
 *
 * Every figure the dashboard shows is DERIVED from the claim and care-gap
 * rows by the pure functions below. Nothing in this module mutates a running
 * total, which is what makes the ledger idempotent: replaying the same
 * request, or recomputing after a restart, always yields the same answer.
 *
 * Two kinds of money are tracked separately, because they are different lines
 * in a financial statement and conflating them overstates the benefit case:
 *
 *   realised admin savings - cash not spent on a claim we DID pay, because a
 *                            rule (generic substitution, in-network tariff)
 *                            reduced what was payable.
 *   avoided leakage        - gross amount of a claim we declined to pay at
 *                            all, because adjudication rejected it.
 *
 * Both fund the reinvestment pool, but only once, and only after a human or
 * the rules engine has actually adjudicated the claim.
 */

import { CareGap, Claim, FinancialSummary } from '../types';

/**
 * Savings attributable to rules the claim actually PASSED.
 *
 * A failed rule never books a saving: the rule fired to block something, and
 * whether that block is worth money depends on the adjudication outcome,
 * which `avoidedLeakage` accounts for.
 */
export function ruleSavings(claim: Claim): number {
  const { details, passed } = claim.validation_results;
  return passed.reduce((total, ruleId) => total + (details[ruleId]?.savings ?? 0), 0);
}

/** Cash saved on a claim that was paid. Zero until the claim is approved. */
export function realisedAdminSavings(claim: Claim): number {
  return claim.status === 'approved' ? ruleSavings(claim) : 0;
}

/**
 * Gross amount not paid out because the claim was rejected.
 *
 * Deliberately zero for `flagged`: a claim sitting in the review queue has
 * saved nothing yet. This is what stops a caller from minting money by
 * submitting the same duplicate repeatedly - each submission creates another
 * flagged row worth exactly R0 until someone adjudicates it.
 */
export function avoidedLeakage(claim: Claim): number {
  return claim.status === 'rejected' ? claim.fields.amounts.total_claimed : 0;
}

/** Total contribution of a single claim to the reinvestment pool. */
export function claimContribution(claim: Claim): number {
  return realisedAdminSavings(claim) + avoidedLeakage(claim);
}

/** What a claim is payable at, given its adjudication status. */
export function eligibleTariff(claim: Claim): number {
  return claim.status === 'approved' ? claim.fields.amounts.total_claimed : 0;
}

/** Money already committed to funding preventative care. */
export function preventativeOutlay(careGaps: CareGap[]): number {
  return careGaps
    .filter((gap) => gap.status === 'resolved')
    .reduce((total, gap) => total + gap.subsidized_cost_zar, 0);
}

/**
 * Rewrites a claim's derived amounts so the stored row can never drift from
 * what the engine says. Call this before returning a claim to a client.
 */
export function withDerivedAmounts(claim: Claim): Claim {
  return {
    ...claim,
    fields: {
      ...claim.fields,
      amounts: {
        ...claim.fields.amounts,
        eligible_tariff: eligibleTariff(claim),
        savings_calculated: claimContribution(claim),
      },
    },
  };
}

/**
 * The single source of truth for every headline number on the dashboard.
 *
 * Computed from the rows on every read rather than incremented on write, so
 * a replayed POST, a double-click, or a restart cannot change the answer.
 */
export function computeFinancialSummary(claims: Claim[], careGaps: CareGap[]): FinancialSummary {
  const realised = claims.reduce((total, claim) => total + realisedAdminSavings(claim), 0);
  const avoided = claims.reduce((total, claim) => total + avoidedLeakage(claim), 0);
  const outlay = preventativeOutlay(careGaps);

  return {
    total_claims_count: claims.length,
    auto_approved_count: claims.filter((claim) => claim.status === 'approved').length,
    flagged_review_count: claims.filter((claim) => claim.status === 'flagged').length,
    rejected_count: claims.filter((claim) => claim.status === 'rejected').length,
    total_claims_value_zar: claims.reduce((total, claim) => total + claim.fields.amounts.total_claimed, 0),
    realised_admin_savings_zar: realised,
    avoided_leakage_zar: avoided,
    gross_savings_zar: realised + avoided,
    preventative_outlay_zar: outlay,
    savings_reinvestment_pool_zar: realised + avoided - outlay,
  };
}

/**
 * Invariants that must hold for the ledger to be reportable.
 *
 * Exported so both the test suite and `/api/data` can assert them - a demo
 * that silently reports impossible numbers is worse than one that refuses to.
 */
export function ledgerViolations(claims: Claim[], careGaps: CareGap[]): string[] {
  const summary = computeFinancialSummary(claims, careGaps);
  const violations: string[] = [];

  if (summary.gross_savings_zar !== summary.realised_admin_savings_zar + summary.avoided_leakage_zar) {
    violations.push('gross_savings_zar must equal realised_admin_savings_zar + avoided_leakage_zar');
  }

  if (summary.savings_reinvestment_pool_zar !== summary.gross_savings_zar - summary.preventative_outlay_zar) {
    violations.push('pool must equal gross savings less preventative outlay');
  }

  if (summary.savings_reinvestment_pool_zar < 0) {
    violations.push('pool is negative: more was disbursed to care gaps than was ever saved');
  }

  const statusTotal =
    summary.auto_approved_count + summary.flagged_review_count + summary.rejected_count;
  if (statusTotal !== summary.total_claims_count) {
    violations.push('claim status counts do not add up to the total claim count');
  }

  const ids = claims.map((claim) => claim.document_id);
  if (new Set(ids).size !== ids.length) {
    violations.push('duplicate document_id in the claims ledger');
  }

  for (const value of Object.values(summary)) {
    if (!Number.isFinite(value)) {
      violations.push('summary contains a non-finite value');
      break;
    }
  }

  return violations;
}
