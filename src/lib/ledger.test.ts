/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression tests for the ledger.
 *
 * Every case in the "exploits" block reproduces a defect that was reachable
 * over unauthenticated HTTP before this suite existed. They are written
 * against the real Express app rather than the pure functions, because the
 * defects lived in the seam between the two.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app, resetLedger } from '../../server';
import { computeFinancialSummary, ledgerViolations } from './ledger';
import { seedCareGaps, seedClaims } from './seed';

const DUPLICATE_SUBMISSION = {
  memberId: 'DI-9033-03',
  providerPractice: '0112394',
  totalClaimed: 3450,
  serviceDate: '2026-06-11',
};

const CLEAN_SUBMISSION = {
  memberId: 'DI-9055-05',
  providerPractice: '0439201',
  totalClaimed: 1200,
  serviceDate: '2026-07-01',
};

beforeEach(() => {
  resetLedger();
});

async function pool(): Promise<number> {
  const { body } = await request(app).get('/api/data').expect(200);
  return body.financialSummary.savings_reinvestment_pool_zar;
}

describe('seeded ledger', () => {
  it('derives totals from the rows rather than storing them', async () => {
    const { body } = await request(app).get('/api/data').expect(200);
    const summary = body.financialSummary;

    // The old hardcoded seed claimed R9,250 against rows summing to R9,850.
    const rowTotal = seedClaims.reduce((t, c) => t + c.fields.amounts.total_claimed, 0);
    expect(summary.total_claims_value_zar).toBe(rowTotal);

    // Realised savings are the passed-rule savings on approved claims only,
    // and avoided leakage the gross value of rejected ones. Both derived from
    // the rows rather than asserted as magic numbers.
    const expectedRealised = seedClaims
      .filter((c) => c.status === 'approved')
      .reduce((t, c) => t + c.validation_results.passed.reduce(
        (sum, id) => sum + (c.validation_results.details[id]?.savings ?? 0), 0), 0);
    const expectedAvoided = seedClaims
      .filter((c) => c.status === 'rejected')
      .reduce((t, c) => t + c.fields.amounts.total_claimed, 0);

    expect(summary.realised_admin_savings_zar).toBe(expectedRealised);
    expect(summary.avoided_leakage_zar).toBe(expectedAvoided);
    // A flagged claim contributes nothing until it is adjudicated.
    expect(summary.gross_savings_zar).toBe(expectedRealised + expectedAvoided);
  });

  it('satisfies every ledger invariant', () => {
    expect(ledgerViolations(seedClaims, seedCareGaps)).toEqual([]);
  });

  it('keeps status counts summing to the claim count', async () => {
    const { body } = await request(app).get('/api/data').expect(200);
    const s = body.financialSummary;
    expect(s.auto_approved_count + s.flagged_review_count + s.rejected_count).toBe(
      s.total_claims_count,
    );
  });
});

describe('exploits that previously minted money', () => {
  it('does not credit savings for repeatedly submitting the same duplicate', async () => {
    const before = await pool();

    for (let i = 0; i < 5; i += 1) {
      const { body } = await request(app)
        .post('/api/claim/upload')
        .send(DUPLICATE_SUBMISSION)
        .expect(201);
      expect(body.claim.status).toBe('flagged');
      expect(body.claim.validation_results.failed).toContain('V004');
    }

    // Five detections of the same duplicate are not five savings events.
    expect(await pool()).toBe(before);
  });

  it('books avoided leakage exactly once however often a claim is rejected', async () => {
    const before = await pool();
    const target = seedClaims[1];

    for (let i = 0; i < 4; i += 1) {
      await request(app)
        .post('/api/claim/action')
        .send({ docId: target.document_id, action: 'reject', reason: 'audit' })
        .expect(200);
    }

    expect(await pool()).toBe(before + target.fields.amounts.total_claimed);
  });

  it('reports a replayed action as already applied', async () => {
    const docId = seedClaims[1].document_id;
    const first = await request(app).post('/api/claim/action').send({ docId, action: 'reject' });
    const second = await request(app).post('/api/claim/action').send({ docId, action: 'reject' });

    expect(first.body.alreadyApplied).toBe(false);
    expect(second.body.alreadyApplied).toBe(true);
  });

  it('reverses the pool when a rejection is overturned on appeal', async () => {
    const before = await pool();
    const docId = seedClaims[1].document_id;

    await request(app).post('/api/claim/action').send({ docId, action: 'reject' }).expect(200);
    expect(await pool()).toBeGreaterThan(before);

    await request(app).post('/api/claim/action').send({ docId, action: 'approve' }).expect(200);
    // Approving restores the claim's passed-rule savings only, never the gross.
    expect(await pool()).toBeLessThan(before + seedClaims[1].fields.amounts.total_claimed);
  });
});

describe('input validation', () => {
  it('rejects a non-numeric amount instead of writing NaN into the totals', async () => {
    const { body } = await request(app)
      .post('/api/claim/upload')
      .send({ ...CLEAN_SUBMISSION, totalClaimed: 'abc' })
      .expect(400);

    expect(body.issues.some((i: { field: string }) => i.field === 'totalClaimed')).toBe(true);

    const { body: data } = await request(app).get('/api/data').expect(200);
    expect(Number.isFinite(data.financialSummary.total_claims_value_zar)).toBe(true);
  });

  it('rejects a negative amount', async () => {
    await request(app)
      .post('/api/claim/upload')
      .send({ ...CLEAN_SUBMISSION, totalClaimed: -5_000_000 })
      .expect(400);
  });

  it('rejects an empty body rather than inventing a default claim', async () => {
    await request(app).post('/api/claim/upload').send({}).expect(400);
  });

  it('rejects a malformed service date', async () => {
    await request(app)
      .post('/api/claim/upload')
      .send({ ...CLEAN_SUBMISSION, serviceDate: '12 June' })
      .expect(400);
  });

  it('rejects an unknown adjudication action', async () => {
    await request(app)
      .post('/api/claim/action')
      .send({ docId: seedClaims[0].document_id, action: 'obliterate' })
      .expect(400);
  });
});

