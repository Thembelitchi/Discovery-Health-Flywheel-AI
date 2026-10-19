/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * In-browser implementation of the claims API, for the standalone build.
 *
 * The console normally talks to the Express server in `server.ts`. This shim
 * intercepts `fetch` for `/api/*` and answers from the SAME modules the server
 * uses - `./ledger`, `./adjudication`, `./schemas`, `./seed` - so a static,
 * single-file build behaves identically to the served app without a backend.
 *
 * No component changes: the UI keeps calling `fetch("/api/data")` as before.
 */

import { adjudicate, formatDocumentId } from './adjudication';
import { computeFinancialSummary, ledgerViolations, withDerivedAmounts } from './ledger';
import {
  aiSynthesisSchema,
  careGapTriggerSchema,
  claimActionSchema,
  claimSubmissionSchema,
  formatIssues,
} from './schemas';
import { seedCareGaps, seedClaims, seedMembers, seedProviders } from './seed';
import { CareGap, Claim } from '../types';
import { ZodError, ZodTypeAny, z } from 'zod';

/** Per-visitor ledger. Resets on reload; nothing leaves the browser. */
const members = structuredClone(seedMembers);
const providers = structuredClone(seedProviders);
const claims: Claim[] = structuredClone(seedClaims);
const careGaps: CareGap[] = structuredClone(seedCareGaps);
let claimSequence = claims.length;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Mirrors the server's 400-with-field-issues contract. */
function parse<S extends ZodTypeAny>(schema: S, body: unknown): { ok: true; value: z.infer<S> } | { ok: false; response: Response } {
  try {
    return { ok: true, value: schema.parse(body ?? {}) };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        response: json({ error: 'Invalid request body', issues: formatIssues(error) }, 400),
      };
    }
    throw error;
  }
}

function snapshot() {
  return {
    members,
    providers,
    claims: claims.map(withDerivedAmounts),
    careGaps,
    financialSummary: computeFinancialSummary(claims, careGaps),
  };
}

/** Static narrative served when no model is reachable. Labelled as such. */
function cachedNarrative(pool: number, openGaps: number): string {
  return `### Flywheel status (cached narrative)

This text is a **static fallback**, not model output. It is shown when no model is
available to this page, so the console stays usable offline.

* **Reinvestment pool:** R ${pool.toLocaleString('en-ZA')} available to fund preventative care.
* **Open care gaps:** ${openGaps} awaiting dispatch.
* **Suggested next step:** fund the highest-risk open gap, then re-run this synthesis.`;
}

/**
 * Asks Claude when the page was granted the `sample` capability, so the
 * synthesis hub is genuinely live in a published artifact. Falls back to the
 * cached narrative otherwise, and always reports which one it served.
 */
async function synthesise(prompt: string | undefined) {
  const summary = computeFinancialSummary(claims, careGaps);
  const openGaps = careGaps.filter((gap) => gap.status === 'open');
  const fallback = cachedNarrative(summary.savings_reinvestment_pool_zar, openGaps.length);

  type SampleFn = ((input: string) => Promise<{ text: string }>) | null;
  const claudeApi = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;

  let sample: SampleFn = null;
  if (claudeApi?.use) {
    try {
      sample = (await claudeApi.use('sample')) as SampleFn;
    } catch {
      sample = null;
    }
  }

  if (!sample) {
    return json({
      text: fallback,
      source: 'cached',
      reason: 'No model is available to this page',
      model: null,
    });
  }

  const brief = `You are an analyst reporting to a medical scheme's clinical and finance team.
Use only the figures below. Be concrete and quantitative, name specific claim and gap ids, and
recommend a next action. Do not invent figures. Amounts are South African Rand. Max 220 words.
Plain prose, no markdown headers.

Claims: ${summary.total_claims_count} total, ${summary.auto_approved_count} approved, ${summary.flagged_review_count} flagged, ${summary.rejected_count} declined.
Realised administrative savings: ZAR ${summary.realised_admin_savings_zar}.
Avoided leakage on declined claims: ZAR ${summary.avoided_leakage_zar}.
Reinvestment pool available: ZAR ${summary.savings_reinvestment_pool_zar}.
Already disbursed to preventative care: ZAR ${summary.preventative_outlay_zar}.
Flagged claims: ${claims.filter((c) => c.status === 'flagged').map((c) => `${c.document_id} (${c.fields.member.name}, R${c.fields.amounts.total_claimed}, failed ${c.validation_results.failed.join(', ') || 'nothing'})`).join('; ') || 'none'}.
Open care gaps: ${openGaps.map((g) => `${g.id} ${g.gap_type} (${g.member_name}, ${g.risk_level} risk, R${g.subsidized_cost_zar})`).join('; ') || 'none'}.

Analyst request: ${prompt || 'Give a general efficiency assessment.'}`;

  try {
    const result = await sample(brief);
    if (!result?.text) throw new Error('Empty response');
    return json({ text: result.text, source: 'live', model: 'claude' });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Model call failed';
    return json({ text: fallback, source: 'cached', reason, model: null });
  }
}