describe('unknown identifiers', () => {
  it('404s on an unknown claim instead of reporting success', async () => {
    await request(app)
      .post('/api/claim/action')
      .send({ docId: 'NOPE', action: 'approve' })
      .expect(404);
  });

  it('404s on an unknown care gap', async () => {
    await request(app).post('/api/caregaps/trigger').send({ gapId: 'NOPE' }).expect(404);
  });
});

describe('care gap funding', () => {
  it('moves open -> intervention_sent -> resolved and debits the pool once', async () => {
    const gapId = 'GAP-102'; // R450, affordable from the seeded R1,130 pool
    const cost = seedCareGaps.find((g) => g.id === gapId)!.subsidized_cost_zar;
    const before = await pool();

    await request(app).post('/api/caregaps/trigger').send({ gapId }).expect(200);
    expect(await pool()).toBe(before); // dispatch costs nothing

    await request(app).post('/api/caregaps/trigger').send({ gapId }).expect(200);
    expect(await pool()).toBe(before - cost);

    // Already resolved: no further debit.
    await request(app).post('/api/caregaps/trigger').send({ gapId }).expect(200);
    expect(await pool()).toBe(before - cost);
  });

  it('refuses to fund a gap the pool cannot cover', async () => {
    // GAP-105 is costed for a national rollout, deliberately above the pool.
    const gapId = 'GAP-105';
    const cost = seedCareGaps.find((g) => g.id === gapId)!.subsidized_cost_zar;
    expect(cost).toBeGreaterThan(await pool());

    await request(app).post('/api/caregaps/trigger').send({ gapId }).expect(200);
    const { body } = await request(app).post('/api/caregaps/trigger').send({ gapId }).expect(409);

    expect(body.error).toMatch(/Insufficient funds/);
    expect(body.required_zar).toBe(cost);
    expect(await pool()).toBeGreaterThanOrEqual(0);
  });

  it('never lets the pool go negative', async () => {
    for (const gap of seedCareGaps) {
      for (let i = 0; i < 3; i += 1) {
        await request(app).post('/api/caregaps/trigger').send({ gapId: gap.id });
      }
    }
    expect(await pool()).toBeGreaterThanOrEqual(0);
  });
});

describe('document ids', () => {
  it('zero-pads and never collides', async () => {
    const seen = new Set<string>();

    for (let i = 0; i < 12; i += 1) {
      const { body } = await request(app)
        .post('/api/claim/upload')
        .send({ ...CLEAN_SUBMISSION, serviceDate: `2026-07-${String(i + 1).padStart(2, '0')}` })
        .expect(201);
      expect(body.claim.document_id).toMatch(/^CLM-2026-S\d{5}$/);
      expect(seen.has(body.claim.document_id)).toBe(false);
      seen.add(body.claim.document_id);
    }
  });
});

describe('ai synthesis provenance', () => {
  it('labels the fallback as cached rather than passing it off as model output', async () => {
    const { body } = await request(app).post('/api/ai/synthesis').send({ prompt: 'status' }).expect(200);
    expect(body.source).toBe('cached');
    expect(body.reason).toBeTruthy();
    expect(body.text).toContain('static fallback');
  });
});

describe('invariants hold under arbitrary sequences', () => {
  it('stays balanced after a mixed workload', async () => {
    await request(app).post('/api/claim/upload').send(CLEAN_SUBMISSION);
    await request(app).post('/api/claim/upload').send(DUPLICATE_SUBMISSION);
    await request(app).post('/api/claim/action').send({ docId: 'CLM-2026-004', action: 'reject' });
    await request(app).post('/api/claim/action').send({ docId: 'CLM-2026-002', action: 'approve' });
    await request(app).post('/api/caregaps/trigger').send({ gapId: 'GAP-101' });
    await request(app).post('/api/caregaps/trigger').send({ gapId: 'GAP-101' });

    const { body } = await request(app).get('/api/data').expect(200);
    const s = body.financialSummary;

    expect(s.gross_savings_zar).toBe(s.realised_admin_savings_zar + s.avoided_leakage_zar);
    expect(s.savings_reinvestment_pool_zar).toBe(s.gross_savings_zar - s.preventative_outlay_zar);
    expect(s.auto_approved_count + s.flagged_review_count + s.rejected_count).toBe(s.total_claims_count);
    expect(Number.isFinite(s.savings_reinvestment_pool_zar)).toBe(true);
    expect(s.savings_reinvestment_pool_zar).toBeGreaterThanOrEqual(0);
  });

  it('serves a bounded working set while summarising the whole ledger', async () => {
    const { body } = await request(app).get('/api/data').expect(200);

    // The feed is capped; the summary is not. Recomputing from the subset is
    // therefore expected to differ - that is the contract, not a defect.
    expect(body.claims_total).toBe(seedClaims.length);
    expect(body.claims.length).toBeLessThan(body.claims_total);
    expect(body.financialSummary.total_claims_count).toBe(body.claims_total);

    // Everything awaiting a decision that fits the cap is present, newest first.
    expect(body.claims.some((c: { status: string }) => c.status === 'flagged')).toBe(true);
    expect(computeFinancialSummary(body.claims, body.careGaps).total_claims_count)
      .not.toBe(body.financialSummary.total_claims_count);
  });
});