async function handle(path: string, method: string, body: unknown): Promise<Response | null> {
  if (path === '/api/data' && method === 'GET') {
    const violations = ledgerViolations(claims, careGaps);
    if (violations.length) {
      return json({ error: 'Ledger invariant violated', violations }, 500);
    }
    return json(snapshot());
  }

  if (path === '/api/claim/upload' && method === 'POST') {
    const parsed = parse(claimSubmissionSchema, body);
    if (!parsed.ok) return parsed.response;

    claimSequence += 1;
    const claim = adjudicate(parsed.value, { claims, members, providers }, formatDocumentId(claimSequence));
    claims.unshift(claim);

    return json({
      success: true,
      claim: withDerivedAmounts(claim),
      financialSummary: computeFinancialSummary(claims, careGaps),
    }, 201);
  }

  if (path === '/api/claim/action' && method === 'POST') {
    const parsed = parse(claimActionSchema, body);
    if (!parsed.ok) return parsed.response;

    const claim = claims.find((c) => c.document_id === parsed.value.docId);
    if (!claim) return json({ error: `No claim with document_id ${parsed.value.docId}` }, 404);

    const target = parsed.value.action === 'approve' ? 'approved' : 'rejected';
    const alreadyApplied = claim.status === target;

    if (!alreadyApplied) {
      claim.status = target;
      claim.fhir_claim.status = target === 'approved' ? 'active' : 'draft';
      if (target === 'rejected') {
        claim.rejection_reason = parsed.value.reason ?? 'Declined on manual audit.';
      } else {
        delete claim.rejection_reason;
      }
    }

    return json({
      success: true,
      alreadyApplied,
      claims: claims.map(withDerivedAmounts),
      financialSummary: computeFinancialSummary(claims, careGaps),
    });
  }

  if (path === '/api/caregaps/trigger' && method === 'POST') {
    const parsed = parse(careGapTriggerSchema, body);
    if (!parsed.ok) return parsed.response;

    const gap = careGaps.find((g) => g.id === parsed.value.gapId);
    if (!gap) return json({ error: `No care gap with id ${parsed.value.gapId}` }, 404);

    if (gap.status === 'open') {
      gap.status = 'intervention_sent';
      gap.intervention_notes = parsed.value.note ?? 'Reinvestment voucher dispatched to the member for booking.';
    } else if (gap.status === 'intervention_sent') {
      const pool = computeFinancialSummary(claims, careGaps).savings_reinvestment_pool_zar;
      if (pool < gap.subsidized_cost_zar) {
        return json({
          error: 'Insufficient funds in the reinvestment pool',
          required_zar: gap.subsidized_cost_zar,
          available_zar: pool,
        }, 409);
      }
      gap.status = 'resolved';
      gap.resolved_date = new Date().toISOString().split('T')[0];
      gap.intervention_notes = `Funded from the Flywheel reinvestment pool. Voucher redeemed ${gap.resolved_date}.`;
    }

    return json({
      success: true,
      careGaps,
      financialSummary: computeFinancialSummary(claims, careGaps),
    });
  }

  if (path === '/api/ai/synthesis' && method === 'POST') {
    const parsed = parse(aiSynthesisSchema, body);
    if (!parsed.ok) return parsed.response;
    return synthesise(parsed.value.prompt);
  }

  return null;
}

/** Replaces `window.fetch` for `/api/*` only; everything else passes through. */
export function installBrowserApi() {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];

    if (!path.startsWith('/api/')) return realFetch(input as RequestInfo, init);

    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let body: unknown;
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = undefined;
      }
    }

    const response = await handle(path, method, body);
    return response ?? json({ error: `No route for ${method} ${path}` }, 404);
  };
}
